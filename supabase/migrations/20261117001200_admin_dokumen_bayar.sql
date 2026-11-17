-- Opsi isian, nomor dokumen, slip gaji, WhatsApp, dan pembayaran.
-- Aman dijalankan ulang di atas migrasi 010 dan 011. Tidak menyimpan kunci gateway.

create table if not exists public.option_lists (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists option_lists_cat_label_idx
  on public.option_lists (category, lower(label));
alter table public.option_lists enable row level security;
drop policy if exists option_lists_read on public.option_lists;
create policy option_lists_read on public.option_lists for select to authenticated
  using (private.current_role() in ('owner', 'finance', 'worker', 'social'));
drop policy if exists option_lists_write on public.option_lists;
create policy option_lists_write on public.option_lists for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

insert into public.option_lists (category, label, sort)
select v.category, v.label, v.sort
from (values
  ('kategori', 'Kuota', 1),
  ('kategori', 'Langganan', 2),
  ('kategori', 'Tools', 3),
  ('kategori', 'Operasional', 4),
  ('sumber_order', 'WhatsApp', 1),
  ('sumber_order', 'Instagram', 2),
  ('sumber_order', 'Referensi', 3),
  ('sumber_order', 'Datang langsung', 4),
  ('metode_bayar', 'Transfer bank', 1),
  ('metode_bayar', 'QRIS', 2),
  ('metode_bayar', 'Tunai', 3),
  ('jabatan', 'Pemilik', 1),
  ('jabatan', 'Manajer Keuangan', 2),
  ('jabatan', 'Pekerja lepas', 3),
  ('jabatan', 'Admin media sosial', 4),
  ('satuan', 'paket', 1),
  ('satuan', 'jam', 2),
  ('satuan', 'halaman', 3),
  ('satuan', 'item', 4)
) as v(category, label, sort)
where not exists (
  select 1 from public.option_lists o
  where o.category = v.category and lower(o.label) = lower(v.label)
);

create table if not exists private.doc_counters (
  kind text not null,
  period text not null,
  last_no int not null default 0,
  primary key (kind, period)
);

create or replace function private.next_doc_number(p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  per text := to_char(current_date, 'YYYY/MM');
  n int;
begin
  if p_kind not in ('ORD', 'KTR', 'INV', 'KWT', 'SLP') then
    raise exception 'Jenis nomor tidak dikenal';
  end if;
  insert into private.doc_counters (kind, period, last_no)
  values (p_kind, per, 1)
  on conflict (kind, period) do update
    set last_no = private.doc_counters.last_no + 1
  returning last_no into n;
  return 'ANR/' || p_kind || '/' || per || '/' || lpad(n::text, 4, '0');
end;
$$;

create or replace function private.preview_doc_number(p_kind text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  per text := to_char(current_date, 'YYYY/MM');
  n int;
begin
  if p_kind not in ('ORD', 'KTR', 'INV', 'KWT', 'SLP') then
    raise exception 'Jenis nomor tidak dikenal';
  end if;
  select last_no into n from private.doc_counters where kind = p_kind and period = per;
  return 'ANR/' || p_kind || '/' || per || '/' || lpad((coalesce(n, 0) + 1)::text, 4, '0');
end;
$$;

create or replace function public.preview_doc_number(p_kind text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.preview_doc_number(p_kind)
$$;
revoke all on function public.preview_doc_number(text) from public;
grant execute on function public.preview_doc_number(text) to authenticated;

create or replace function private.next_code(prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text := case
    when prefix ilike 'INV%' then 'INV'
    when prefix ilike 'ORD%' then 'ORD'
    when prefix ilike '%SLP%' then 'SLP'
    when prefix ilike '%KWT%' then 'KWT'
    else 'KTR'
  end;
begin
  return private.next_doc_number(kind);
end;
$$;

create or replace function public.add_option(p_category text, p_label text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing uuid;
  clean text := btrim(p_label);
begin
  if coalesce(private.current_role(), '') not in ('owner', 'finance') then
    raise exception 'Akses ditolak';
  end if;
  if clean = '' or btrim(coalesce(p_category, '')) = '' then
    raise exception 'Isian belum lengkap';
  end if;
  select id into existing from public.option_lists
  where category = p_category and lower(label) = lower(clean);
  if existing is not null then
    update public.option_lists set active = true where id = existing;
    return existing;
  end if;
  insert into public.option_lists (category, label)
  values (p_category, clean)
  returning id into existing;
  return existing;
end;
$$;
revoke all on function public.add_option(text, text) from public;
grant execute on function public.add_option(text, text) to authenticated;

alter table public.orders add column if not exists source text not null default '';

alter table public.invoices add column if not exists client_id uuid references public.clients (id);
alter table public.invoices add column if not exists discount bigint not null default 0;
alter table public.invoices add column if not exists tax_percent numeric not null default 0;
alter table public.invoices add column if not exists note text not null default '';
alter table public.invoices add column if not exists manual boolean not null default false;
alter table public.invoices add column if not exists unique_code int not null default 0;
alter table public.invoices alter column order_id drop not null;

alter table public.payments add column if not exists method text not null default '';
alter table public.payments add column if not exists receipt_number text not null default '';
alter table public.payments add column if not exists proof_path text not null default '';

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null default '',
  qty numeric not null default 1,
  unit text not null default 'paket',
  unit_price bigint not null default 0,
  sort int not null default 0
);
alter table public.invoice_items enable row level security;
drop policy if exists invoice_items_team on public.invoice_items;
create policy invoice_items_team on public.invoice_items for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  number text not null default '',
  period text not null,
  worker_id uuid references public.workers (id),
  recipient_name text not null,
  recipient_title text not null default '',
  status text not null default 'draf' check (status in ('draf', 'disetujui', 'dibayar')),
  lines jsonb not null default '[]'::jsonb,
  gross bigint not null default 0,
  deductions bigint not null default 0,
  net bigint not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz
);
create unique index if not exists payslips_number_idx on public.payslips (number) where number <> '';
alter table public.payslips enable row level security;
drop policy if exists payslips_team on public.payslips;
create policy payslips_team on public.payslips for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

create or replace function private.assign_doc_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'invoices' then
    if new.number is null or new.number = '' then
      new.number := private.next_doc_number('INV');
    end if;
    if coalesce(new.unique_code, 0) = 0 then
      new.unique_code := 100 + floor(random() * 900)::int;
    end if;
  elsif tg_table_name = 'payments' and (new.receipt_number is null or new.receipt_number = '') then
    new.receipt_number := private.next_doc_number('KWT');
  elsif tg_table_name = 'payslips' and (new.number is null or new.number = '') then
    new.number := private.next_doc_number('SLP');
  elsif tg_table_name = 'contracts' and (new.number is null or new.number = '') then
    new.number := private.next_doc_number('KTR');
  elsif tg_table_name = 'orders' and (new.code is null or new.code = '') then
    new.code := private.next_doc_number('ORD');
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_number on public.invoices;
create trigger invoices_number before insert on public.invoices
  for each row execute function private.assign_doc_number();
drop trigger if exists payments_number on public.payments;
create trigger payments_number before insert on public.payments
  for each row execute function private.assign_doc_number();
drop trigger if exists payslips_number on public.payslips;
create trigger payslips_number before insert on public.payslips
  for each row execute function private.assign_doc_number();
drop trigger if exists contracts_number on public.contracts;
create trigger contracts_number before insert on public.contracts
  for each row execute function private.assign_doc_number();
drop trigger if exists orders_number on public.orders;
create trigger orders_number before insert on public.orders
  for each row execute function private.assign_doc_number();

update public.invoices set unique_code = 100 + floor(random() * 900)::int where unique_code = 0;

create table if not exists public.wa_settings (
  id int primary key default 1 check (id = 1),
  provider text not null default 'none' check (provider in ('none', 'cloud', 'fonnte')),
  phone_number_id text not null default '',
  waba_id text not null default '',
  display_phone text not null default '0858-1169-9699',
  cloud_ready boolean not null default false,
  fonnte_ready boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.wa_settings (id) values (1) on conflict (id) do nothing;
alter table public.wa_settings enable row level security;
drop policy if exists wa_settings_read on public.wa_settings;
create policy wa_settings_read on public.wa_settings for select to authenticated
  using (private.current_role() in ('owner', 'finance'));
drop policy if exists wa_settings_write on public.wa_settings;
create policy wa_settings_write on public.wa_settings for update to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

create table if not exists private.wa_secrets (
  id int primary key default 1 check (id = 1),
  cloud_token text not null default '',
  fonnte_token text not null default '',
  verify_token text not null default ''
);
insert into private.wa_secrets (id) values (1) on conflict (id) do nothing;
alter table private.wa_secrets enable row level security;
revoke all on table private.wa_secrets from public, anon, authenticated;

create table if not exists public.wa_log (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('masuk', 'keluar')),
  peer text not null default '',
  body text not null default '',
  status text not null default 'antre',
  provider text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);
alter table public.wa_log enable row level security;
drop policy if exists wa_log_read on public.wa_log;
create policy wa_log_read on public.wa_log for select to authenticated
  using (private.current_role() in ('owner', 'finance'));

create or replace function public.wa_save_public(
  p_provider text,
  p_phone_number_id text,
  p_waba_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(private.current_role(), '') not in ('owner', 'finance') then
    raise exception 'Akses ditolak';
  end if;
  if p_provider not in ('none', 'cloud', 'fonnte') then
    raise exception 'Jalur tidak dikenal';
  end if;
  update public.wa_settings set
    provider = p_provider,
    phone_number_id = coalesce(p_phone_number_id, ''),
    waba_id = coalesce(p_waba_id, ''),
    updated_at = now()
  where id = 1;
end;
$$;
revoke all on function public.wa_save_public(text, text, text) from public;
grant execute on function public.wa_save_public(text, text, text) to authenticated;

create or replace function public.wa_store_secret(p_kind text, p_value text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Akses ditolak';
  end if;
  if p_kind = 'cloud' then
    update private.wa_secrets set cloud_token = p_value where id = 1;
    update public.wa_settings set cloud_ready = length(btrim(p_value)) > 0, updated_at = now() where id = 1;
  elsif p_kind = 'fonnte' then
    update private.wa_secrets set fonnte_token = p_value where id = 1;
    update public.wa_settings set fonnte_ready = length(btrim(p_value)) > 0, updated_at = now() where id = 1;
  elsif p_kind = 'verify' then
    update private.wa_secrets set verify_token = p_value where id = 1;
  else
    raise exception 'Jenis rahasia tidak dikenal';
  end if;
end;
$$;
revoke all on function public.wa_store_secret(text, text) from public, anon, authenticated;
grant execute on function public.wa_store_secret(text, text) to service_role;

create or replace function public.wa_dispatch_config()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.wa_settings;
  secret private.wa_secrets;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Akses ditolak';
  end if;
  select * into settings from public.wa_settings where id = 1;
  select * into secret from private.wa_secrets where id = 1;
  return jsonb_build_object(
    'provider', settings.provider,
    'phoneNumberId', settings.phone_number_id,
    'cloudToken', secret.cloud_token,
    'fonnteToken', secret.fonnte_token,
    'verifyToken', secret.verify_token
  );
end;
$$;
revoke all on function public.wa_dispatch_config() from public, anon, authenticated;
grant execute on function public.wa_dispatch_config() to service_role;

create table if not exists public.pay_settings (
  id int primary key default 1 check (id = 1),
  provider text not null default 'manual' check (provider in ('manual', 'midtrans', 'xendit', 'tripay', 'duitku')),
  sandbox boolean not null default true,
  qris_dynamic boolean not null default true,
  va_enabled boolean not null default false,
  bank_name text not null default '',
  bank_number text not null default '',
  bank_holder text not null default '',
  qris_path text not null default '',
  tripay_merchant text not null default '',
  duitku_merchant text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.pay_settings (id) values (1) on conflict (id) do nothing;
alter table public.pay_settings enable row level security;
drop policy if exists pay_settings_public_read on public.pay_settings;
create policy pay_settings_public_read on public.pay_settings for select to anon, authenticated
  using (true);
drop policy if exists pay_settings_write on public.pay_settings;
create policy pay_settings_write on public.pay_settings for update to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

create or replace function private.invoice_net(p_amount bigint, p_discount bigint, p_tax numeric)
returns bigint
language sql
immutable
as $$
  select greatest(0, round((coalesce(p_amount, 0) - coalesce(p_discount, 0)) * (100 + coalesce(p_tax, 0)) / 100.0))::bigint
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
  pay public.pay_settings;
  net bigint;
begin
  select * into row from public.invoices where id = p_id;
  if row.id is null then
    return null;
  end if;
  perform private.ensure_seals('invoice', row.id, row.number);
  select * into ord from public.orders where id = row.order_id;
  select c.name into client_name from public.clients c where c.id = coalesce(row.client_id, ord.client_id);
  select * into pay from public.pay_settings where id = 1;
  net := private.invoice_net(row.amount, row.discount, row.tax_percent);
  return jsonb_build_object(
    'id', row.id,
    'number', row.number,
    'kind', row.kind,
    'amount', row.amount,
    'discount', row.discount,
    'taxPercent', row.tax_percent,
    'note', row.note,
    'status', row.status,
    'dueDate', row.due_date,
    'issuedAt', row.issued_at,
    'orderCode', ord.code,
    'service', ord.title,
    'clientName', client_name,
    'uniqueCode', row.unique_code,
    'payable', net + row.unique_code,
    'net', net,
    'bankName', pay.bank_name,
    'bankNumber', pay.bank_number,
    'bankHolder', pay.bank_holder,
    'qrisPath', pay.qris_path,
    'provider', pay.provider,
    'sandbox', pay.sandbox,
    'qrisDynamic', pay.qris_dynamic,
    'vaEnabled', pay.va_enabled,
    'seals', private.seals_json('invoice', row.id)
  );
end;
$$;

create or replace function public.submit_payment_proof(
  p_invoice uuid,
  p_name text,
  p_path text,
  p_amount bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.invoices;
  new_id uuid;
  ord uuid;
begin
  select * into row from public.invoices where id = p_invoice;
  if row.id is null then
    raise exception 'Tagihan tidak ditemukan';
  end if;
  if row.status = 'lunas' then
    raise exception 'Tagihan ini sudah lunas';
  end if;
  ord := row.order_id;
  if ord is null then
    raise exception 'Tagihan manual dikonfirmasi dari dasbor';
  end if;
  insert into public.payments (invoice_id, order_id, amount, status, proof_name, proof_path, method, note)
  values (
    row.id,
    ord,
    greatest(coalesce(p_amount, row.amount), 0),
    'menunggu',
    coalesce(p_name, 'bukti'),
    coalesce(p_path, ''),
    'QRIS/transfer',
    'Kode unik ' || row.unique_code::text
  )
  returning id into new_id;
  insert into public.notifications (title, body, href, for_role)
  values ('Bukti bayar masuk', row.number || ' menunggu konfirmasi.', '/app/pembayaran', 'finance');
  return new_id;
end;
$$;
revoke all on function public.submit_payment_proof(uuid, text, text, bigint) from public;
grant execute on function public.submit_payment_proof(uuid, text, text, bigint) to anon, authenticated;

create or replace function public.mark_invoice_paid(p_invoice uuid, p_amount bigint, p_method text, p_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.invoices;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Akses ditolak';
  end if;
  select * into row from public.invoices where id = p_invoice;
  if row.id is null or row.order_id is null then
    return;
  end if;
  if exists (select 1 from public.payments where invoice_id = row.id and note = p_ref and status = 'terverifikasi') then
    return;
  end if;
  insert into public.payments (invoice_id, order_id, amount, status, proof_name, method, note, verified_at)
  values (row.id, row.order_id, greatest(p_amount, 0), 'terverifikasi', 'gateway', coalesce(p_method, 'QRIS'), p_ref, now());
  insert into public.notifications (title, body, href, for_role)
  values ('Pembayaran otomatis', row.number || ' ditandai lunas.', '/app/pembayaran', 'finance');
end;
$$;
revoke all on function public.mark_invoice_paid(uuid, bigint, text, text) from public, anon, authenticated;
grant execute on function public.mark_invoice_paid(uuid, bigint, text, text) to service_role;

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
  inv_paid bigint;
begin
  if new.invoice_id is not null then
    select coalesce(sum(amount), 0) into inv_paid
    from public.payments
    where invoice_id = new.invoice_id and status = 'terverifikasi';
    update public.invoices
      set status = case
        when inv_paid <= 0 then status
        when inv_paid >= private.invoice_net(amount, discount, tax_percent) then 'lunas'
        else 'sebagian'
      end
    where id = new.invoice_id and status <> 'batal';
  end if;
  if new.status <> 'terverifikasi' or new.order_id is null then
    return new;
  end if;
  select * into order_row from public.orders where id = new.order_id;
  if order_row.id is null then
    return new;
  end if;
  select coalesce(sum(amount), 0) into paid from public.payments
  where order_id = order_row.id and status = 'terverifikasi';
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

insert into storage.buckets (id, name, public)
values ('payment-assets', 'payment-assets', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists payment_assets_read on storage.objects;
create policy payment_assets_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'payment-assets');
drop policy if exists payment_assets_write on storage.objects;
create policy payment_assets_write on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-assets' and private.current_role() in ('owner', 'finance'));
drop policy if exists payment_assets_update on storage.objects;
create policy payment_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'payment-assets' and private.current_role() in ('owner', 'finance'))
  with check (bucket_id = 'payment-assets' and private.current_role() in ('owner', 'finance'));
drop policy if exists payment_proof_insert on storage.objects;
create policy payment_proof_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and name like 'bukti/%');
drop policy if exists payment_proof_read on storage.objects;
create policy payment_proof_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and private.current_role() in ('owner', 'finance'));
