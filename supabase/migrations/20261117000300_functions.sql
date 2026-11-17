-- 003 Fungsi internal, pemicu keuangan, dan pembungkus RPC.
-- Fungsi berhak istimewa tinggal di skema private. Pembungkus public hanya meneruskan.

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function private.audit(actor uuid, actor_name text, action text, entity text, entity_id text, detail text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, actor_name, action, entity, entity_id, detail)
  values (actor, coalesce(actor_name, ''), action, coalesce(entity, ''), coalesce(entity_id, ''), coalesce(detail, ''));
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'pengguna'), '@', 1)),
    coalesce(new.email, ''),
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and coalesce(private.current_role(), '') <> 'owner' then
    raise exception 'Peran hanya dapat diubah pemilik';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function private.guard_role_change();

create or replace function private.guard_order_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.price is distinct from old.price and coalesce(private.current_role(), '') <> 'owner' then
    raise exception 'Harga resmi hanya diubah pemilik';
  end if;
  if new.revision_count > new.revision_limit then
    raise exception 'Kuota revisi terlampaui';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_price on public.orders;
create trigger orders_guard_price
  before update on public.orders
  for each row execute function private.guard_order_price();

create or replace function private.active_phase(on_date date)
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  payload jsonb;
  auto boolean;
  phase int;
  month int;
begin
  select s.payload into payload from public.app_settings s where s.id = 1;
  auto := coalesce((payload ->> 'phaseAuto')::boolean, true);
  phase := coalesce((payload ->> 'phase')::int, 3);
  if auto then
    month := extract(month from coalesce(on_date, current_date));
    if month between 1 and 4 then phase := 1;
    elsif month between 5 and 9 then phase := 2;
    else phase := 3;
    end if;
  end if;
  return phase;
end;
$$;

create or replace function private.apply_split(order_row public.orders)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb;
  phase int;
  pct jsonb;
  worker_pct int;
  cash_pct int;
  ops_pct int;
  profit_pct int;
  owner_share int;
  referral bigint;
  base bigint;
  worker_amt bigint;
  ops_amt bigint;
  profit_amt bigint;
  cash_amt bigint;
  owner_amt bigint;
  partner_amt bigint;
  worker_name text;
begin
  if exists (select 1 from public.finance_splits where order_id = order_row.id) then
    return;
  end if;
  select s.payload into payload from public.app_settings s where s.id = 1;
  if coalesce((payload -> 'rulesEnabled' ->> 'split')::boolean, true) = false then
    return;
  end if;
  phase := private.active_phase(current_date);
  pct := payload -> 'splits' -> phase::text;
  worker_pct := coalesce((pct ->> 0)::int, case phase when 1 then 40 when 2 then 45 else 50 end);
  cash_pct := coalesce((pct ->> 1)::int, case phase when 1 then 30 else case when phase = 2 then 15 else 10 end end);
  ops_pct := coalesce((pct ->> 2)::int, 15);
  profit_pct := coalesce((pct ->> 3)::int, case phase when 1 then 15 else 25 end);
  owner_share := coalesce((payload ->> 'ownerShare')::int, 60);
  referral := case when length(btrim(order_row.referrer)) > 0 then round(order_row.price * 0.05) else 0 end;
  base := order_row.price - referral;
  worker_amt := round(base * worker_pct / 100.0);
  ops_amt := round(base * ops_pct / 100.0);
  profit_amt := round(base * profit_pct / 100.0);
  cash_amt := base - worker_amt - ops_amt - profit_amt;
  owner_amt := round(profit_amt * owner_share / 100.0);
  partner_amt := profit_amt - owner_amt;
  select w.name into worker_name from public.workers w where w.id = order_row.assignee_id;
  insert into public.finance_splits (
    order_id, phase, gross, referral, base, worker_amount, cash_amount, ops_amount, profit_amount, owner_profit, partner_profit, worker_name
  ) values (
    order_row.id, phase, order_row.price, referral, base, worker_amt, cash_amt, ops_amt, profit_amt, owner_amt, partner_amt, coalesce(worker_name, '')
  );
  if order_row.brand = 'tech' then
    update public.orders set warranty_until = current_date + 30 where id = order_row.id and warranty_until is null;
  end if;
  perform private.audit(auth.uid(), 'Sistem', 'bagi-hasil', 'order', order_row.id::text, order_row.code);
