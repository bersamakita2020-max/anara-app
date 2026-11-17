import jsPDF from 'jspdf'
import logoUrl from '../assets/brand/wordmark-hitam.png'
import { rupiah } from './format'

async function logoData(): Promise<string | null> {
  try {
    const response = await fetch(logoUrl)
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function writeLines(doc: jsPDF, text: string, x: number, y: number, max: number, line = 5): number {
  const lines = doc.splitTextToSize(text, max) as string[]
  for (const row of lines) {
    if (y > 280) {
      doc.addPage()
      y = 18
    }
    doc.text(row, x, y)
    y += line
  }
  return y
}

export async function downloadTextPdf(opts: {
  filename: string
  kicker: string
  title: string
  number?: string
  address: string
  body: string
}): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await logoData()
  if (logo) doc.addImage(logo, 'PNG', 14, 12, 32, 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(124, 58, 237)
  doc.text(opts.kicker, 196, 16, { align: 'right' })
  if (opts.number) {
    doc.setTextColor(90, 90, 100)
    doc.text(opts.number, 196, 21, { align: 'right' })
  }
  doc.setDrawColor(124, 58, 237)
  doc.setLineWidth(0.8)
  doc.line(14, 24, 196, 24)
  doc.setFontSize(8)
  doc.setTextColor(110, 110, 120)
  doc.text(opts.address, 14, 29)
  doc.setFontSize(14)
  doc.setTextColor(10, 10, 11)
  doc.text(opts.title, 105, 40, { align: 'center' })
  doc.setFontSize(10)
  const end = writeLines(doc, opts.body, 14, 50, 182, 5)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 130)
  doc.text('ANARA, Beyond Value', 14, Math.min(end + 8, 290))
  doc.save(opts.filename)
}

export async function downloadTablePdf(opts: {
  filename: string
  title: string
  subtitle: string
  headers: string[]
  rows: string[][]
}): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(opts.title, 14, 16)
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 100)
  doc.text(opts.subtitle, 14, 22)
  doc.setTextColor(10, 10, 11)
  let y = 30
  const col = 270 / Math.max(opts.headers.length, 1)
  doc.setFontSize(8)
  doc.setFillColor(243, 232, 255)
  doc.rect(14, y - 4, 270, 7, 'F')
  opts.headers.forEach((header, index) => doc.text(header, 16 + index * col, y))
  y += 7
  for (const row of opts.rows) {
    if (y > 190) {
      doc.addPage()
      y = 16
    }
    row.forEach((cell, index) => doc.text(String(cell).slice(0, 42), 16 + index * col, y))
    y += 6
  }
  doc.save(opts.filename)
}

export function moneyCell(value: number): string {
  return rupiah(value)
}
