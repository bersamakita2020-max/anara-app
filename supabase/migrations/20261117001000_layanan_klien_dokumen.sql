-- Layanan yang dapat dikelola, klien yang ditautkan ulang, kontrak tanpa OTP,
-- segel QR, dan invoice yang bergerak sendiri.

alter table public.packages add column if not exists features text not null default '';
alter table public.packages add column if not exists lead_days int not null default 7;
alter table public.packages add column if not exists icon text not null default '';
alter table public.packages add column if not exists image_url text not null default '';

alter table public.contracts add column if not exists signature_data text;

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check
  check (status in ('terbit', 'sebagian', 'lunas', 'batal', 'terlambat'));

create table if not exists public.document_seals (
  token text primary key,
  doc_type text not null check (doc_type in ('kontrak', 'invoice')),
  doc_id uuid not null,
  doc_number text not null default '',
  signer_name text not null,
  signer_title text not null,
  issued_at timestamptz not null default now(),
  status text not null default 'asli' check (status in ('asli', 'batal'))
);
create index if not exists document_seals_doc_idx on public.document_seals (doc_type, doc_id);
alter table public.document_seals enable row level security;

create or replace function private.phone_key(p text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10)
$$;

create or replace function private.ensure_seals(p_type text, p_id uuid, p_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.document_seals
    where doc_type = p_type and doc_id = p_id and signer_title = 'Pemilik'
  ) then
    insert into public.document_seals (token, doc_type, doc_id, doc_number, signer_name, signer_title)
    values (gen_random_uuid()::text, p_type, p_id, coalesce(p_number, ''), 'M. Wilda Alfiansyah, A.Md.Kes.', 'Pemilik');
  end if;
  if not exists (
    select 1 from public.document_seals
    where doc_type = p_type and doc_id = p_id and signer_title = 'Manajer Keuangan'
  ) then
    insert into public.document_seals (token, doc_type, doc_id, doc_number, signer_name, signer_title)
    values (gen_random_uuid()::text, p_type, p_id, coalesce(p_number, ''), 'M. Fadilah Alkadri', 'Manajer Keuangan');
  end if;
  update public.document_seals set doc_number = coalesce(p_number, doc_number)
  where doc_type = p_type and doc_id = p_id;
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
  assignee uuid;
  phone text;
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
  phone := private.phone_key(payload ->> 'whatsapp');
  select c.id into client_id from public.clients c
  where private.phone_key(c.whatsapp) = phone and phone <> ''
  order by c.created_at limit 1;
  if client_id is null and length(btrim(coalesce(payload ->> 'email', ''))) > 3 then
    select c.id into client_id from public.clients c
    where lower(c.email) = lower(btrim(payload ->> 'email'))
    order by c.created_at limit 1;
  end if;
  if client_id is null then
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
  else
    update public.clients set
      name = btrim(payload ->> 'name'),
      whatsapp = btrim(coalesce(payload ->> 'whatsapp', whatsapp)),
      email = coalesce(nullif(payload ->> 'email', ''), email),
      address = coalesce(nullif(payload ->> 'address', ''), address),
      institution = coalesce(nullif(payload ->> 'institution', ''), institution)
    where id = client_id;
  end if;
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
    nullif(payload ->> 'dueDate', '')::date, assignee, coalesce(payload ->> 'referrer', ''), coalesce(pack.revisions, 2),
    coalesce(payload ->> 'studentStatus', ''), coalesce(payload ->> 'campus', ''), coalesce(payload ->> 'scriptType', ''),
    current_date + 7, coalesce(payload -> 'files', '[]'::jsonb)
  )
  returning id into order_id;
  perform private.seed_checks(order_id, pack.brand);
  insert into public.order_events (order_id, stage, note, actor) values (order_id, 'masuk_brief', 'Pesanan masuk dari formulir.', 'Klien');
  template_key := case pack.brand when 'studio' then 'studio' when 'tech' then 'tech' when 'edukasi' then 'edukasi' else 'umum' end;
  select * into template from public.contract_templates where key = template_key;
  number := case when template.prefix is null or template.prefix = '' then '' else private.next_code(template.prefix) end;
  insert into public.contracts (order_id, template_key, number, title, body, status)
  values (order_id, template_key, coalesce(number, ''), coalesce(template.name, 'Perjanjian'), coalesce(template.body, ''), 'terkirim')
  returning id into contract_id;
  perform private.ensure_seals('kontrak', contract_id, number);
  insert into public.notifications (title, body, href, for_role)
  values ('Pesanan baru', code || ' tercatat.', '/app/order/' || order_id::text, 'semua');
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
  phone text := private.phone_key(p_wa);
  owner_id uuid;
  current jsonb;
  history jsonb;
