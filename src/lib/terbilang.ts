const ANGKA = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function kecil(n: number): string {
  if (n < 12) return ANGKA[n]
  if (n < 20) return `${kecil(n - 10)} belas`
  if (n < 100) return `${kecil(Math.floor(n / 10))} puluh ${kecil(n % 10)}`.trim()
  if (n < 200) return `seratus ${kecil(n - 100)}`.trim()
  if (n < 1000) return `${kecil(Math.floor(n / 100))} ratus ${kecil(n % 100)}`.trim()
  if (n < 2000) return `seribu ${kecil(n - 1000)}`.trim()
  if (n < 1_000_000) return `${kecil(Math.floor(n / 1000))} ribu ${kecil(n % 1000)}`.trim()
  if (n < 1_000_000_000) return `${kecil(Math.floor(n / 1_000_000))} juta ${kecil(n % 1_000_000)}`.trim()
  return `${kecil(Math.floor(n / 1_000_000_000))} miliar ${kecil(n % 1_000_000_000)}`.trim()
}

export function terbilang(amount: number): string {
  const n = Math.round(Math.abs(amount))
  const kata = n === 0 ? 'nol' : kecil(n).replace(/\s+/g, ' ')
  const kalimat = `${kata} rupiah`
  return kalimat.charAt(0).toUpperCase() + kalimat.slice(1)
}
