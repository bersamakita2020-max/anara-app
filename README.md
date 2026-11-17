# ANARA

Aplikasi pemesanan, kontrak, keuangan, dan pemantauan ANARA. Tagline resmi: **ANARA, Beyond Value**.

Tiga unit: ANARA Studio (video, audio, video AI, undangan digital), ANARA Edukasi (pendampingan tesis, skripsi, KTI, dan tugas untuk mahasiswa reguler serta RPL), dan ANARA Tech (situs profil, aplikasi kerja, Android, flipbook).

Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0581-1699-699.

## Menjalankan di komputer

```bash
npm install
npm run dev
```

Buka `http://localhost:5173/anara-app/`.

Tanpa `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, aplikasi membangun dan menampilkan **mode contoh**. Data operasional bertanda contoh dan tersimpan di peramban. Peran dicoba dari halaman Masuk tim, tanpa kata sandi.

```bash
npm test
npm run build
```

## Proyek Supabase

Proyek: `wfmtjonhuvcqbbyoubbt`  
URL: `https://wfmtjonhuvcqbbyoubbt.supabase.co`  
Wilayah: `ap-southeast-1`

Jangan simpan service role key di repositori, di `.env` yang di-commit, atau di secrets GitHub Actions untuk situs statis. Kunci itu hanya tinggal di Supabase (edge function membacanya dari lingkungan fungsi).

### Urutan migrasi

Jalankan berkas di `supabase/migrations/` sesuai nama, dari atas ke bawah:

1. `20261117000100_extensions.sql` — skema `private` dan pgcrypto
2. `20261117000200_tables.sql` — tabel
3. `20261117000300_functions.sql` — bagi hasil, pemicu, RPC publik
4. `20261117000400_rls.sql` — hak akses baris
5. `20261117000500_reference.sql` — harga resmi, tujuh templat, aturan, dua pengurus
6. `20261117000600_storage.sql` — ember `order-files`
7. `20261117000700_cron.sql` — pengingat harian dan cadangan mingguan

Di SQL Editor, tempel isi tiap berkas lalu jalankan. Jika `pg_cron` belum dinyalakan, migrasi 007 hanya menulis catatan dan tidak menggagalkan yang lain. Aktifkan `pg_cron` dan `pg_net` di Database → Extensions bila jadwal ingin hidup.

`supabase/seed.sql` berisi satu klien dan satu order bertanda contoh. Jalankan hanya di basis percobaan.

### Pemilik pertama

1. Authentication → Providers → Email. Untuk percobaan, konfirmasi surel boleh dimatikan.
2. Daftar dari halaman Masuk tim, atau buat pengguna di Authentication → Users.
3. Jalankan SQL ini dengan surel pemilik (M. Wilda Alfiansyah):

```sql
update public.profiles
set role = 'owner',
    full_name = 'M. Wilda Alfiansyah, A.Md.Kes.'
where email = 'SUREL_PEMILIK';
```

Bila belum ada pemilik sama sekali, pengguna yang sedang masuk juga bisa memanggil `select public.bootstrap_owner();`.

Mitra keuangan (M. Fadilah Alkadri) didaftarkan dengan cara yang sama, lalu:

```sql
update public.profiles
set role = 'finance',
    full_name = 'M. Fadilah Alkadri'
where email = 'SUREL_MITRA';
```

Peran lain: `worker` (hanya order yang ditugaskan) dan `social` (portofolio, tanpa kas). Hubungkan `workers.profile_id` ke `profiles.id` agar papan pekerja menyaring tugasnya.

### Secrets GitHub

Nama yang dipakai build Pages:

| Secret | Isi |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://wfmtjonhuvcqbbyoubbt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | kunci anon / publishable dari Settings → API |

Keduanya sudah berupa kunci publik peramban. Service role tidak masuk ke sini.

Secrets Supabase (bukan GitHub), opsional, untuk edge function:

| Secret | Kegunaan |
| --- | --- |
| `FONNTE_TOKEN` | kirim templat WhatsApp. Kosongkan untuk tetap memakai tautan `wa.me` |
| `RESEND_API_KEY` | surel, hanya jika klien mengisi alamat surel |
| `MAIL_FROM` | alamat pengirim setelah ada surel usaha |
| `CRON_SECRET` | header `x-cron-secret` untuk fungsi jadwal |

Deploy fungsi:

```bash
supabase functions deploy wa-notify
supabase functions deploy email-notify
supabase functions deploy cron-daily
supabase functions deploy cron-monthly
supabase functions deploy cron-weekly
```

## GitHub Pages

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Workflow `.github/workflows/pages.yml` membangun `dist` dengan basis `/anara-app/` dan menyalin `404.html` agar tautan langsung tetap membuka aplikasi.
3. Situs: `https://<pemilik>.github.io/anara-app/`.

Jika secret belum terisi saat build, situs tetap naik dalam mode contoh.

## Pemakaian singkat

- Katalog memuat harga resmi. Undangan Basic Rp250.000, Premium Rp350.000, Exclusive Rp500.000. Kisaran lain dikunci pada penawaran (berlaku tujuh hari) dari dasbor.
- Formulir pesanan menyimpan brief dan nama berkas, menerbitkan kontrak, lalu meminta persetujuan: nama terang, centang, dan kode. Jejak menyimpan waktu dan IP.
- Uang muka standar 50 persen. Order Rp3 juta ke atas memakai 70 persen. Kerja dimulai setelah DP diverifikasi. Dua putaran revisi. Pembatalan sebelum mulai mengembalikan DP dipotong 10 persen. Setelah mulai, DP tidak kembali. Garansi bug Tech 30 hari.
- Papan order mengikuti tahap SOP 001–011 beserta checklist. Edukasi jatuh ke mitra keuangan, Studio dan Tech ke pemilik, sampai dialihkan.
- Saat pelunasan diverifikasi, hasil terbagi sesuai fase: Jan–Apr 40/30/15/15, Mei–Sep 45/15/15/25, Okt–Des 50/10/15/25. Laba 60 persen pemilik dan 40 persen mitra. Referral 5 persen hanya jika perujuk tercatat. Dana darurat mengunci 20 persen kas sampai Rp5 juta. Honor peran Rp300.000 / Rp500.000 / Rp750.000 per fase, dari operasional. Settlement tanggal 5 disetujui pemilik sebelum ditandai dibayar.
- Rekrutmen tetap terkunci sampai omzet tiga bulan berturut-turut minimal Rp12 juta dan kas minimal Rp15 juta.
- Generator kontrak memakai tujuh templat (PKS mitra, pekerja dan admin medsos, klien umum, Studio, Tech, Edukasi, syarat). Nomor contoh: `ANR/STD/001/XI/2026`. Rekening usaha dikosongkan sampai diisi di Pengaturan.
- Monitoring menandai tenggat terlambat dan yang hampir jatuh tempo, beban pekerja, SLA tahap, DP dan pelunasan tertunda, revisi, serta kas.
- Laporan harian, mingguan, bulanan, tahunan, atau rentang sendiri dapat disaring per unit, layanan, pekerja, dan klien, lalu diunduh CSV atau PDF.

Naskah Edukasi tidak masuk portofolio. File akhir diserahkan setelah pelunasan.
