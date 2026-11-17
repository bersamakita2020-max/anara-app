import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicShell } from '../components/chrome'
import { QrMark } from '../components/QrMark'
import { callRpc } from '../data/remote'
import { rupiah, tanggal } from '../lib/format'
import { downloadTextPdf } from '../lib/pdf'

const KOP = 'Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699'

export function InvoicePage() {
  const { id } = useParams()
  const [doc, setDoc] = useState<{ id: string; number: string; kind: string; amount: number; status: string; dueDate: string; issuedAt: string; orderCode: string; service: string; clientName: string; seals: { token: string; signerName: string; signerTitle: string }[] } | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!id) return
    void callRpc<typeof doc>('get_public_invoice', { p_id: id }).then((data) => {
      if (!data) setMissing(true)
      else setDoc(data)
    }).catch(() => setMissing(true))
  }, [id])
  return (
    <PublicShell>
      <article className="dokumen wrap">
        <header className="kop">
          <strong className="sora">ANARA</strong>
          <div>Invoice</div>
        </header>
        <p className="addr">{KOP}</p>
        {!doc && !missing ? <div className="skeleton" /> : null}
        {missing ? <h1>Tagihan tidak ditemukan</h1> : null}
        {doc ? (
          <>
            <h1>{doc.number}</h1>
            <p>{doc.kind === 'dp' ? 'Uang muka' : 'Pelunasan'} · {doc.status}</p>
            <table className="data">
              <tbody>
                <tr><td>Klien</td><td>{doc.clientName}</td></tr>
                <tr><td>Order</td><td>{doc.orderCode} · {doc.service}</td></tr>
                <tr><td>Nilai</td><td>{rupiah(doc.amount)}</td></tr>
                <tr><td>Jatuh tempo</td><td>{tanggal(doc.dueDate)}</td></tr>
                <tr><td>Terbit</td><td>{tanggal(doc.issuedAt)}</td></tr>
              </tbody>
            </table>
            <div className="qr-row">{doc.seals?.map((seal) => <QrMark key={seal.token} token={seal.token} label={`${seal.signerName} · ${seal.signerTitle}`} />)}</div>
            <button className="btn btn-grad" type="button" onClick={() => void downloadTextPdf({ filename: `${doc.number}.pdf`, kicker: 'ANARA', title: doc.number, number: doc.status, address: KOP, body: `${doc.clientName}\n${doc.orderCode} · ${doc.service}\n${doc.kind} ${rupiah(doc.amount)}\nJatuh tempo ${tanggal(doc.dueDate)}` })}>Unduh PDF</button>
          </>
        ) : null}
      </article>
    </PublicShell>
  )
}

export function VerifyPage() {
  const { token } = useParams()
  const [doc, setDoc] = useState<{ valid: boolean; status?: string; docType?: string; docNumber?: string; signerName?: string; signerTitle?: string; issuedAt?: string } | null>(null)
  useEffect(() => {
    if (!token) return
    void callRpc<typeof doc>('get_verification', { p_token: token }).then(setDoc).catch(() => setDoc({ valid: false }))
  }, [token])
  return (
    <PublicShell>
      <article className="dokumen wrap">
        <header className="kop"><strong className="sora">ANARA</strong><div>Verifikasi dokumen</div></header>
        <p className="addr">{KOP}</p>
        {!doc ? <div className="skeleton" /> : null}
        {doc && !doc.valid ? <h1>Dokumen tidak dikenali</h1> : null}
        {doc?.valid ? (
          <>
            <h1>{doc.status === 'asli' ? 'Dokumen asli' : 'Dokumen tidak berlaku'}</h1>
            <table className="data">
              <tbody>
                <tr><td>Jenis</td><td>{doc.docType}</td></tr>
                <tr><td>Nomor</td><td>{doc.docNumber}</td></tr>
                <tr><td>Penanda tangan</td><td>{doc.signerName}</td></tr>
                <tr><td>Jabatan</td><td>{doc.signerTitle}</td></tr>
                <tr><td>Waktu</td><td>{tanggal(doc.issuedAt)}</td></tr>
                <tr><td>Status</td><td>{doc.status}</td></tr>
              </tbody>
            </table>
            <p><Link to="/">Kembali ke katalog</Link></p>
          </>
        ) : null}
      </article>
    </PublicShell>
  )
}
