import { contractTitle, contractVars, fillTemplate } from '../lib/contracts'
import { OFFICIAL_TEMPLATES } from './officialTemplates'
import { splitAmount, phaseForDate } from '../lib/finance'
import { addDays, todayISO } from '../lib/format'
import { makeChecks } from '../lib/sop'
import type { AppState, Client, Invoice, Order, PackageItem, Payment, Worker } from '../types'

const day = todayISO()
const shift = (n: number) => addDays(day, n)
const at = (n: number, hour = 9) => new Date(`${shift(n)}T${String(hour).padStart(2, '0')}:00:00`).toISOString()

const packages: PackageItem[] = [
  ['undangan-basic', 'studio', 'Undangan digital Basic', 'Satu tampilan dan fitur inti.', 250_000, 250_000, true],
  ['undangan-premium', 'studio', 'Undangan digital Premium', 'Lebih banyak halaman, galeri, dan ucapan.', 350_000, 350_000, true],
  ['undangan-exclusive', 'studio', 'Undangan digital Exclusive', 'Paket terlengkap dengan kustomisasi lebih luas.', 500_000, 500_000, true],
  ['video-pendek', 'studio', 'Video pendek / reels', '15–60 detik, satu lagu, dua revisi.', 150_000, 300_000, false],
  ['dokumentasi', 'studio', 'Dokumentasi kegiatan', 'Setengah hari sampai sehari, suntingan ringkas.', 500_000, 1_500_000, false],
  ['video-profil', 'studio', 'Video profil', '2–5 menit dengan naskah sederhana.', 1_000_000, 3_000_000, false],
  ['video-ai', 'studio', 'Video AI singkat', 'Visual bantu AI, durasi pendek.', 200_000, 500_000, false],
  ['audio', 'studio', 'Audio / podcast', 'Rekaman dan rapikan 1–3 episode.', 150_000, 400_000, false],
  ['tugas', 'edukasi', 'Tugas kuliah / makalah', 'Pendampingan naskah pendek. Bukan pengganti penulis.', 150_000, 300_000, false],
  ['kti', 'edukasi', 'KTI / laporan', 'Struktur, bahasa, dan merapikan sitasi.', 300_000, 600_000, false],
  ['rpl', 'edukasi', 'Naskah dan portofolio RPL', 'Jadwal di luar jam kerja, termasuk pegawai instansi.', 400_000, 1_500_000, false],
  ['skripsi', 'edukasi', 'Pendampingan skripsi', 'Bimbingan bertahap per bab. Tanpa jaminan kelulusan.', 800_000, 2_000_000, false],
  ['tesis', 'edukasi', 'Pendampingan tesis', 'Pendampingan lebih dalam, jadwal tertulis.', 1_500_000, 3_500_000, false],
  ['web-umkm', 'tech', 'Situs profil UMKM', '5–8 halaman.', 1_000_000, 2_500_000, false],
  ['web-instansi', 'tech', 'Situs instansi', 'Informasi resmi, berita, dan unggah dokumen.', 2_500_000, 5_000_000, false],
  ['aplikasi-kerja', 'tech', 'Aplikasi kerja', 'Lingkup ditulis terpisah pada lampiran.', 3_000_000, 8_000_000, false],
  ['android', 'tech', 'Aplikasi Android', 'Fungsi inti, tanpa jaminan lolos toko aplikasi.', 5_000_000, 15_000_000, false],
  ['flipbook', 'tech', 'Flipbook', 'Tata letak, unggah, dan tautan unduh.', 750_000, 2_000_000, false],
].map((row) => ({
  id: row[0] as string,
  slug: row[0] as string,
  brand: row[1] as PackageItem['brand'],
  name: row[2] as string,
  summary: row[3] as string,
  priceMin: row[4] as number,
  priceMax: row[5] as number,
  fixed: row[6] as boolean,
  revisions: 2,
  active: true,
}))

