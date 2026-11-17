import { useMemo, useState } from 'react'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { Combobox } from '../components/Combobox'
import { CurrencyInput } from '../components/CurrencyInput'
import { DataTable } from '../components/DataTable'
import { CaraMengisi, Field, NomorKunci } from '../components/Field'
import { LembarView } from '../components/LembarView'
import { useAnara } from '../data/store'
import { rupiah } from '../lib/format'
import { lembarSlip } from '../lib/lembar'
import { unduhLembar } from '../lib/lembarPdf'
import { kirimWa } from '../lib/wa'
import type { PayLine } from '../types'

function komponen(state: ReturnType<typeof useAnara>['state'], workerId: string, period: string): PayLine[] {
  const worker = state.workers.find((item) => item.id === workerId)
  if (!worker) return []
  const lines: PayLine[] = []
  const splits = state.splits.filter((item) => (item.at || '').slice(0, 7) === period)
  const nama = worker.name.toLowerCase()
  if (nama.includes('wilda') || worker.title.toLowerCase().includes('pemilik')) {
    const amount = splits.reduce((sum, item) => sum + item.ownerProfit, 0)
    if (amount) lines.push({ kind: 'pendapatan', label: 'Bagi hasil pemilik', amount })
  }
  if (nama.includes('fadil') || worker.title.toLowerCase().includes('keuangan')) {
    lines.push({ kind: 'pendapatan', label: `Honor peran fase ${state.settings.phase}`, amount: state.settings.honor[state.settings.phase] })
    const amount = splits.reduce((sum, item) => sum + item.partnerProfit, 0)
    if (amount) lines.push({ kind: 'pendapatan', label: 'Bagi hasil mitra', amount })
  }
  const kerja = splits.filter((item) => item.workerName === worker.name).reduce((sum, item) => sum + item.worker, 0)
  if (kerja) lines.push({ kind: 'pendapatan', label: 'Jasa pengerja sesuai fase', amount: kerja })
  const awal = worker.name.split(' ')[0]?.toLowerCase() || ''
  const referral = state.orders.filter((item) => item.createdAt.slice(0, 7) === period && item.referrer.toLowerCase().includes(awal) && awal.length > 2)
  const fee = referral.reduce((sum, item) => sum + Math.round(item.price * 0.05), 0)
  if (fee) lines.push({ kind: 'pendapatan', label: 'Referral 5%', amount: fee })
  return lines
}

export function SlipPage() {
  const { state, act } = useAnara()
  const [workerId, setWorkerId] = useState(state.workers[0]?.id || '')
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [bonus, setBonus] = useState(0)
  const [potongan, setPotongan] = useState(0)
  const [note, setNote] = useState('')
  const [lihat, setLihat] = useState(state.payslips[0]?.id || '')
  const dasar = useMemo(() => komponen(state, workerId, period), [state, workerId, period])
  const lines: PayLine[] = [
    ...dasar,
    ...(bonus ? [{ kind: 'pendapatan' as const, label: 'Bonus', amount: bonus }] : []),
    ...(potongan ? [{ kind: 'potongan' as const, label: 'Potongan', amount: potongan }] : []),
  ]
  const worker = state.workers.find((item) => item.id === workerId)
  const slip = state.payslips.find((item) => item.id === lihat)
  const net = lines.reduce((sum, line) => sum + (line.kind === 'potongan' ? -line.amount : line.amount), 0)
  return (
    <AppShell>
      <header className="page-head"><div><h1>Slip gaji</h1><p>Honor peran, bagi hasil, dan referral diambil dari periode yang dipilih.</p></div></header>
      <DataTable
        rows={state.payslips}
        empty="Belum ada slip. Susun draf di bawah."
        cari={(row, query) => `${row.number} ${row.recipientName}`.toLowerCase().includes(query)}
        columns={[
          { key: 'nomor', label: 'Nomor', sort: (row) => row.number, render: (row) => <button className="btn btn-ghost btn-sm" type="button" onClick={() => setLihat(row.id)}>{row.number}</button> },
          { key: 'nama', label: 'Penerima', sort: (row) => row.recipientName, render: (row) => row.recipientName },
          { key: 'net', label: 'Diterima', sort: (row) => row.net, render: (row) => rupiah(row.net) },
          { key: 'status', label: 'Status', render: (row) => row.status },
        ]}
      />
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => {
        event.preventDefault()
        if (!worker) return
        void act({ type: 'save-payslip', period, workerId, recipientName: worker.name, recipientTitle: worker.title, lines, note })
      }}>
        <CaraMengisi judul="Cara mengisi" butir={['Pilih anggota tim dan periode.', 'Komponen dari order lunas terisi sendiri. Tambahkan bonus atau potongan bila ada.', 'Setujui, unduh PDF, lalu kirim lewat WhatsApp.']} />
        <NomorKunci id="nomor-slip" nilai="" />
        <Combobox label="Anggota" required value={workerId} options={state.workers.map((item) => ({ value: item.id, label: `${item.name} · ${item.title}` }))} onChange={setWorkerId} hint="Daftar mengikuti data pekerja." />
        <Field id="periode" label="Periode" required hint="Contoh 2026-11." tooltip="Honor fase mengikuti pengaturan bulan berjalan.">
          <input className="field" id="periode" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} required />
        </Field>
        <ul>{lines.map((line) => <li key={line.label}>{line.kind} · {line.label} · {rupiah(line.amount)}</li>)}</ul>
        {lines.length === 0 ? <p className="hint">Belum ada bagi hasil pada periode ini. Bonus tetap bisa ditambahkan.</p> : null}
        <div className="form-row">
          <Field id="bonus" label="Bonus" hint="Isi 0 jika tidak ada."><CurrencyInput id="bonus" value={bonus} onChange={setBonus} /></Field>
          <Field id="potong" label="Potongan" hint="Contoh kasbon."><CurrencyInput id="potong" value={potongan} onChange={setPotongan} /></Field>
        </div>
        <Field id="catatan-slip" label="Catatan"><textarea className="field" id="catatan-slip" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Dibayar tanggal 5." /></Field>
        <p>Take home pay {rupiah(net)}</p>
        <ActionButton type="submit">Simpan draf</ActionButton>
      </form>
      {slip ? (
        <div style={{ marginTop: 16 }}>
          <div className="top-actions">
            <ActionButton className="btn btn-ghost btn-sm" type="button" onClick={() => act({ type: 'set-payslip', id: slip.id, status: 'disetujui' })}>Setujui</ActionButton>
            <ActionButton className="btn btn-ghost btn-sm" type="button" onClick={() => act({ type: 'set-payslip', id: slip.id, status: 'dibayar' })}>Tandai dibayar</ActionButton>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => void unduhLembar(lembarSlip(state, slip))}>Unduh PDF</button>
            <button className="btn btn-grad btn-sm" type="button" onClick={() => void kirimWa(state.workers.find((item) => item.id === slip.workerId)?.whatsapp || '', `Slip gaji ${slip.number} periode ${slip.period}: ${rupiah(slip.net)}.`)}>Kirim WA</button>
          </div>
          <LembarView lembar={lembarSlip(state, slip)} />
        </div>
      ) : null}
    </AppShell>
  )
}
