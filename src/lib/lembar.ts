import { rupiah, tanggal } from './format'
import { terbilang } from './terbilang'
import type { AppState, ContractDoc, Invoice, Payslip } from '../types'

export const KOP = 'Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699'

export interface Lembar {
  jenis: 'Kontrak' | 'Invoice' | 'Slip gaji'
  nomor: string
  judul: string
  tanggal: string
  pihak: { kiri: string; kanan: string }[]
  pasal: { judul: string; isi: string }[]
  kolom: string[]
  baris: string[][]
  ringkas: { label: string; nilai: string }[]
  terbilang: string
  catatan: string
  ttd: { nama: string; jabatan: string; token: string }[]
}

export function pasalDari(body: string): { judul: string; isi: string }[] {
  const parts = body.split(/\n(?=Pasal\s+\d+)/)
  return parts.map((part) => {
    const [judul, ...rest] = part.trim().split('\n')
    return { judul: judul || 'Ketentuan', isi: rest.join('\n').trim() || part.trim() }
  }).filter((item) => item.isi || item.judul)
}

export function lembarKontrak(state: AppState, contract: ContractDoc): Lembar {
  const order = state.orders.find((item) => item.id === contract.orderId)
  const client = state.clients.find((item) => item.id === order?.clientId)
  const harga = order?.price || 0
  const dp = order ? Math.round(harga * order.dpPercent / 100) : 0
  return {
    jenis: 'Kontrak',
    nomor: contract.number || 'Menunggu nomor',
    judul: contract.title || 'Perjanjian layanan',
    tanggal: tanggal(contract.signedAt || new Date().toISOString()),
    pihak: [
      { kiri: 'ANARA', kanan: `${state.settings.ownerName}, Pemilik` },
      { kiri: 'Alamat', kanan: state.settings.address },
      { kiri: 'WhatsApp', kanan: state.settings.waDisplay },
      { kiri: 'Klien', kanan: client?.name || '—' },
      { kiri: 'WhatsApp klien', kanan: client?.whatsapp || '—' },
      { kiri: 'Instansi', kanan: client?.institution || '—' },
    ],
    pasal: pasalDari(contract.body),
    kolom: ['Uraian', 'Nilai'],
    baris: order ? [
      ['Layanan', order.title],
      ['Harga', rupiah(harga)],
      [`Uang muka ${order.dpPercent}%`, rupiah(dp)],
      ['Sisa', rupiah(harga - dp)],
      ['Revisi', `${order.revisionLimit} putaran`],
    ] : [],
    ringkas: [{ label: 'Nilai perjanjian', nilai: rupiah(harga) }],
    terbilang: harga ? terbilang(harga) : '',
    catatan: 'Pembatalan sebelum pekerjaan dimulai mengembalikan uang muka setelah dipotong 10 persen. Garansi perbaikan bug ANARA Tech berlaku 30 hari.',
    ttd: [
      { nama: state.settings.ownerName, jabatan: 'Pemilik', token: '' },
      { nama: state.settings.partnerName, jabatan: 'Manajer Keuangan', token: '' },
      { nama: client?.name || 'Klien', jabatan: 'Klien', token: '' },
    ],
  }
}

export function netInvoice(invoice: Pick<Invoice, 'amount' | 'discount' | 'taxPercent'>): number {
  return Math.max(0, Math.round((invoice.amount - invoice.discount) * (100 + invoice.taxPercent) / 100))
}

export function lembarInvoice(state: AppState, invoice: Invoice): Lembar {
  const lines = state.invoiceLines.filter((item) => item.invoiceId === invoice.id)
  const client = state.clients.find((item) => item.id === invoice.clientId) || state.clients.find((item) => item.id === state.orders.find((order) => order.id === invoice.orderId)?.clientId)
  const order = state.orders.find((item) => item.id === invoice.orderId)
  const net = netInvoice(invoice)
  const rows = lines.length
    ? lines.map((line) => [line.description, String(line.qty), line.unit, rupiah(line.unitPrice), rupiah(Math.round(line.qty * line.unitPrice))])
    : [[order?.title || invoice.kind, '1', 'paket', rupiah(invoice.amount), rupiah(invoice.amount)]]
  return {
    jenis: 'Invoice',
    nomor: invoice.number,
    judul: invoice.kind === 'dp' ? 'Tagihan uang muka' : 'Tagihan',
    tanggal: tanggal(invoice.issuedAt),
    pihak: [
      { kiri: 'Klien', kanan: client?.name || '—' },
      { kiri: 'Order', kanan: order ? `${order.code} · ${order.title}` : 'Tanpa order' },
      { kiri: 'Jatuh tempo', kanan: tanggal(invoice.dueDate) },
      { kiri: 'Status', kanan: invoice.status },
    ],
    pasal: [],
    kolom: ['Uraian', 'Qty', 'Satuan', 'Harga', 'Jumlah'],
    baris: rows,
    ringkas: [
      { label: 'Subtotal', nilai: rupiah(invoice.amount) },
      { label: 'Diskon', nilai: rupiah(invoice.discount) },
      { label: 'Pajak', nilai: `${invoice.taxPercent}%` },
      { label: 'Tagihan', nilai: rupiah(net) },
      { label: 'Kode unik', nilai: String(invoice.uniqueCode || 0).padStart(3, '0') },
      { label: 'Nominal transfer', nilai: rupiah(net + (invoice.uniqueCode || 0)) },
    ],
    terbilang: terbilang(net + (invoice.uniqueCode || 0)),
    catatan: invoice.note,
    ttd: [
      { nama: state.settings.ownerName, jabatan: 'Pemilik', token: '' },
      { nama: state.settings.partnerName, jabatan: 'Manajer Keuangan', token: '' },
    ],
  }
}

export function lembarSlip(state: AppState, slip: Payslip): Lembar {
  return {
    jenis: 'Slip gaji',
    nomor: slip.number,
    judul: `Slip periode ${slip.period}`,
    tanggal: tanggal(slip.createdAt),
    pihak: [
      { kiri: 'Penerima', kanan: slip.recipientName },
      { kiri: 'Jabatan', kanan: slip.recipientTitle || '—' },
      { kiri: 'Periode', kanan: slip.period },
      { kiri: 'Status', kanan: slip.status },
    ],
    pasal: [],
    kolom: ['Komponen', 'Jenis', 'Nominal'],
    baris: slip.lines.map((line) => [line.label, line.kind, rupiah(line.amount)]),
    ringkas: [
      { label: 'Pendapatan', nilai: rupiah(slip.gross) },
      { label: 'Potongan', nilai: rupiah(slip.deductions) },
      { label: 'Take home pay', nilai: rupiah(slip.net) },
    ],
    terbilang: terbilang(slip.net),
    catatan: slip.note,
    ttd: [
      { nama: state.settings.partnerName, jabatan: 'Manajer Keuangan', token: '' },
      { nama: state.settings.ownerName, jabatan: 'Pemilik', token: '' },
    ],
  }
}