const clients: Client[] = [
  { id: 'c-sari', name: 'Sari Putri', whatsapp: '081200001111', email: 'sari@contoh.id', address: 'Sintang', institution: '', studentStatus: '', notes: '', sample: true },
  { id: 'c-andika', name: 'Andika Wijaya', whatsapp: '081200002222', email: '', address: 'Sintang', institution: '', studentStatus: '', notes: '', sample: true },
  { id: 'c-laila', name: 'Laila Maharani', whatsapp: '081300003333', email: 'laila@contoh.id', address: 'Sintang', institution: 'Kampus contoh', studentStatus: 'reguler', notes: 'Skripsi bab 2–3', sample: true },
  { id: 'c-rizki', name: 'Rizki Pratama', whatsapp: '081300004444', email: '', address: 'Sintang', institution: 'Puskesmas contoh', studentStatus: 'rpl', notes: 'Hubungi di luar jam dinas', sample: true },
  { id: 'c-kopi', name: 'Kedai Kopi Kapuas', whatsapp: '081200005555', email: '', address: 'Jl. Kapuas', institution: 'Kedai Kopi Kapuas', studentStatus: '', notes: '', sample: true },
  { id: 'c-dinas', name: 'Bidang contoh', whatsapp: '081200006666', email: '', address: 'Sintang', institution: 'Instansi contoh', studentStatus: '', notes: '', sample: true },
  { id: 'c-nanda', name: 'Nanda Yusuf', whatsapp: '081300007777', email: '', address: 'Sintang', institution: 'Kampus contoh', studentStatus: 'reguler', notes: '', sample: true },
]

const workers: Worker[] = [
  { id: 'w-wilda', profileId: 'u-wilda', name: 'M. Wilda Alfiansyah, A.Md.Kes.', whatsapp: '05811699699', title: 'Pemilik · Studio & Tech', brand: 'semua', active: true, sample: false },
  { id: 'w-fadil', profileId: 'u-fadil', name: 'M. Fadilah Alkadri', whatsapp: '05811699699', title: 'Keuangan · Admin WA · Edukasi', brand: 'edukasi', active: true, sample: false },
  { id: 'w-raka', profileId: 'u-raka', name: 'Raka Pratama', whatsapp: '081211110000', title: 'Pekerja lepas produksi', brand: 'studio', active: true, sample: true },
]

function order(partial: Omit<Order, 'files' | 'sample' | 'revisionLimit'> & { revisionLimit?: number; files?: Order['files'] }): Order {
  return { revisionLimit: 2, sample: true, files: partial.files || [], ...partial }
}

