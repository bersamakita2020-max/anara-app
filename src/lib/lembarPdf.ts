import pdfMake from 'pdfmake/build/pdfmake'
import vfs from 'pdfmake/build/vfs_fonts'
import QRCode from 'qrcode'
import fontRegular from '../assets/fonts/PlusJakartaSans-400.ttf'
import fontBold from '../assets/fonts/PlusJakartaSans-700.ttf'
import logoUrl from '../assets/brand/wordmark-hitam.png'
import type { Lembar } from './lembar'
import { KOP } from './lembar'

let fontsReady: Promise<void> | null = null

async function asBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const bytes = new Uint8Array(await response.arrayBuffer())
  let text = ''
  const size = 0x8000
  for (let index = 0; index < bytes.length; index += size) {
    text += String.fromCharCode(...bytes.subarray(index, index + size))
  }
  return btoa(text)
}

function siapFont(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      pdfMake.addVirtualFileSystem(vfs)
      const [regular, bold] = await Promise.all([asBase64(fontRegular), asBase64(fontBold)])
      pdfMake.addVirtualFileSystem({ 'Jakarta-Regular.ttf': regular, 'Jakarta-Bold.ttf': bold })
      pdfMake.addFonts({
        Jakarta: { normal: 'Jakarta-Regular.ttf', bold: 'Jakarta-Bold.ttf', italics: 'Jakarta-Regular.ttf', bolditalics: 'Jakarta-Bold.ttf' },
      })
    })()
  }
  return fontsReady
}

export async function unduhLembar(lembar: Lembar): Promise<void> {
  await siapFont()
  const logo = await asBase64(logoUrl).catch(() => '')
  const ttd = await Promise.all(lembar.ttd.map(async (orang) => {
    if (!orang.token) return { ...orang, qr: '' }
    const qr = await QRCode.toDataURL(`${window.location.origin}/anara-app/verifikasi/${orang.token}`, { margin: 0, width: 180 })
    return { ...orang, qr }
  }))
  const doc = {
    pageSize: 'A4',
    pageMargins: [42, 78, 42, 52],
    defaultStyle: { font: 'Jakarta', fontSize: 10, color: '#0A0A0B', lineHeight: 1.35 },
    header: () => ({
      margin: [42, 22, 42, 0],
      stack: [
        {
          columns: [
            logo ? { image: `data:image/png;base64,${logo}`, width: 78 } : { text: 'ANARA', bold: true, fontSize: 16, color: '#7C3AED' },
            { text: lembar.jenis, alignment: 'right', color: '#7C3AED', bold: true, fontSize: 12, margin: [0, 8, 0, 0] },
          ],
        },
        { text: KOP, fontSize: 8, color: '#5C5670', margin: [0, 6, 0, 4] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 511, y2: 0, lineWidth: 1.2, lineColor: '#7C3AED' }] },
      ],
    }),
    footer: (page: number, pages: number) => ({
      margin: [42, 8, 42, 0],
      columns: [
        { text: 'ANARA, Beyond Value', fontSize: 8, color: '#6B6578' },
        { text: `${lembar.nomor} · halaman ${page} dari ${pages}`, alignment: 'right', fontSize: 8, color: '#6B6578' },
      ],
    }),
    content: [
      { text: lembar.judul, fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
      { text: lembar.nomor, color: '#5C5670', margin: [0, 0, 0, 10] },
      {
        table: {
          widths: [120, '*'],
          body: lembar.pihak.map((row) => [
            { text: row.kiri, color: '#5C5670' },
            { text: row.kanan, bold: true },
          ]),
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },
      ...lembar.pasal.map((pasal) => ({
        stack: [
          { text: pasal.judul, bold: true, margin: [0, 8, 0, 2] },
          { text: pasal.isi, alignment: 'justify' },
        ],
        unbreakable: pasal.isi.length < 500,
      })),
      lembar.baris.length ? {
        table: {
          headerRows: 1,
          widths: lembar.kolom.map(() => '*'),
          body: [
            lembar.kolom.map((kolom) => ({ text: kolom, bold: true, color: '#4C1D95' })),
            ...lembar.baris.map((baris) => baris.map((sel) => ({ text: sel }))),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 12, 0, 8],
      } : { text: '' },
      {
        table: {
          widths: ['*', 140],
          body: lembar.ringkas.map((row) => [{ text: row.label, alignment: 'right', color: '#5C5670' }, { text: row.nilai, bold: true, alignment: 'right' }]),
        },
        layout: 'noBorders',
      },
      lembar.terbilang ? { text: `Terbilang: ${lembar.terbilang}`, italics: true, margin: [0, 8, 0, 4] } : { text: '' },
      lembar.catatan ? { text: lembar.catatan, fontSize: 9, color: '#5C5670', margin: [0, 4, 0, 12] } : { text: '' },
      {
        columns: ttd.map((orang) => ({
          width: '*',
          stack: [
            { text: orang.jabatan, bold: true, margin: [0, 8, 0, 4] },
            orang.qr ? { image: orang.qr, width: 72 } : { text: ' ', margin: [0, 28, 0, 0] },
            { text: orang.nama, margin: [0, 6, 0, 0] },
          ],
        })),
        margin: [0, 8, 0, 0],
      },
    ],
  }
  pdfMake.createPdf(doc).download(`${lembar.nomor || lembar.jenis}.pdf`)
}
