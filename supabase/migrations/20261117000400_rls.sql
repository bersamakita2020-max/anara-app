-- 004 RLS. Penolakan bawaan. Peran dibaca dari profiles, bukan dari user_metadata.

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.clients enable row level security;
alter table public.workers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.sop_checks enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.finance_splits enable row level security;
alter table public.expenses enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;
alter table public.automation_rules enable row level security;
alter table public.app_settings enable row level security;
alter table public.settlements enable row level security;
alter table public.wa_outbox enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or private.current_role() in ('owner', 'finance'));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or private.current_role() = 'owner')
  with check (id = auth.uid() or private.current_role() = 'owner');

drop policy if exists packages_read on public.packages;
create policy packages_read on public.packages for select to anon, authenticated
  using (active or private.current_role() = 'owner');

drop policy if exists packages_write on public.packages;
create policy packages_write on public.packages for all to authenticated
  using (private.current_role() = 'owner')
  with check (private.current_role() = 'owner');

drop policy if exists clients_staff on public.clients;
create policy clients_staff on public.clients for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists clients_worker on public.clients;
create policy clients_worker on public.clients for select to authenticated
  using (
    private.current_role() = 'worker'
    and id in (
      select o.client_id from public.orders o
      join public.workers w on w.id = o.assignee_id
      where w.profile_id = auth.uid()
    )
  );

drop policy if exists workers_staff on public.workers;
create policy workers_staff on public.workers for all to authenticated
  using (private.current_role() in ('owner', 'finance') or profile_id = auth.uid())
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists orders_staff on public.orders;
create policy orders_staff on public.orders for select to authenticated
  using (
    private.current_role() in ('owner', 'finance')
    or (
      private.current_role() = 'worker'
      and assignee_id in (select id from public.workers where profile_id = auth.uid())
    )
  );

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (
    private.current_role() in ('owner', 'finance')
    or (
      private.current_role() = 'worker'
      and assignee_id in (select id from public.workers where profile_id = auth.uid())
    )
  )
  with check (
    private.current_role() in ('owner', 'finance')
    or (
      private.current_role() = 'worker'
      and assignee_id in (select id from public.workers where profile_id = auth.uid())
    )
  );

drop policy if exists events_read on public.order_events;
create policy events_read on public.order_events for select to authenticated
  using (
    order_id in (
      select id from public.orders
    )
  );

drop policy if exists events_write on public.order_events;
create policy events_write on public.order_events for insert to authenticated
  with check (private.current_role() in ('owner', 'finance', 'worker'));

drop policy if exists checks_rw on public.sop_checks;
create policy checks_rw on public.sop_checks for all to authenticated
  using (
    order_id in (select id from public.orders)
  )
  with check (private.current_role() in ('owner', 'finance', 'worker'));

drop policy if exists money_staff on public.invoices;
create policy money_staff on public.invoices for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists payments_staff on public.payments;
create policy payments_staff on public.payments for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists splits_read on public.finance_splits;
create policy splits_read on public.finance_splits for select to authenticated
  using (private.current_role() in ('owner', 'finance'));

drop policy if exists expenses_staff on public.expenses;
create policy expenses_staff on public.expenses for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists templates_staff on public.contract_templates;
create policy templates_staff on public.contract_templates for select to authenticated
  using (private.current_role() in ('owner', 'finance', 'worker', 'social'));

drop policy if exists templates_public_terms on public.contract_templates;
create policy templates_public_terms on public.contract_templates for select to anon, authenticated
  using (key = 'snk');

drop policy if exists templates_owner on public.contract_templates;
create policy templates_owner on public.contract_templates for update to authenticated
  using (private.current_role() = 'owner')
  with check (private.current_role() = 'owner');

drop policy if exists contracts_staff on public.contracts;
create policy contracts_staff on public.contracts for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists portfolio_read on public.portfolio_items;
create policy portfolio_read on public.portfolio_items for select to anon, authenticated
  using (published or private.current_role() in ('owner', 'social'));

drop policy if exists portfolio_write on public.portfolio_items;
create policy portfolio_write on public.portfolio_items for all to authenticated
  using (private.current_role() in ('owner', 'social'))
  with check (private.current_role() in ('owner', 'social') and (brand <> 'edukasi' or published = false));

drop policy if exists testi_read on public.testimonials;
create policy testi_read on public.testimonials for select to anon, authenticated
  using (published or private.current_role() in ('owner', 'social', 'finance'));

drop policy if exists testi_write on public.testimonials;
create policy testi_write on public.testimonials for all to authenticated
  using (private.current_role() in ('owner', 'social', 'finance'))
  with check (private.current_role() in ('owner', 'social', 'finance'));

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using (private.current_role() in ('owner', 'finance'));

drop policy if exists notes_read on public.notifications;
create policy notes_read on public.notifications for select to authenticated
  using (
    user_id = auth.uid()
    or for_role = 'semua'
    or for_role = private.current_role()
    or private.current_role() in ('owner', 'finance')
  );

drop policy if exists notes_update on public.notifications;
create policy notes_update on public.notifications for update to authenticated
  using (user_id = auth.uid() or private.current_role() in ('owner', 'finance'))
  with check (user_id = auth.uid() or private.current_role() in ('owner', 'finance'));

drop policy if exists rules_read on public.automation_rules;
create policy rules_read on public.automation_rules for select to authenticated
  using (private.current_role() in ('owner', 'finance'));

drop policy if exists rules_write on public.automation_rules;
create policy rules_write on public.automation_rules for update to authenticated
  using (private.current_role() = 'owner')
  with check (private.current_role() = 'owner');

drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to authenticated
  using (private.current_role() in ('owner', 'finance'));

drop policy if exists settings_write on public.app_settings;
create policy settings_write on public.app_settings for update to authenticated
  using (private.current_role() = 'owner')
  with check (private.current_role() = 'owner');

drop policy if exists settle_staff on public.settlements;
create policy settle_staff on public.settlements for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

drop policy if exists outbox_staff on public.wa_outbox;
create policy outbox_staff on public.wa_outbox for all to authenticated
  using (private.current_role() in ('owner', 'finance'))
  with check (private.current_role() in ('owner', 'finance'));

-- Publik boleh membaca katalog yang aktif. Penulisan lewat RPC security definer.
revoke insert, update, delete on public.orders from anon;
revoke insert, update, delete on public.clients from anon;
revoke insert, update, delete on public.payments from anon;
revoke insert, update, delete on public.contracts from anon;