const orders: Order[] = [
  order({ id: 'o1', code: '', clientId: 'c-sari', packageId: 'undangan-premium', brand: 'studio', title: 'Undangan digital Premium', brief: 'Undangan pernikahan, galeri 8 foto.', stage: 'selesai', price: 350_000, dpPercent: 50, dueDate: shift(-8), assigneeId: 'w-wilda', referrer: '', revisionCount: 1, studentStatus: '', campus: '', scriptType: '', startedAt: at(-14), warrantyUntil: null, offerExpires: shift(-18), createdAt: at(-16) }),
  order({ id: 'o2', code: '', clientId: 'c-andika', packageId: 'undangan-exclusive', brand: 'studio', title: 'Undangan digital Exclusive', brief: 'Dua bahasa, musik, peta lokasi.', stage: 'selesai', price: 500_000, dpPercent: 50, dueDate: shift(-5), assigneeId: 'w-wilda', referrer: 'Sari Putri', revisionCount: 2, studentStatus: '', campus: '', scriptType: '', startedAt: at(-12), warrantyUntil: null, offerExpires: shift(-16), createdAt: at(-13) }),
  order({ id: 'o3', code: '', clientId: 'c-kopi', packageId: 'video-pendek', brand: 'studio', title: 'Video pendek menu baru', brief: 'Reels 30 detik untuk media sosial.', stage: 'menunggu_dp', price: 250_000, dpPercent: 50, dueDate: shift(8), assigneeId: 'w-wilda', referrer: '', revisionCount: 0, studentStatus: '', campus: '', scriptType: '', startedAt: null, warrantyUntil: null, offerExpires: shift(4), createdAt: at(-3) }),
  order({ id: 'o4', code: '', clientId: 'c-sari', packageId: 'undangan-basic', brand: 'studio', title: 'Undangan digital Basic', brief: 'Undangan syukuran.', stage: 'pengerjaan', price: 250_000, dpPercent: 50, dueDate: shift(-1), assigneeId: 'w-wilda', referrer: '', revisionCount: 0, studentStatus: '', campus: '', scriptType: '', startedAt: at(-8), warrantyUntil: null, offerExpires: shift(-12), createdAt: at(-10) }),
  order({ id: 'o5', code: '', clientId: 'c-laila', packageId: 'skripsi', brand: 'edukasi', title: 'Pendampingan skripsi', brief: 'Bab metode dan hasil. Pendampingan, bukan penulisan utuh.', stage: 'revisi', price: 1_500_000, dpPercent: 50, dueDate: shift(4), assigneeId: 'w-fadil', referrer: '', revisionCount: 1, studentStatus: 'reguler', campus: 'Kampus contoh', scriptType: 'Skripsi', startedAt: at(-12), warrantyUntil: null, offerExpires: shift(-16), createdAt: at(-14) }),
  order({ id: 'o6', code: '', clientId: 'c-rizki', packageId: 'rpl', brand: 'edukasi', title: 'Portofolio RPL', brief: 'Naskah RPL, jadwal setelah jam dinas.', stage: 'pengerjaan', price: 900_000, dpPercent: 50, dueDate: shift(1), assigneeId: 'w-fadil', referrer: '', revisionCount: 0, studentStatus: 'rpl', campus: 'Kampus contoh', scriptType: 'Portofolio RPL', startedAt: at(-6), warrantyUntil: null, offerExpires: shift(-10), createdAt: at(-8) }),
  order({ id: 'o7', code: '', clientId: 'c-nanda', packageId: 'kti', brand: 'edukasi', title: 'KTI keperawatan', brief: 'Merapikan sitasi dan struktur.', stage: 'masuk_brief', price: 450_000, dpPercent: 50, dueDate: shift(14), assigneeId: 'w-fadil', referrer: '', revisionCount: 0, studentStatus: 'reguler', campus: 'Kampus contoh', scriptType: 'KTI', startedAt: null, warrantyUntil: null, offerExpires: shift(6), createdAt: at(-1) }),
  order({ id: 'o8', code: '', clientId: 'c-dinas', packageId: 'flipbook', brand: 'tech', title: 'Flipbook kegiatan', brief: 'Buku kegiatan tahunan, tautan unduh.', stage: 'menunggu_pelunasan', price: 1_200_000, dpPercent: 50, dueDate: shift(-2), assigneeId: 'w-wilda', referrer: '', revisionCount: 1, studentStatus: '', campus: '', scriptType: '', startedAt: at(-18), warrantyUntil: null, offerExpires: shift(-24), createdAt: at(-20) }),
  order({ id: 'o9', code: '', clientId: 'c-kopi', packageId: 'web-umkm', brand: 'tech', title: 'Situs profil kedai', brief: 'Enam halaman, menu, dan peta.', stage: 'kontrak', price: 2_000_000, dpPercent: 50, dueDate: shift(18), assigneeId: 'w-wilda', referrer: '', revisionCount: 0, studentStatus: '', campus: '', scriptType: '', startedAt: null, warrantyUntil: null, offerExpires: shift(1), createdAt: at(-6) }),
  order({ id: 'o10', code: '', clientId: 'c-dinas', packageId: 'video-profil', brand: 'studio', title: 'Video profil instansi', brief: 'Video 3 menit, naskah singkat.', stage: 'penawaran', price: 1_800_000, dpPercent: 50, dueDate: shift(20), assigneeId: 'w-wilda', referrer: '', revisionCount: 0, studentStatus: '', campus: '', scriptType: '', startedAt: null, warrantyUntil: null, offerExpires: shift(5), createdAt: at(-2) }),
  order({ id: 'o11', code: '', clientId: 'c-nanda', packageId: 'tugas', brand: 'edukasi', title: 'Makalah singkat', brief: 'Dibatalkan sebelum kerja dimulai.', stage: 'batal', price: 250_000, dpPercent: 50, dueDate: shift(3), assigneeId: 'w-fadil', referrer: '', revisionCount: 0, studentStatus: 'reguler', campus: 'Kampus contoh', scriptType: 'Makalah', startedAt: null, warrantyUntil: null, offerExpires: shift(-5), createdAt: at(-12) }),
  order({ id: 'o12', code: '', clientId: 'c-dinas', packageId: 'android', brand: 'tech', title: 'Aplikasi Android kegiatan', brief: 'Fungsi inti absensi kegiatan. DP 70 persen karena nilai tinggi.', stage: 'menunggu_dp', price: 6_000_000, dpPercent: 70, dueDate: shift(30), assigneeId: 'w-wilda', referrer: '', revisionCount: 0, studentStatus: '', campus: '', scriptType: '', startedAt: null, warrantyUntil: null, offerExpires: shift(3), createdAt: at(-4, 11) }),
  order({ id: 'o13', code: '', clientId: 'c-andika', packageId: 'audio', brand: 'studio', title: 'Rapikan podcast', brief: 'Dua episode, rapikan noise.', stage: 'serah_terima', price: 350_000, dpPercent: 50, dueDate: shift(0), assigneeId: 'w-raka', referrer: '', revisionCount: 1, studentStatus: '', campus: '', scriptType: '', startedAt: at(-9), warrantyUntil: null, offerExpires: shift(-14), createdAt: at(-11) }),
  order({ id: 'o14', code: '', clientId: 'c-kopi', packageId: 'dokumentasi', brand: 'studio', title: 'Dokumentasi acara', brief: 'Setengah hari, suntingan ringkas.', stage: 'pengerjaan', price: 800_000, dpPercent: 50, dueDate: shift(6), assigneeId: 'w-raka', referrer: '', revisionCount: 0, studentStatus: '', campus: '', scriptType: '', startedAt: at(-4), warrantyUntil: null, offerExpires: shift(-2), createdAt: at(-5) }),
]

