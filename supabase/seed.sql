-- Data contoh. Jalankan hanya di basis percobaan, bukan pada data klien sungguhan.
-- Semua baris bertanda sample = true.

insert into public.clients (id, name, whatsapp, email, address, institution, student_status, sample)
values (
  '33333333-3333-4333-8333-333333333333',
  'Sari Putri',
  '081200001111',
  'sari@contoh.id',
  'Sintang',
  '',
  '',
  true
)
on conflict (id) do nothing;

insert into public.orders (
  id, code, client_id, package_id, brand, title, brief, stage, price, dp_percent, due_date,
  assignee_id, revision_limit, offer_expires, sample
)
values (
  '44444444-4444-4444-8444-444444444444',
  'ORD/STD/901/XI/2026',
  '33333333-3333-4333-8333-333333333333',
  'undangan-premium',
  'studio',
  'Undangan digital Premium',
  'Data contoh untuk uji alur. Bukan pesanan sungguhan.',
  'pengerjaan',
  350000,
  50,
  current_date + 7,
  '11111111-1111-4111-8111-111111111111',
  2,
  current_date + 7,
  true
)
on conflict (id) do nothing;