end;
$$;

create or replace function private.on_payment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.orders;
  paid bigint;
  dp_need bigint;
begin
  if new.status <> 'terverifikasi' then
    return new;
  end if;
  select * into order_row from public.orders where id = new.order_id;
  if order_row.id is null then
    return new;
  end if;
  select coalesce(sum(amount), 0) into paid from public.payments where order_id = order_row.id and status = 'terverifikasi';
  update public.invoices i
    set status = case
      when paid_sum.amount <= 0 then 'terbit'
      when paid_sum.amount >= i.amount then 'lunas'
      else 'sebagian'
    end
  from (
    select invoice_id, coalesce(sum(amount), 0) as amount
    from public.payments
    where order_id = order_row.id and status = 'terverifikasi'
    group by invoice_id
  ) paid_sum
  where i.id = paid_sum.invoice_id;
  dp_need := round(order_row.price * order_row.dp_percent / 100.0);
  if paid >= order_row.price then
    perform private.apply_split(order_row);
    update public.orders
      set stage = case when stage in ('menunggu_pelunasan', 'pengerjaan', 'revisi', 'menunggu_dp') then 'serah_terima' else stage end,
          started_at = coalesce(started_at, now())
      where id = order_row.id;
  elsif paid >= dp_need and order_row.stage = 'menunggu_dp' then
    update public.orders set stage = 'pengerjaan', started_at = coalesce(started_at, now()) where id = order_row.id;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_apply_split on public.payments;
create trigger payments_apply_split
  after insert or update of status on public.payments
  for each row execute function private.on_payment_change();