const brandCode: Record<string, string> = { studio: 'STD', edukasi: 'EDU', tech: 'TCH' }
const counters: Record<string, number> = {}
for (const item of orders) {
  const key = brandCode[item.brand]
  counters[key] = (counters[key] || 0) + 1
  const date = new Date(item.createdAt)
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][date.getMonth()]
  item.code = `ORD/${key}/${String(counters[key]).padStart(3, '0')}/${roman}/${date.getFullYear()}`
}

const invoices: Invoice[] = []
const payments: Payment[] = []

function pushMoney(item: Order, mode: 'none' | 'dp-open' | 'dp-paid' | 'final-open' | 'paid') {
  if (mode === 'none') return
  const dp = Math.round((item.price * item.dpPercent) / 100)
  const rest = item.price - dp
  const dpInv: Invoice = { id: `inv-${item.id}-dp`, orderId: item.id, kind: 'dp', number: `INV/DP/${item.code.slice(4)}`, amount: dp, status: mode === 'dp-open' ? 'terbit' : 'lunas', dueDate: shift(2), issuedAt: item.createdAt }
  invoices.push(dpInv)
  if (mode !== 'dp-open') {
    payments.push({ id: `pay-${item.id}-dp`, invoiceId: dpInv.id, orderId: item.id, amount: dp, status: 'terverifikasi', proofName: 'bukti-dp-contoh.jpg', note: 'contoh', paidAt: item.startedAt || item.createdAt, verifiedAt: item.startedAt || item.createdAt })
  } else if (item.id === 'o3') {
    payments.push({ id: `pay-${item.id}-dp`, invoiceId: dpInv.id, orderId: item.id, amount: dp, status: 'menunggu', proofName: 'bukti-menunggu.jpg', note: 'Menunggu cek', paidAt: at(-1), verifiedAt: null })
  }
  if (mode === 'final-open' || mode === 'paid') {
    const fin: Invoice = { id: `inv-${item.id}-fin`, orderId: item.id, kind: 'pelunasan', number: `INV/LUN/${item.code.slice(4)}`, amount: rest, status: mode === 'paid' ? 'lunas' : 'terbit', dueDate: item.dueDate, issuedAt: at(-4) }
    invoices.push(fin)
    if (mode === 'paid') {
      payments.push({ id: `pay-${item.id}-fin`, invoiceId: fin.id, orderId: item.id, amount: rest, status: 'terverifikasi', proofName: 'bukti-lunas-contoh.jpg', note: 'contoh', paidAt: at(-3), verifiedAt: at(-3) })
    }
  }
}

