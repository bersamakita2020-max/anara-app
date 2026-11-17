import type { Stage } from '../types'

export const STAGE_FLOW: Stage[] = [
  'masuk_brief',
  'penawaran',
  'kontrak',
  'menunggu_dp',
  'pengerjaan',
  'revisi',
  'menunggu_pelunasan',
  'serah_terima',
  'selesai',
]

export const STAGE_LABEL: Record<Stage, string> = {
  masuk_brief: 'Masuk / brief',
  penawaran: 'Penawaran',
  kontrak: 'Kontrak',
  menunggu_dp: 'Menunggu DP',
  pengerjaan: 'Pengerjaan',
  revisi: 'Revisi',
  menunggu_pelunasan: 'Menunggu pelunasan',
  serah_terima: 'Serah terima',
  selesai: 'Selesai',
  ditahan: 'Ditahan',
  batal: 'Batal',
}

export interface CheckTemplate {
  stage: Stage
  sop: string
  label: string
}

export const CHECK_TEMPLATES: CheckTemplate[] = [
  { stage: 'masuk_brief', sop: 'SOP-001', label: 'Kebutuhan, tenggat, dan kontak tercatat' },
  { stage: 'masuk_brief', sop: 'SOP-001', label: 'Status mahasiswa dicatat bila Edukasi' },
  { stage: 'masuk_brief', sop: 'SOP-001', label: 'Brief diteruskan ke penanggung jawab unit' },
  { stage: 'penawaran', sop: 'SOP-001', label: 'Lingkup, harga, tenggat, DP, dan revisi tertulis' },
  { stage: 'penawaran', sop: 'SOP-001', label: 'Masa berlaku penawaran 7 hari dicantumkan' },
  { stage: 'kontrak', sop: 'SOP-001', label: 'Kontrak bernomor terbit dari data order' },
  { stage: 'kontrak', sop: 'SOP-001', label: 'Klien menyetujui dengan nama terang dan kode' },
  { stage: 'menunggu_dp', sop: 'SOP-002', label: 'Tagihan uang muka terbit' },
  { stage: 'menunggu_dp', sop: 'SOP-002', label: 'Bukti transfer disimpan' },
  { stage: 'menunggu_dp', sop: 'SOP-002', label: 'Uang muka diverifikasi Manager Keuangan' },
  { stage: 'pengerjaan', sop: 'SOP-003', label: 'Brief dan bahan diperiksa ulang' },
  { stage: 'pengerjaan', sop: 'SOP-003', label: 'Jadwal tahap disampaikan ke klien' },
  { stage: 'pengerjaan', sop: 'SOP-003', label: 'File kerja disimpan di folder usaha' },
  { stage: 'pengerjaan', sop: 'SOP-003', label: 'Draf atau pratinjau dikirim' },
  { stage: 'revisi', sop: 'SOP-006', label: 'Masukan klien tercatat tanggalnya' },
  { stage: 'revisi', sop: 'SOP-006', label: 'Permintaan masih dalam lingkup dan kuota' },
  { stage: 'revisi', sop: 'SOP-006', label: 'Perbaikan dikirim kembali' },
  { stage: 'menunggu_pelunasan', sop: 'SOP-002', label: 'Tagihan pelunasan terbit' },
  { stage: 'menunggu_pelunasan', sop: 'SOP-002', label: 'Pelunasan diverifikasi sebelum file akhir' },
  { stage: 'serah_terima', sop: 'SOP-007', label: 'File akhir tanpa watermark diserahkan' },
  { stage: 'serah_terima', sop: 'SOP-007', label: 'Klien mengonfirmasi penerimaan' },
  { stage: 'serah_terima', sop: 'SOP-007', label: 'Izin testimoni ditanyakan' },
  { stage: 'selesai', sop: 'SOP-008', label: 'Bagi hasil tercatat sesuai fase' },
  { stage: 'selesai', sop: 'SOP-008', label: 'Folder order lengkap' },
]

export function stageIndex(stage: Stage): number {
  return STAGE_FLOW.indexOf(stage)
}

export function sopForBrand(brand: string): string {
  if (brand === 'studio') return 'SOP-003'
  if (brand === 'tech') return 'SOP-004'
  if (brand === 'edukasi') return 'SOP-005'
  return 'SOP-003'
}

export function makeChecks(orderId: string, brand: string, stage: Stage): { id: string; orderId: string; stage: Stage; sop: string; label: string; done: boolean }[] {
  const current = stageIndex(stage)
  return CHECK_TEMPLATES.map((item, index) => ({
    id: `${orderId}-c${index}`,
    orderId,
    stage: item.stage,
    sop: item.stage === 'pengerjaan' ? sopForBrand(brand) : item.sop,
    label: item.label,
    done: current >= 0 && stageIndex(item.stage) < current,
  }))
}
