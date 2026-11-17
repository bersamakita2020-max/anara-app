import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { Combobox } from '../components/Combobox'
import { CurrencyInput } from '../components/CurrencyInput'
import { DataTable } from '../components/DataTable'
import { CaraMengisi, Field, NomorKunci } from '../components/Field'
import { useAnara } from '../data/store'
import { supabase } from '../lib/supabase'
import { netInvoice } from '../lib/lembar'
import { rupiah, tanggal } from '../lib/format'
import { kirimWa } from '../lib/wa'

interface Baris { description: string; qty: number; unit: string; unitPrice: number }

export function TagihanPage() {
  const { state, act } = useAnara()
  const [nomor, setNomor] = useState('')
  const [clientId, setClientId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [due, setDue] = useState('')
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [lines, setLines] = useState<Baris[]>([{ description: '', qty: 1, unit: 'paket', unitPrice: 0 }])
  useEffect(() => {
    void supabase?.rpc('preview_doc_number', { p_kind: 'INV' }).then(({ data }) => { if (typeof data === 'string') setNomor(data) })
  }, [state.invoices.length])
  const subtotal = lines.reduce((sum, line) => sum + Math.round(line.qty * line.unitPrice), 0)
  const units = state.options.filter((item) => item.category === 'satuan' && item.active)
  return (
    <AppShell>
      <header className="page-head">
        <div><h1>Tagihan</h1><p>Invoice otomatis dari kontrak tetap berjalan. Di sini tagihan bisa dibuat manual.</p></div>
      </header>
      <DataTable
        rows={state.invoices}
        empty="Belum ada tagihan."
        cari={(row, query) => `${row.number} ${row.status}`.toLowerCase().includes(query)}
        filters={[{ label: 'Status', value: 'status', options: ['terbit', 'sebagian', 'lunas', 'terlambat'].map((item) => ({ value: item, label: item })), match: (row, value) => row.status === value }]}
        columns={[
          { key: 'nomor', label: 'Nomor', sort: (row) => row.number, render: (row) => <Link to={`/invoice/${row.id}`}>{row.number}</Link> },
          { key: 'nilai', label: 'Nilai', sort: (row) => row.amount, render: (row) => rupiah(netInvoice(row)) },
          { key: 'status', label: 'Status', sort: (row) => row.status, render: (row) => row.status },
          { key: 'tempo', label: 'Jatuh tempo', sort: (row) => row.dueDate, render: (row) => tanggal(row.dueDate) },
          { key: 'aksi', label: '', render: (row) => <button className="btn btn-ghost btn-sm" type="button" onClick={() => void kirimWa(state.clients.find((item) => item.id === row.clientId)?.whatsapp || '', `Tagihan ${row.number} sebesar ${rupiah(netInvoice(row))}. ${window.location.origin}/anara-app/invoice/${row.id}`)}>Kirim WA</button> },
        ]}
      />
      <form className="card" style={{ marginTop: 16 }} onSubmit={async (event) => {
        event.preventDefault()
        setError('')
        const result = await act({ type: 'save-invoice', clientId, orderId, dueDate: due, discount, taxPercent: tax, note, lines })
        if (result.error) setError(result.error)
        else setLines([{ description: '', qty: 1, unit: 'paket', unitPrice: 0 }])
      }}>
        <h2>Tagihan baru</h2>
        <CaraMengisi judul="Cara mengisi" butir={['Pilih klien. Order boleh kosong untuk tagihan di luar order.', 'Tambah baris pekerjaan, kuantitas, satuan, dan harga.', 'Diskon dan pajak boleh nol. Nomor terkunci setelah disimpan.']} />
        <NomorKunci id="nomor-inv" nilai={nomor} />
        <Combobox
          label="Klien"
          required
          placeholder="Cari nama klien"
          value={clientId}
          options={state.clients.map((item) => ({ value: item.id, label: `${item.name} · ${item.whatsapp}` }))}
          onChange={(value) => setClientId(value)}
          onCreate={async (label) => {
            const result = await act({ type: 'save-client', name: label, whatsapp: '' })
            return result.info?.split('|')[1] || ''
          }}
          hint="Klien baru langsung masuk daftar dan bisa dipilih lagi."
          error={error && !clientId ? 'Klien wajib dipilih.' : ''}
        />
        <Combobox
          label="Order"
          placeholder="Opsional"
          value={orderId}
          options={state.orders.map((item) => ({ value: item.id, label: `${item.code} · ${item.title}` }))}
          onChange={setOrderId}
          hint="Menghubungkan tagihan ke order agar pembayaran memperbarui tahap kerja."
        />
        {lines.map((line, index) => (
          <div className="line-grid" key={index}>
            <Field id={`uraian-${index}`} label="Uraian" required hint="Contoh: Undangan digital Premium">
              <input className="field" id={`uraian-${index}`} value={line.description} placeholder="Undangan digital Premium" onChange={(event) => setLines((rows) => rows.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} />
            </Field>
            <Field id={`qty-${index}`} label="Qty" required>
              <input className="field" id={`qty-${index}`} type="number" min={1} value={line.qty} onChange={(event) => setLines((rows) => rows.map((item, i) => i === index ? { ...item, qty: Number(event.target.value) } : item))} />
            </Field>
            <Combobox label="Satuan" value={line.unit} options={units.map((item) => ({ value: item.label, label: item.label }))} onChange={(value) => setLines((rows) => rows.map((item, i) => i === index ? { ...item, unit: value } : item))} onCreate={async (label) => { await act({ type: 'add-option', category: 'satuan', label }) }} />
            <Field id={`harga-${index}`} label="Harga" required hint="Tersimpan sebagai bilangan bulat.">
              <CurrencyInput id={`harga-${index}`} value={line.unitPrice} onChange={(amount) => setLines((rows) => rows.map((item, i) => i === index ? { ...item, unitPrice: amount } : item))} />
            </Field>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setLines((rows) => [...rows, { description: '', qty: 1, unit: 'paket', unitPrice: 0 }])}>Tambah baris</button>
        <div className="form-row">
          <Field id="diskon" label="Diskon" hint="Isi 0 jika tidak ada."><CurrencyInput id="diskon" value={discount} onChange={setDiscount} /></Field>
          <Field id="pajak" label="Pajak (%)" tooltip="Opsional. Kosongkan atau isi 0 bila tidak dipungut." hint="Contoh: 0">
            <input className="field" id="pajak" type="number" min={0} value={tax} onChange={(event) => setTax(Number(event.target.value))} />
          </Field>
        </div>
        <Field id="tempo" label="Jatuh tempo" required hint="Format tanggal, contoh 20 Nov 2026.">
          <input className="field" id="tempo" type="date" value={due} required onChange={(event) => setDue(event.target.value)} />
        </Field>
        <Field id="catatan-inv" label="Catatan" hint="Muncul di bawah tabel invoice.">
          <textarea className="field" id="catatan-inv" value={note} placeholder="Pembayaran ke rekening yang tercantum pada tagihan." onChange={(event) => setNote(event.target.value)} />
        </Field>
        <p>Subtotal {rupiah(subtotal)} · setelah diskon dan pajak {rupiah(Math.max(0, Math.round((subtotal - discount) * (100 + tax) / 100)))}</p>
        {error ? <p role="alert">{error}</p> : null}
        <ActionButton type="submit">Simpan tagihan</ActionButton>
      </form>
    </AppShell>
  )
}