pushMoney(orders[0], 'paid')
pushMoney(orders[1], 'paid')
pushMoney(orders[2], 'dp-open')
pushMoney(orders[3], 'dp-paid')
pushMoney(orders[4], 'dp-paid')
pushMoney(orders[5], 'dp-paid')
pushMoney(orders[7], 'final-open')
pushMoney(orders[11], 'dp-open')
pushMoney(orders[12], 'paid')
pushMoney(orders[13], 'dp-paid')

const splits = [orders[0], orders[1], orders[12]].map((item) => {
  const result = splitAmount(item.price, phaseForDate(item.createdAt.slice(0, 10)), Boolean(item.referrer))
  const worker = workers.find((person) => person.id === item.assigneeId)
  return {
    id: `split-${item.id}`,
    orderId: item.id,
    phase: result.phase,
    gross: result.gross,
    referral: result.referral,
    base: result.base,
    worker: result.worker,
    cash: result.cash,
    ops: result.ops,
    profit: result.profit,
    ownerProfit: result.ownerProfit,
    partnerProfit: result.partnerProfit,
    workerName: worker?.name || '',
    at: at(-3),
  }
})

const checks = orders.flatMap((item) => makeChecks(item.id, item.brand, item.stage))
const events = orders.flatMap((item) => [
  { id: `ev-${item.id}-a`, orderId: item.id, stage: 'masuk_brief' as const, note: 'Pesanan tercatat.', actor: 'Sistem', at: item.createdAt },
  { id: `ev-${item.id}-b`, orderId: item.id, stage: item.stage, note: 'Status berjalan.', actor: 'Tim ANARA', at: item.startedAt || item.createdAt },
])

export const TRACK_HINT = { code: orders[3].code, whatsapp: '081200001111' }

