export function rupiah(value: number): string {
  const n = Math.round(value || 0)
  return 'Rp' + n.toLocaleString('id-ID')
}

export function tanggal(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export function tanggalWaktu(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function romanMonth(date: Date): string {
  return ROMAN[date.getMonth()]
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function phoneKey(value: string): string {
  let d = value.replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (d && !d.startsWith('62')) d = '62' + d
  return d.slice(-10)
}

export function waHref(phone: string, text: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}

export function brandLabel(brand: string): string {
  if (brand === 'studio') return 'Studio'
  if (brand === 'edukasi') return 'Edukasi'
  if (brand === 'tech') return 'Tech'
  return brand
}

export function dueTone(due: string, now = todayISO()): 'late' | 'soon' | 'ok' | 'none' {
  if (!due) return 'none'
  if (due < now) return 'late'
  if (due <= addDays(now, 2)) return 'soon'
  return 'ok'
}

export function businessDaysBetween(fromIso: string, toIso: string): number {
  const start = new Date(fromIso)
  const end = new Date(toIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  let days = 0
  const cursor = new Date(start)
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days += 1
  }
  return days
}
