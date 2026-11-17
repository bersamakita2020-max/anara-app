-- 006 Berkas order. Unggah dari dasbor memakai peran yang berwenang.

insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', false)
on conflict (id) do nothing;

drop policy if exists order_files_read on storage.objects;
create policy order_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'order-files'
    and private.current_role() in ('owner', 'finance', 'worker')
  );

drop policy if exists order_files_write on storage.objects;
create policy order_files_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'order-files'
    and private.current_role() in ('owner', 'finance', 'worker')
  );

drop policy if exists order_files_update on storage.objects;
create policy order_files_update on storage.objects for update to authenticated
  using (bucket_id = 'order-files' and private.current_role() in ('owner', 'finance'))
  with check (bucket_id = 'order-files' and private.current_role() in ('owner', 'finance'));
