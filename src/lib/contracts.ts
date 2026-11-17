import type { AppState, ContractDoc, Order } from '../types'
import { romanMonth, rupiah, tanggal } from './format'

export function nextSerial(prefix: string, existing: string[], date = new Date()): string {
  if (!prefix) return ''
  const tail = `/${romanMonth(date)}/${date.getFullYear()}`
  const seq =
    existing.filter((number) => number.startsWith(prefix + '/') && number.endsWith(tail)).length + 1
  return `${prefix}/${String(seq).padStart(3, '0')}${tail}`
}

export function orderPrefix(brand: string): string {
  if (brand === 'edukasi') return 'ORD/EDU'
  if (brand === 'tech') return 'ORD/TCH'
  return 'ORD/STD'
}

export function contractVars(state: AppState, order: Order | null, number: string): Record<string, string> {
  const client = state.clients.find((item) => item.id === order?.clientId)
  const worker = state.workers.find((item) => item.id === order?.assigneeId)
  const pack = state.packages.find((item) => item.id === order?.packageId)
  const settings = state.settings
  const price = order?.price || 0
  const dp = Math.round((price * (order?.dpPercent || 50)) / 100)
  const rekening = settings.bankNumber
    ? `${settings.bankName} ${settings.bankNumber} a.n. ${settings.bankHolder}`
    : '[rekening usaha belum diisi di pengaturan]'
  return {
    nomor: number || '[belum diisi]',
    tanggal: tanggal(new Date().toISOString()),
    nama_klien: client?.name || '',
    wa_klien: client?.whatsapp || '',
    alamat_klien: client?.address || '',
    instansi: client?.institution || '',
    unit: pack ? `ANARA ${pack.brand === 'studio' ? 'Studio' : pack.brand === 'tech' ? 'Tech' : 'Edukasi'}` : '',
    paket: pack?.name || order?.title || '',
    brief: order?.brief || '',
    harga: price ? rupiah(price) : '',
    dp: price ? `${order?.dpPercent || 50}% · ${rupiah(dp)}` : '',
    sisa: price ? `Sisa ${rupiah(price - dp)} dibayar sebelum file akhir` : '',
    mulai: tanggal(order?.startedAt || order?.createdAt),
    selesai: tanggal(order?.dueDate),
    revisi: order ? `${order.revisionLimit} putaran` : '2 putaran',
    rekening,
    bank: settings.bankName,
    atas_nama: settings.bankHolder,
    pemilik: settings.ownerName,
    mitra: settings.partnerName,
    alamat_mitra: '',
    wa_mitra: '',
    nama_pekerja: worker?.name || '',
    nik: '',
    alamat_pekerja: '',
    wa_pekerja: worker?.whatsapp || '',
    posisi: worker?.title || '',
    honor: '',
    jadwal: '',
    status_mahasiswa: order?.studentStatus === 'rpl' ? 'Mahasiswa RPL' : order?.studentStatus === 'reguler' ? 'Mahasiswa reguler' : '',
    kampus: order?.campus || client?.institution || '',
    jenis_naskah: order?.scriptType || pack?.name || '',
  }
}

export function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key]
    return value && value.trim() ? value : '[belum diisi]'
  })
}

export function templateForBrand(brand: string): string {
  if (brand === 'studio') return 'studio'
  if (brand === 'tech') return 'tech'
  if (brand === 'edukasi') return 'edukasi'
  return 'umum'
}

export function contractTitle(key: string): string {
  if (key === 'studio') return 'Perjanjian Layanan ANARA Studio'
  if (key === 'tech') return 'Perjanjian Layanan ANARA Tech'
  if (key === 'edukasi') return 'Perjanjian Layanan ANARA Edukasi'
  if (key === 'umum') return 'Perjanjian Layanan'
  if (key === 'pks') return 'Perjanjian Kerja Sama Mitra'
  if (key === 'pekerja') return 'Perjanjian Kerja Pekerja dan Admin Medsos'
  return 'Syarat dan Ketentuan Layanan ANARA'
}

export function findContract(state: AppState, id: string): ContractDoc | undefined {
  return state.contracts.find((item) => item.id === id)
}