begin
  select o.client_id into owner_id
  from public.orders o
  join public.clients c on c.id = o.client_id
  where lower(o.code) = lower(btrim(p_code))
    and private.phone_key(c.whatsapp) = phone
    and phone <> ''
  limit 1;
  if owner_id is null then
    return null;
  end if;
  select jsonb_build_object(
    'code', o.code, 'title', o.title, 'brand', o.brand, 'stage', o.stage,
    'price', o.price, 'dueDate', o.due_date, 'contractId', (
      select ct.id from public.contracts ct where ct.order_id = o.id order by ct.created_at desc limit 1
    )
  ) into current
  from public.orders o
  where lower(o.code) = lower(btrim(p_code))
  limit 1;
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', o.code, 'title', o.title, 'brand', o.brand, 'stage', o.stage,
    'price', o.price, 'dueDate', o.due_date, 'createdAt', o.created_at
  ) order by o.created_at desc), '[]'::jsonb) into history
  from public.orders o
  join public.clients c on c.id = o.client_id
  where private.phone_key(c.whatsapp) = phone;
  return jsonb_build_object('current', current, 'history', history);
end;
$$;

drop function if exists public.sign_contract(uuid, text, text, boolean, text, text);
drop function if exists private.sign_contract(uuid, text, text, boolean, text, text);

create or replace function private.sign_contract(
  p_contract_id uuid,
  p_name text,
  p_agree boolean,
  p_signature text,
  p_ip text,
  p_ua text
)
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
  if length(btrim(coalesce(p_signature, ''))) < 3 then
    raise exception 'Bubuhkan tanda tangan';
  end if;
  select * into row from public.contracts where id = p_contract_id;
  if row.id is null then
    raise exception 'Kontrak tidak ditemukan';
  end if;
  if row.status = 'disetujui' then
    raise exception 'Kontrak ini sudah disetujui';
  end if;
  update public.contracts
    set status = 'disetujui',
        signer_name = btrim(p_name),
        signed_at = now(),
        ip = coalesce(p_ip, ''),
        user_agent = coalesce(p_ua, ''),
        signature_data = p_signature,
        otp_hint = null
    where id = row.id;
  perform private.ensure_seals('kontrak', row.id, row.number);
  if row.order_id is not null then
    select * into order_row from public.orders where id = row.order_id;
    update public.orders set stage = 'menunggu_dp'
    where id = order_row.id and stage in ('masuk_brief', 'penawaran', 'kontrak');
    update public.sop_checks set done = true where order_id = order_row.id and stage = 'kontrak';
    amount := round(order_row.price * order_row.dp_percent / 100.0);
    if not exists (select 1 from public.invoices where order_id = order_row.id and kind = 'dp') then
      insert into public.invoices (order_id, kind, number, amount, due_date, status)
      values (order_row.id, 'dp', private.next_code('INV/DP'), amount, current_date + 3, 'terbit');
    end if;
    insert into public.order_events (order_id, stage, note, actor)
    values (order_row.id, 'menunggu_dp', 'Kontrak disetujui.', btrim(p_name));
  end if;
  perform private.audit(null, btrim(p_name), 'setujui', 'kontrak', row.id::text, coalesce(p_ip, ''));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.sign_contract(
  p_contract_id uuid,
  p_name text,
  p_agree boolean,
  p_signature text,
  p_ip text,
  p_ua text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.sign_contract(p_contract_id, p_name, p_agree, p_signature, p_ip, p_ua)
$$;

revoke all on function private.sign_contract(uuid, text, boolean, text, text, text) from public;
revoke all on function public.sign_contract(uuid, text, boolean, text, text, text) from public;
grant execute on function private.sign_contract(uuid, text, boolean, text, text, text) to anon, authenticated;
grant execute on function public.sign_contract(uuid, text, boolean, text, text, text) to anon, authenticated;

create or replace function private.seals_json(p_type text, p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'token', token, 'signerName', signer_name, 'signerTitle', signer_title, 'issuedAt', issued_at, 'status', status
  ) order by signer_title), '[]'::jsonb)
  from public.document_seals
  where doc_type = p_type and doc_id = p_id
$$;