export function createDemoState(): AppState {
  const state: AppState = {
    packages,
    clients,
    workers,
    orders,
    events,
    checks,
    invoices,
    payments,
    splits,
    expenses: [
      { id: 'ex1', date: shift(-6), category: 'Kuota dan komunikasi', amount: 150_000, memo: 'Kuota bulan berjalan', sample: true },
      { id: 'ex2', date: shift(-2), category: 'Langganan kerja', amount: 120_000, memo: 'Langganan suntingan', sample: true },
    ],
    templates: OFFICIAL_TEMPLATES.map((item) => ({ ...item })),
    contracts: [
      {
        id: 'k-o9',
        orderId: 'o9',
        templateKey: 'tech',
        number: `ANR/TCH/001/${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()]}/${new Date().getFullYear()}`,
        title: 'Perjanjian Layanan ANARA Tech',
        body: 'Kontrak contoh untuk situs profil kedai. Isi lengkap terisi saat dibuka di generator.',
        status: 'terkirim',
        signerName: '',
        signedAt: null,
        ip: '',
        userAgent: '',
        otpHint: '482913',
        attempts: 0,
        sample: true,
      },
    ],
    portfolio: [
      { id: 'p1', brand: 'studio', title: 'Undangan Premium', caption: 'Galeri dan ucapan tamu.', published: true, sample: true },
      { id: 'p2', brand: 'edukasi', title: 'Pendampingan skripsi', caption: 'Tidak menampilkan naskah. Hanya izin klien.', published: true, sample: true },
      { id: 'p3', brand: 'tech', title: 'Flipbook kegiatan', caption: 'Tautan unduh dan tata letak.', published: true, sample: true },
      { id: 'p4', brand: 'tech', title: 'Situs profil UMKM', caption: 'Enam halaman profil usaha.', published: true, sample: true },
    ],
    testimonials: [
      { id: 't1', name: 'Sari', role: 'klien Studio', quote: 'Prosesnya rapi, dari brief sampai undangan jadi, semuanya tercatat.', stars: 5, published: true, sample: true },
      { id: 't2', name: 'Rizki', role: 'mahasiswa RPL', quote: 'Jadwal menyesuaikan shift. Naskah RPL saya jadi lebih tertib.', stars: 5, published: true, sample: true },
      { id: 't3', name: 'Dinas, klien Tech', role: 'klien Tech', quote: 'Flipbook kegiatan selesai dengan kontrak yang jelas dari awal.', stars: 5, published: true, sample: true },
    ],
    audit: [
      { id: 'a1', actor: 'Sistem', action: 'contoh', entity: 'order', detail: 'Data contoh dimuat untuk mencoba alur.', at: at(-1, 8) },
      { id: 'a2', actor: 'M. Fadilah Alkadri', action: 'verifikasi', entity: 'pembayaran', detail: 'Uang muka undangan premium diverifikasi.', at: at(-14, 15) },
    ],
    notices: [
      { id: 'n1', title: 'DP belum masuk', body: 'Video pendek menu baru melewati hari ke-2.', href: '#/app/order/o3', read: false, at: at(-1, 8), forRole: 'finance' },
      { id: 'n2', title: 'Tenggat lewat', body: 'Undangan Basic melewati tenggat.', href: '#/app/monitoring', read: false, at: at(0, 7), forRole: 'owner' },
      { id: 'n3', title: 'Pelunasan tertunda', body: 'Flipbook kegiatan menunggu pelunasan.', href: '#/app/pembayaran', read: false, at: at(-1, 9), forRole: 'semua' },
    ],
    rules: [
      { key: 'wa-status', title: 'WhatsApp saat status berubah', detail: 'Templat ke nomor klien dan salinan ke Admin WA.', message: 'Halo {{nama}}, pesanan {{kode}} berstatus {{status}}. ANARA, Beyond Value.', enabled: true, group: 'pemberitahuan' },
      { key: 'ingat-dp', title: 'Pengingat DP belum masuk', detail: 'Hari ke-2 dan ke-5 setelah tagihan. Kerja tidak dimulai.', message: 'Pengingat uang muka {{kode}} sebesar {{nominal}}. Kerja dimulai setelah DP masuk.', enabled: true, group: 'pemberitahuan' },
      { key: 'ingat-lunas', title: 'Pengingat pelunasan dan tenggat', detail: 'H-2 tenggat, dan H+3 jika pelunasan belum masuk. Setelah 7 hari kerja dihentikan sementara.', message: 'Pengingat pelunasan {{kode}}. File akhir menyusul setelah lunas.', enabled: true, group: 'pemberitahuan' },
      { key: 'ingat-revisi', title: 'Pengingat masukan revisi', detail: 'Jika klien belum membalas draf dalam lima hari kerja.', message: 'Draf {{kode}} menunggu masukan. Lewat lima hari kerja, draf dianggap diterima.', enabled: true, group: 'pemberitahuan' },
      { key: 'ingat-garansi', title: 'Pengingat garansi Tech', detail: 'Bug pada lingkup Tech dilaporkan dalam 30 hari setelah serah terima.', message: 'Garansi perbaikan {{kode}} berlaku sampai {{tanggal}}.', enabled: true, group: 'pemberitahuan' },
      { key: 'invoice', title: 'Tagihan dan kuitansi otomatis', detail: 'Tagihan DP saat kontrak disetujui. Pelunasan saat draf final. Kuitansi saat terverifikasi.', message: 'Tagihan {{kode}} senilai {{nominal}}.', enabled: true, group: 'keuangan' },
      { key: 'split', title: 'Bagi hasil otomatis saat lunas', detail: 'Porsi fase berjalan, laba 60:40, referral 5% hanya jika ada perujuk.', message: 'Bagi hasil {{kode}} tercatat.', enabled: true, group: 'keuangan' },
      { key: 'laporan-5', title: 'Laporan setiap tanggal 5', detail: 'Laporan disusun untuk pemilik dan mitra. Honor dan laba ditandai siap dibayar setelah disetujui.', message: 'Laporan {{periode}} siap ditinjau.', enabled: true, group: 'laporan' },
      { key: 'rekrut', title: 'Dana darurat dan kunci rekrutmen', detail: '20% kas dikunci sampai Rp5 juta. Lowongan hanya jika omzet 3 bulan dan kas memenuhi ambang.', message: 'Ambang rekrutmen atau kas berubah.', enabled: true, group: 'laporan' },
      { key: 'cadangan', title: 'Cadangan mingguan', detail: 'Ringkasan data disiapkan tiap Senin. Berkas Edukasi tetap terbatas.', message: 'Cadangan mingguan siap diunduh.', enabled: true, group: 'laporan' },
    ],
    settings: {
      phase: phaseForDate(day),
      phaseAuto: true,
      splits: { 1: [40, 30, 15, 15], 2: [45, 15, 15, 25], 3: [50, 10, 15, 25] },
      bankName: '',
      bankNumber: '',
      bankHolder: '',
      emergencyRate: 0.2,
      emergencyCap: 5_000_000,
      toolsThreshold: 2_000_000,
      recruitRevenue: 12_000_000,
      recruitMonths: 3,
      recruitCash: 15_000_000,
      ownerShare: 60,
      partnerShare: 40,
      honor: { 1: 300_000, 2: 500_000, 3: 750_000 },
      waDisplay: '0581-1699-699',
      waLink: 'https://wa.me/625811699699',
      address: 'Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat',
      ownerName: 'M. Wilda Alfiansyah, A.Md.Kes.',
      partnerName: 'M. Fadilah Alkadri',
    },
    settlements: [
      { id: 'set-now', period: day.slice(0, 7), status: 'siap', note: 'Laporan contoh menunggu persetujuan pemilik.', approvedAt: null },
    ],
    outbox: [
      { id: 'out1', channel: 'wa', to: '081200005555', body: 'Pengingat uang muka video pendek. Kerja dimulai setelah DP masuk.', href: 'https://wa.me/6281200005555', status: 'siap', at: at(-1, 8) },
    ],
    session: null,
  }
  const techOrder = state.orders.find((item) => item.id === 'o9') || null
  const techTemplate = state.templates.find((item) => item.key === 'tech')
  const draft = state.contracts[0]
  if (techTemplate && draft) {
    draft.title = contractTitle('tech')
    draft.body = fillTemplate(techTemplate.body, contractVars(state, techOrder, draft.number))
  }
  return state
}

export const DEMO_USERS = [
  { id: 'u-wilda', name: 'M. Wilda Alfiansyah, A.Md.Kes.', role: 'owner' as const, email: 'wilda@anara.local' },
  { id: 'u-fadil', name: 'M. Fadilah Alkadri', role: 'finance' as const, email: 'fadil@anara.local' },
  { id: 'u-raka', name: 'Raka Pratama', role: 'worker' as const, email: 'raka@anara.local' },
  { id: 'u-medsos', name: 'Nadya Kusuma', role: 'social' as const, email: 'nadya@anara.local' },
]
