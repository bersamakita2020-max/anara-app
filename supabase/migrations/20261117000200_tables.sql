-- 002 Tabel inti. Idempoten. RLS dipasang di migrasi 004.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'client' check (role in ('owner', 'finance', 'worker', 'social', 'client')),
  whatsapp text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.packages (
  id text primary key,
  slug text not null unique,
  brand text not null check (brand in ('studio', 'edukasi', 'tech')),
  name text not null,
  summary text not null default '',
  price_min bigint not null check (price_min >= 0),
  price_max bigint not null check (price_max >= price_min),
  fixed boolean not null default false,
  revisions int not null default 2,
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text not null default '',
  address text not null default '',
  institution text not null default '',
  student_status text not null default '' check (student_status in ('', 'reguler', 'rpl')),
  notes text not null default '',
  sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  whatsapp text not null default '',
  title text not null default '',
  brand text not null default 'semua' check (brand in ('studio', 'edukasi', 'tech', 'semua')),
  active boolean not null default true,
  sample boolean not null default false
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_id uuid references public.clients (id) on delete restrict,
  package_id text references public.packages (id),
  brand text not null check (brand in ('studio', 'edukasi', 'tech')),
  title text not null,
  brief text not null default '',
  stage text not null default 'masuk_brief',
  price bigint not null check (price >= 0),
  dp_percent int not null default 50 check (dp_percent between 0 and 100),
  due_date date,
  assignee_id uuid references public.workers (id) on delete set null,
  referrer text not null default '',
  revision_count int not null default 0,
  revision_limit int not null default 2,
  student_status text not null default '',
  campus text not null default '',
  script_type text not null default '',
  started_at timestamptz,
  warranty_until date,
  offer_expires date,
  sample boolean not null default false,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders drop constraint if exists orders_stage_check;
alter table public.orders add constraint orders_stage_check check (stage in (
  'masuk_brief', 'penawaran', 'kontrak', 'menunggu_dp', 'pengerjaan', 'revisi',
  'menunggu_pelunasan', 'serah_terima', 'selesai', 'ditahan', 'batal'
));

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  stage text not null,
  note text not null default '',
  actor text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.sop_checks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  stage text not null,
  sop text not null,
  label text not null,
  done boolean not null default false,
  sort int not null default 0
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('dp', 'pelunasan')),
  number text not null unique,
  amount bigint not null check (amount >= 0),
  status text not null default 'terbit' check (status in ('terbit', 'sebagian', 'lunas', 'batal')),
  due_date date,
  issued_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id) on delete set null,
  order_id uuid not null references public.orders (id) on delete cascade,
  amount bigint not null check (amount >= 0),
  status text not null default 'menunggu' check (status in ('menunggu', 'terverifikasi', 'ditolak')),
  proof_name text not null default '',
  note text not null default '',
  paid_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.finance_splits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  phase int not null check (phase in (1, 2, 3)),
  gross bigint not null,
  referral bigint not null default 0,
  base bigint not null,
  worker_amount bigint not null,
  cash_amount bigint not null,
  ops_amount bigint not null,
  profit_amount bigint not null,
  owner_profit bigint not null,
  partner_profit bigint not null,
  worker_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  category text not null,
  amount bigint not null check (amount >= 0),
  memo text not null default '',
  sample boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.contract_templates (
  key text primary key,
  name text not null,
  prefix text not null default '',
  body text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  template_key text references public.contract_templates (key),
  number text not null default '',
  title text not null default '',
  body text not null default '',
  status text not null default 'draf' check (status in ('draf', 'terkirim', 'disetujui')),
  signer_name text not null default '',
  signed_at timestamptz,
  ip text not null default '',
  user_agent text not null default '',
  otp_hint text,
  otp_hash text,
  attempts int not null default 0,
  sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('studio', 'edukasi', 'tech')),
  title text not null,
  caption text not null default '',
  published boolean not null default false,
  sample boolean not null default false
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  quote text not null,
  stars int not null default 5 check (stars between 1 and 5),
  published boolean not null default false,
  sample boolean not null default false
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text not null default '',
  action text not null,
  entity text not null default '',
  entity_id text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  href text not null default '',
  read boolean not null default false,
  for_role text not null default 'semua',
  created_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  key text primary key,
  title text not null,
  detail text not null default '',
  message text not null default '',
  enabled boolean not null default true,
  group_name text not null default 'pemberitahuan'
);

create table if not exists public.app_settings (
  id int primary key check (id = 1),
  payload jsonb not null
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  period text not null unique,
  status text not null default 'draf' check (status in ('draf', 'siap', 'disetujui', 'dibayar')),
  note text not null default '',
  report jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wa_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'wa' check (channel in ('wa', 'email')),
  to_address text not null default '',
  body text not null default '',
  href text not null default '',
  status text not null default 'siap' check (status in ('siap', 'terkirim', 'gagal')),
  created_at timestamptz not null default now()
);

create index if not exists orders_stage_idx on public.orders (stage);
create index if not exists orders_assignee_idx on public.orders (assignee_id);
create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists audit_created_idx on public.audit_log (created_at desc);
