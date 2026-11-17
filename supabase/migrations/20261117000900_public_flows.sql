-- Kontrak dapat dibaca pelanggan untuk persetujuan, tanpa kode rahasia.
-- Penerbitan kontrak dari dasbor menyimpan hash kode.
-- Jejak audit boleh ditambah oleh tim, tidak boleh dihapus.

create or replace function private.get_public_contract(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.contracts;
begin
  select * into row from public.contracts where id = p_id;
  if row.id is null then
    return null;
  end if;
  return jsonb_build_object(
    'id', row.id,
    'orderId', row.order_id,
    'number', row.number,
    'title', row.title,
    'body', row.body,
    'status', row.status,
    'signerName', row.signer_name,
    'signedAt', row.signed_at
  );
end;
$$;

create or replace function public.get_public_contract(p_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_public_contract(p_id)
$$;

revoke all on function private.get_public_contract(uuid) from public;
revoke all on function public.get_public_contract(uuid) from public;
grant execute on function private.get_public_contract(uuid) to anon, authenticated;
grant execute on function public.get_public_contract(uuid) to anon, authenticated;

create or replace function private.issue_contract(
  p_order_id uuid,
  p_template_key text,
  p_number text,
  p_title text,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  otp text;
begin
  if coalesce(private.current_role(), '') not in ('owner', 'finance') then
    raise exception 'Peran ini tidak berwenang menerbitkan kontrak';
  end if;
  otp := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
  insert into public.contracts (order_id, template_key, number, title, body, status, otp_hint, otp_hash)
  values (
    p_order_id,
    p_template_key,
    coalesce(p_number, ''),
    coalesce(p_title, ''),
    coalesce(p_body, ''),
    'draf',
    otp,
    extensions.crypt(otp, extensions.gen_salt('bf'))
  )
  returning id into new_id;
  perform private.audit(auth.uid(), coalesce(private.current_role(), ''), 'terbit', 'kontrak', new_id::text, coalesce(p_number, ''));
  return jsonb_build_object('id', new_id, 'number', coalesce(p_number, ''));
end;
$$;

create or replace function public.issue_contract(
  p_order_id uuid,
  p_template_key text,
  p_number text,
  p_title text,
  p_body text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.issue_contract(p_order_id, p_template_key, p_number, p_title, p_body)
$$;

revoke all on function private.issue_contract(uuid, text, text, text, text) from public;
revoke all on function public.issue_contract(uuid, text, text, text, text) from public;
grant execute on function private.issue_contract(uuid, text, text, text, text) to authenticated;
grant execute on function public.issue_contract(uuid, text, text, text, text) to authenticated;

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
  valid boolean := false;
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
  if row.otp_hash is not null and extensions.crypt(p_otp, row.otp_hash) = row.otp_hash then
    valid := true;
  elsif row.otp_hint is not null and row.otp_hint = p_otp then
    valid := true;
  end if;
  if not valid then
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

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log for insert to authenticated
  with check (private.current_role() in ('owner', 'finance', 'worker', 'social'));

drop policy if exists notes_insert on public.notifications;
create policy notes_insert on public.notifications for insert to authenticated
  with check (private.current_role() in ('owner', 'finance'));