create or replace function private.get_public_contract(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.contracts;
  ord public.orders;
begin
  select * into row from public.contracts where id = p_id;
  if row.id is null then
    return null;
  end if;
  perform private.ensure_seals('kontrak', row.id, row.number);
  select * into ord from public.orders where id = row.order_id;
  return jsonb_build_object(
    'id', row.id,
    'orderId', row.order_id,
    'number', row.number,
    'title', row.title,
    'body', row.body,
    'status', row.status,
    'signerName', row.signer_name,
    'signedAt', row.signed_at,
    'signature', row.signature_data,
    'orderCode', ord.code,
    'service', ord.title,
    'price', ord.price,
    'dpPercent', ord.dp_percent,
    'brand', ord.brand,
    'dueDate', ord.due_date,
    'stage', ord.stage,
    'seals', private.seals_json('kontrak', row.id)
  );
end;
$$;

create or replace function private.get_public_invoice(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.invoices;
  ord public.orders;
  client_name text;
begin
  select * into row from public.invoices where id = p_id;
  if row.id is null then
    return null;
  end if;
  perform private.ensure_seals('invoice', row.id, row.number);
  select * into ord from public.orders where id = row.order_id;
  select c.name into client_name from public.clients c where c.id = ord.client_id;
  return jsonb_build_object(
    'id', row.id,
    'number', row.number,
    'kind', row.kind,
    'amount', row.amount,
    'status', row.status,
    'dueDate', row.due_date,
    'issuedAt', row.issued_at,
    'orderCode', ord.code,
    'service', ord.title,
    'clientName', client_name,
    'seals', private.seals_json('invoice', row.id)
  );
end;
$$;

create or replace function public.get_public_invoice(p_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_public_invoice(p_id)
$$;

create or replace function private.get_verification(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.document_seals;
begin
  select * into row from public.document_seals where token = p_token;
  if row.token is null then
    return jsonb_build_object('valid', false);
  end if;
  return jsonb_build_object(
    'valid', true,
    'status', row.status,
    'docType', row.doc_type,
    'docNumber', row.doc_number,
    'signerName', row.signer_name,
    'signerTitle', row.signer_title,
    'issuedAt', row.issued_at
  );
end;
$$;

create or replace function public.get_verification(p_token text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_verification(p_token)
$$;

revoke all on function public.get_public_invoice(uuid) from public;
revoke all on function public.get_verification(text) from public;
grant execute on function private.get_public_invoice(uuid) to anon, authenticated;
grant execute on function public.get_public_invoice(uuid) to anon, authenticated;
grant execute on function private.get_verification(text) to anon, authenticated;
grant execute on function public.get_verification(text) to anon, authenticated;

create or replace function private.on_invoice_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.ensure_seals('invoice', new.id, new.number);
  return new;
end;
$$;

drop trigger if exists invoices_seal on public.invoices;
create trigger invoices_seal
  after insert on public.invoices
  for each row execute function private.on_invoice_insert();

create or replace function private.on_order_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  paid bigint;
  rest bigint;
  inv_id uuid;
  inv_no text;
begin
  if new.stage in ('serah_terima', 'selesai') and old.stage is distinct from new.stage then
    select coalesce(sum(amount), 0) into paid from public.payments
    where order_id = new.id and status = 'terverifikasi';
    rest := greatest(new.price - paid, 0);
    if not exists (select 1 from public.invoices where order_id = new.id and kind = 'pelunasan') then
      inv_no := private.next_code('INV/LUN');
      insert into public.invoices (order_id, kind, number, amount, due_date, status)
      values (
        new.id, 'pelunasan', inv_no, rest, current_date + 7,
        case when rest = 0 then 'lunas' else 'terbit' end
      )
      returning id into inv_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_auto_invoice on public.orders;
create trigger orders_auto_invoice
  after update of stage on public.orders
  for each row execute function private.on_order_stage();

create or replace function private.run_daily_maintenance()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  update public.invoices
  set status = 'terlambat'
  where status in ('terbit', 'sebagian')
    and due_date is not null
    and due_date < current_date;
  for rec in
    select o.code, o.id, i.issued_at
    from public.invoices i
    join public.orders o on o.id = i.order_id
    where i.kind = 'dp' and i.status not in ('lunas', 'batal') and i.issued_at < now() - interval '2 days'
  loop
    insert into public.notifications (title, body, href, for_role)
    values ('DP belum masuk', rec.code, '/app/pembayaran', 'finance');
  end loop;
  update public.orders o set stage = 'ditahan'
  from public.invoices i
  where i.order_id = o.id and i.kind = 'pelunasan' and i.status not in ('lunas', 'batal')
    and i.issued_at < now() - interval '7 days' and o.stage <> 'ditahan';
  for rec in
    select i.number, o.code, c.whatsapp, i.amount
    from public.invoices i
    join public.orders o on o.id = i.order_id
    join public.clients c on c.id = o.client_id
    where i.status = 'terlambat'
      and not exists (
        select 1 from public.wa_outbox w
        where w.body like '%' || i.number || '%'
          and w.created_at::date = current_date
      )
  loop
    insert into public.wa_outbox (channel, to_address, body, href, status)
    values (
      'wa',
      rec.whatsapp,
      'Pengingat tagihan ' || rec.number || ' untuk ' || rec.code || ' sudah jatuh tempo.',
      'https://wa.me/62' || private.phone_key(rec.whatsapp) || '?text=' || replace('Pengingat tagihan ' || rec.number, ' ', '%20'),
      'siap'
    );
    insert into public.notifications (title, body, href, for_role)
    values ('Tagihan jatuh tempo', rec.number || ' · ' || rec.code, '/app/pembayaran', 'finance');
  end loop;
  if extract(day from current_date) = 5 then
    insert into public.settlements (period, status, note)
    values (to_char(current_date - interval '1 month', 'YYYY-MM'), 'siap', 'Disusun otomatis tanggal 5')
    on conflict (period) do nothing;
  end if;
end;
$$;

drop policy if exists packages_write on public.packages;
create policy packages_write on public.packages for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));
