-- 001 Ekstensi dan skema internal.
-- Urutan migrasi ANARA: 001 extensions, 002 tables, 003 functions, 004 rls, 005 reference, 006 storage, 007 cron.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net dilewati: %', sqlerrm;
end $$;
