-- 007 Jadwal. Melewati dengan aman jika pg_cron belum diaktifkan di proyek.
-- Jam 01:00 UTC = 08:00 WIB.

do $$
begin
  create extension if not exists pg_cron with schema pg_catalog;
exception when others then
  raise notice 'pg_cron belum tersedia: %', sqlerrm;
  return;
end $$;

do $$
begin
  perform cron.unschedule('anara-harian');
exception when others then null;
end $$;

do $$
begin
  perform cron.unschedule('anara-mingguan');
exception when others then null;
end $$;

do $$
begin
  perform cron.schedule('anara-harian', '0 1 * * *', 'select private.run_daily_maintenance()');
exception when others then
  raise notice 'Jadwal harian dilewati: %', sqlerrm;
end $$;

do $$
begin
  perform cron.schedule('anara-mingguan', '30 1 * * 1', 'select private.run_weekly_backup()');
exception when others then
  raise notice 'Jadwal mingguan dilewati: %', sqlerrm;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when others then
  raise notice 'realtime orders: %', sqlerrm;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.payments;
exception when others then
  raise notice 'realtime payments: %', sqlerrm;
end $$;
