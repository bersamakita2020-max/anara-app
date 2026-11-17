import { useEffect, useState } from 'react'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { CaraMengisi } from '../components/Field'
import { LembarView } from '../components/LembarView'
import { useAnara } from '../data/store'
import { callRpc } from '../data/remote'
import { lembarKontrak } from '../lib/lembar'
import { unduhLembar } from '../lib/lembarPdf'

export function ContractPage() {
  const { state, act } = useAnara()
  const [orderId, setOrderId] = useState(state.orders[0]?.id || '')
  const [templateKey, setTemplateKey] = useState(state.templates[0]?.key || 'umum')
  const [current, setCurrent] = useState(state.contracts[0]?.id || '')
  const [tokens, setTokens] = useState<Record<string, string>>({})
  const contract = state.contracts.find((item) => item.id === current) || state.contracts[0]
  const lembar = contract ? lembarKontrak(state, contract) : null
  if (lembar) {
    lembar.ttd = lembar.ttd.map((orang) => ({ ...orang, token: tokens[orang.jabatan] || '' }))
  }
  useEffect(() => {
    if (!contract) return
    void callRpc<{ seals?: { token: string; signerTitle: string }[] } | null>('get_public_contract', { p_id: contract.id })
      .then((data) => {
        const next: Record<string, string> = {}
        for (const seal of data?.seals || []) next[seal.signerTitle] = seal.token
        setTokens(next)
      })
      .catch(() => setTokens({}))
  }, [contract?.id])
  const link = contract ? `${window.location.origin}/anara-app/setujui/${contract.id}` : ''
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <h1>Kontrak</h1>
          <p>Pratinjau resmi, PDF A4, dan tautan untuk klien.</p>
        </div>
        <div className="top-actions">
          <button className="btn btn-ghost btn-sm" type="button" disabled={!lembar} onClick={() => lembar && void unduhLembar(lembar)}>Unduh PDF</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => window.print()}>Cetak</button>
          <button className="btn btn-ghost btn-sm" type="button" disabled={!link} onClick={() => void navigator.clipboard.writeText(link)}>Salin tautan klien</button>
        </div>
      </header>
      <CaraMengisi judul="Cara menerbitkan" butir={['Pilih order dan templat.', 'Nomor ANR/KTR diisi server saat draf disimpan.', 'Unduh PDF atau kirim tautan persetujuan ke klien.']} />
      <div className="layout-2">
        <div className="card">
          <label htmlFor="order-kontrak">Order</label>
          <select id="order-kontrak" className="field" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
            <option value="">Tanpa order</option>
            {state.orders.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}
          </select>
          <p className="hint">Order mengisi para pihak, harga, dan uang muka.</p>
          <label htmlFor="templat-kontrak">Templat</label>
          <select id="templat-kontrak" className="field" value={templateKey} onChange={(event) => setTemplateKey(event.target.value)}>
            {state.templates.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
          </select>
          <ActionButton type="button" onClick={async () => {
            const result = await act({ type: 'generate-contract', orderId: orderId || null, templateKey })
            const id = result.info?.split('|')[0]
            if (id) setCurrent(id)
          }}>Terbitkan draf</ActionButton>
          <label htmlFor="pilih-kontrak">Dokumen tersimpan</label>
          <select id="pilih-kontrak" className="field" value={contract?.id || ''} onChange={(event) => setCurrent(event.target.value)}>
            {state.contracts.map((item) => <option key={item.id} value={item.id}>{item.number || 'Tanpa nomor'} · {item.status}</option>)}
          </select>
        </div>
        {lembar ? <LembarView lembar={lembar} /> : <div className="empty-art"><span>⌘</span><p>Belum ada kontrak. Terbitkan draf dari order.</p></div>}
      </div>
    </AppShell>
  )
}