create or replace function private.seed_checks(order_id uuid, brand text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sop_work text := case brand when 'tech' then 'SOP-004' when 'edukasi' then 'SOP-005' else 'SOP-003' end;
begin
  insert into public.sop_checks (order_id, stage, sop, label, sort) values
    (order_id, 'masuk_brief', 'SOP-001', 'Kebutuhan, tenggat, dan kontak tercatat', 1),
    (order_id, 'masuk_brief', 'SOP-001', 'Status mahasiswa dicatat bila Edukasi', 2),
    (order_id, 'masuk_brief', 'SOP-001', 'Brief diteruskan ke penanggung jawab unit', 3),
    (order_id, 'penawaran', 'SOP-001', 'Lingkup, harga, tenggat, DP, dan revisi tertulis', 4),
    (order_id, 'penawaran', 'SOP-001', 'Masa berlaku penawaran 7 hari dicantumkan', 5),
    (order_id, 'kontrak', 'SOP-001', 'Kontrak bernomor terbit dari data order', 6),
    (order_id, 'kontrak', 'SOP-001', 'Klien menyetujui dengan nama terang dan kode', 7),
    (order_id, 'menunggu_dp', 'SOP-002', 'Tagihan uang muka terbit', 8),
    (order_id, 'menunggu_dp', 'SOP-002', 'Bukti transfer disimpan', 9),
    (order_id, 'menunggu_dp', 'SOP-002', 'Uang muka diverifikasi Manager Keuangan', 10),
    (order_id, 'pengerjaan', sop_work, 'Brief dan bahan diperiksa ulang', 11),
    (order_id, 'pengerjaan', sop_work, 'Jadwal tahap disampaikan ke klien', 12),
    (order_id, 'pengerjaan', sop_work, 'File kerja disimpan di folder usaha', 13),
    (order_id, 'pengerjaan', sop_work, 'Draf atau pratinjau dikirim', 14),
    (order_id, 'revisi', 'SOP-006', 'Masukan klien tercatat tanggalnya', 15),
    (order_id, 'revisi', 'SOP-006', 'Permintaan masih dalam lingkup dan kuota', 16),
    (order_id, 'revisi', 'SOP-006', 'Perbaikan dikirim kembali', 17),
    (order_id, 'menunggu_pelunasan', 'SOP-002', 'Tagihan pelunasan terbit', 18),
    (order_id, 'menunggu_pelunasan', 'SOP-002', 'Pelunasan diverifikasi sebelum file akhir', 19),
    (order_id, 'serah_terima', 'SOP-007', 'File akhir tanpa watermark diserahkan', 20),
    (order_id, 'serah_terima', 'SOP-007', 'Klien mengonfirmasi penerimaan', 21),
    (order_id, 'serah_terima', 'SOP-007', 'Izin testimoni ditanyakan', 22),
    (order_id, 'selesai', 'SOP-008', 'Bagi hasil tercatat sesuai fase', 23),
    (order_id, 'selesai', 'SOP-008', 'Folder order lengkap', 24);
end;
$$;

create or replace function private.next_code(prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  roman text[] := array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  tail text;
  seq int;
begin
  tail := roman[extract(month from current_date)::int] || '/' || extract(year from current_date)::int;
  select count(*) + 1 into seq from public.orders where code like prefix || '/%/' || tail;
  if prefix like 'ANR/%' or prefix like 'INV/%' then
    select count(*) + 1 into seq from public.contracts where number like prefix || '/%/' || tail;
  end if;
  if prefix like 'INV/%' then
    select count(*) + 1 into seq from public.invoices where number like prefix || '/%/' || tail;
  end if;
  return prefix || '/' || lpad(seq::text, 3, '0') || '/' || tail;
end;
$$;

create or replace function private.create_public_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  pack public.packages;
  client_id uuid;
  order_id uuid;
  price bigint;
  dp_percent int;
  code text;
  brand_prefix text;
  template_key text;
  template public.contract_templates;
  number text;
  contract_id uuid;
  otp text;
  assignee uuid;
begin
  select * into pack from public.packages where id = payload ->> 'packageId' and active;
  if pack.id is null then
    raise exception 'Paket tidak ditemukan';
  end if;
  if length(btrim(coalesce(payload ->> 'name', ''))) < 3 then
    raise exception 'Nama wajib diisi';
  end if;
  price := case when pack.fixed then pack.price_min else coalesce((payload ->> 'price')::bigint, pack.price_min) end;
  if price < pack.price_min or price > pack.price_max then
    price := pack.price_min;
  end if;
  dp_percent := case when price >= 3000000 then 70 else 50 end;
  insert into public.clients (name, whatsapp, email, address, institution, student_status)
  values (
    btrim(payload ->> 'name'),
    btrim(coalesce(payload ->> 'whatsapp', '')),
    coalesce(payload ->> 'email', ''),
    coalesce(payload ->> 'address', ''),
    coalesce(payload ->> 'institution', ''),
    case when payload ->> 'studentStatus' in ('reguler', 'rpl') then payload ->> 'studentStatus' else '' end
  )
  returning id into client_id;
  brand_prefix := case pack.brand when 'edukasi' then 'ORD/EDU' when 'tech' then 'ORD/TCH' else 'ORD/STD' end;
  code := private.next_code(brand_prefix);
  if pack.brand = 'edukasi' then
    select id into assignee from public.workers where name ilike '%Fadilah%' limit 1;
  else
    select id into assignee from public.workers where name ilike '%Wilda%' limit 1;
  end if;
  insert into public.orders (
    code, client_id, package_id, brand, title, brief, stage, price, dp_percent, due_date, assignee_id,
    referrer, revision_limit, student_status, campus, script_type, offer_expires, files
  ) values (
    code, client_id, pack.id, pack.brand, pack.name, coalesce(payload ->> 'brief', ''), 'masuk_brief', price, dp_percent,
    nullif(payload ->> 'dueDate', '')::date, assignee, coalesce(payload ->> 'referrer', ''), pack.revisions,
    coalesce(payload ->> 'studentStatus', ''), coalesce(payload ->> 'campus', ''), coalesce(payload ->> 'scriptType', ''),
    current_date + 7, coalesce(payload -> 'files', '[]'::jsonb)
  )
  returning id into order_id;
  perform private.seed_checks(order_id, pack.brand);
  insert into public.order_events (order_id, stage, note, actor) values (order_id, 'masuk_brief', 'Pesanan masuk dari formulir.', 'Klien');
  template_key := case pack.brand when 'studio' then 'studio' when 'tech' then 'tech' when 'edukasi' then 'edukasi' else 'umum' end;
  select * into template from public.contract_templates where key = template_key;
  number := case when template.prefix is null or template.prefix = '' then '' else private.next_code(template.prefix) end;
  otp := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
  insert into public.contracts (order_id, template_key, number, title, body, status, otp_hint, otp_hash)
  values (
    order_id, template_key, coalesce(number, ''), coalesce(template.name, 'Perjanjian'),
    coalesce(template.body, ''), 'terkirim', otp, extensions.crypt(otp, extensions.gen_salt('bf'))
  )
  returning id into contract_id;
  insert into public.notifications (title, body, href, for_role)
  values ('Pesanan baru', code || ' menunggu brief.', '/app/order/' || order_id::text, 'semua');
  perform private.audit(null, 'Klien', 'buat', 'order', order_id::text, code);
  return jsonb_build_object('code', code, 'orderId', order_id, 'contractId', contract_id, 'number', number);
end;
$$;

create or replace function private.track_order(p_code text, p_wa text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'code', o.code,
    'title', o.title,
    'brand', o.brand,
    'stage', o.stage,
    'price', o.price,
    'dueDate', o.due_date,
    'sample', o.sample
  ) into result
  from public.orders o
  join public.clients c on c.id = o.client_id
  where lower(o.code) = lower(btrim(p_code))
    and right(regexp_replace(c.whatsapp, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_wa, ''), '\D', '', 'g'), 10);
  return result;
end;
$$;

create or replace function private.sign_contract(p_contract_id uuid, p_name text, p_otp text, p_agree boolean, p_ip text, p_ua text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.contracts;
  order_row public.orders;
  amount bigint;
begin
  if coalesce(p_agree, false) = false then
    raise exception 'Centang persetujuan terlebih dahulu';
  end if;
  if length(btrim(coalesce(p_name, ''))) < 3 then
    raise exception 'Tuliskan nama terang';
  end if;
  select * into row from public.contracts where id = p_contract_id;
  if row.id is null then
    raise exception 'Kontrak tidak ditemukan';
  end if;
  if row.status = 'disetujui' then
    raise exception 'Kontrak ini sudah disetujui';
  end if;
  if row.attempts >= 5 then
    raise exception 'Percobaan kode sudah mencapai batas';
  end if;
  if row.otp_hash is null or extensions.crypt(p_otp, row.otp_hash) <> row.otp_hash then
    update public.contracts set attempts = attempts + 1 where id = row.id;
    raise exception 'Kode konfirmasi tidak sesuai';
  end if;
  update public.contracts
    set status = 'disetujui', signer_name = btrim(p_name), signed_at = now(), ip = coalesce(p_ip, ''), user_agent = coalesce(p_ua, ''), otp_hint = null
    where id = row.id;
  if row.order_id is not null then
    select * into order_row from public.orders where id = row.order_id;
    update public.orders set stage = 'menunggu_dp' where id = order_row.id and stage in ('masuk_brief', 'penawaran', 'kontrak');
    update public.sop_checks set done = true where order_id = order_row.id and stage = 'kontrak';
    amount := round(order_row.price * order_row.dp_percent / 100.0);
    if not exists (select 1 from public.invoices where order_id = order_row.id and kind = 'dp') then
      insert into public.invoices (order_id, kind, number, amount, due_date)
      values (order_row.id, 'dp', private.next_code('INV/DP'), amount, current_date + 3);
    end if;
    insert into public.order_events (order_id, stage, note, actor)
    values (order_row.id, 'menunggu_dp', 'Kontrak disetujui.', btrim(p_name));
  end if;
  perform private.audit(null, btrim(p_name), 'setujui', 'kontrak', row.id::text, coalesce(p_ip, ''));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function private.bootstrap_owner()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Masuk terlebih dahulu';
  end if;
  if exists (select 1 from public.profiles where role = 'owner') then
    raise exception 'Pemilik sudah ada';
  end if;
  update public.profiles set role = 'owner' where id = auth.uid() returning * into rec;
  return rec;
end;
$$;

create or replace function private.run_daily_maintenance()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  for rec in
    select o.code, o.id, i.issued_at
    from public.invoices i
    join public.orders o on o.id = i.order_id
    where i.kind = 'dp' and i.status <> 'lunas' and i.issued_at < now() - interval '2 days'
  loop
    insert into public.notifications (title, body, href, for_role)
    values ('DP belum masuk', rec.code, '/app/pembayaran', 'finance');
  end loop;
  for rec in
    select o.code from public.invoices i
    join public.orders o on o.id = i.order_id
    where i.kind = 'pelunasan' and i.status <> 'lunas' and i.issued_at < now() - interval '7 days'
  loop
    update public.orders o set stage = 'ditahan'
    from public.invoices i
    where i.order_id = o.id and i.kind = 'pelunasan' and i.status <> 'lunas' and i.issued_at < now() - interval '7 days' and o.stage <> 'ditahan';
  end loop;
  if extract(day from current_date) = 5 then
    insert into public.settlements (period, status, note)
    values (to_char(current_date - interval '1 month', 'YYYY-MM'), 'siap', 'Disusun otomatis tanggal 5')
    on conflict (period) do nothing;
    insert into public.notifications (title, body, href, for_role)
    values ('Laporan tanggal 5', 'Settlement bulan lalu siap ditinjau.', '/app/laporan', 'owner');
  end if;
end;
$$;

create or replace function private.run_weekly_backup()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (title, body, href, for_role)
  values ('Cadangan mingguan', 'Ringkasan data dapat diunduh dari laporan.', '/app/laporan', 'owner');
end;
$$;

revoke all on function private.create_public_order(jsonb) from public;
revoke all on function private.track_order(text, text) from public;
revoke all on function private.sign_contract(uuid, text, text, boolean, text, text) from public;
revoke all on function private.bootstrap_owner() from public;
grant execute on function private.create_public_order(jsonb) to anon, authenticated;
grant execute on function private.track_order(text, text) to anon, authenticated;
grant execute on function private.sign_contract(uuid, text, text, boolean, text, text) to anon, authenticated;
grant execute on function private.bootstrap_owner() to authenticated;
grant execute on function private.current_role() to anon, authenticated;

create or replace function public.create_public_order(payload jsonb)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_public_order(payload)
$$;

create or replace function public.track_order(p_code text, p_wa text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.track_order(p_code, p_wa)
$$;

create or replace function public.sign_contract(p_contract_id uuid, p_name text, p_otp text, p_agree boolean, p_ip text, p_ua text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.sign_contract(p_contract_id, p_name, p_otp, p_agree, p_ip, p_ua)
$$;

create or replace function public.bootstrap_owner()
returns public.profiles
language sql
security invoker
set search_path = ''
as $$
  select private.bootstrap_owner()
$$;

revoke all on function public.create_public_order(jsonb) from public;
revoke all on function public.track_order(text, text) from public;
revoke all on function public.sign_contract(uuid, text, text, boolean, text, text) from public;
revoke all on function public.bootstrap_owner() from public;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.sign_contract(uuid, text, text, boolean, text, text) to anon, authenticated;
grant execute on function public.bootstrap_owner() to authenticated;

grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.run_daily_maintenance() to service_role;
grant execute on function private.run_weekly_backup() to service_role;

create or replace function public.run_daily_maintenance()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.run_daily_maintenance();
end;
$$;

create or replace function public.run_weekly_backup()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.run_weekly_backup();
end;
$$;

revoke all on function public.run_daily_maintenance() from public, anon, authenticated;
revoke all on function public.run_weekly_backup() from public, anon, authenticated;
grant execute on function public.run_daily_maintenance() to service_role;
grant execute on function public.run_weekly_backup() to service_role;
