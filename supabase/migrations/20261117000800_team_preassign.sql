-- Peran tim yang sudah ditetapkan sebelum akun didaftarkan
create table if not exists private.team_preassign (
  email text primary key,
  role text not null check (role in ('owner','finance','worker','social')),
  full_name text not null
);

insert into private.team_preassign (email, role, full_name) values
  ('wildamari24@gmail.com', 'owner', 'M. Wilda Alfiansyah, A.Md.Kes.'),
  ('fadilahalkadri02@gmail.com', 'finance', 'M. Fadilah Alkadri')
on conflict (email) do update set role = excluded.role, full_name = excluded.full_name;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  pre private.team_preassign%rowtype;
begin
  select * into pre from private.team_preassign where email = lower(coalesce(new.email, ''));
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(pre.full_name, new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'pengguna'), '@', 1)),
    coalesce(new.email, ''),
    coalesce(pre.role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- Jika akun sudah terlanjur ada
update public.profiles p
set role = t.role, full_name = t.full_name
from private.team_preassign t
where lower(p.email) = t.email;
