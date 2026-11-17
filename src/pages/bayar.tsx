import { useState } from 'react'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { Combobox } from '../components/Combobox'
import { CaraMengisi, Field } from '../components/Field'
import { useAnara } from '../data/store'
import { supabase } from '../lib/supabase'
import type { PaySettings } from '../types'

export function BayarPage() {
  const { state, act } = useAnara()
  const [form, setForm] = useState<PaySettings>(state.paySettings)
  const [note, setNote] = useState('')
  const banks = state.options.filter((item) => item.category === 'bank' && item.active)
  function set<K extends keyof PaySettings>(key: K, value: PaySettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <h1>Pembayaran</h1>
          <p>Bawaan adalah QRIS statis dan transfer bank, tanpa biaya bulanan. Gateway otomatis hanya dipakai bila kunci server sudah diisi.</p>
        </div>
      </header>
      <form className="card" onSubmit={async (event) => {
        event.preventDefault()
        const file = (event.currentTarget.elements.namedItem('qris') as HTMLInputElement).files?.[0]
        let qrisPath = form.qrisPath
        if (file && supabase) {
          const path = `qris/${Date.now()}-${file.name.replace(/[^\w.]+/g, '-')}`
          const uploaded = await supabase.storage.from('payment-assets').upload(path, file, { upsert: true })
          if (uploaded.error) { setNote(uploaded.error.message); return }
          qrisPath = path
        }
        const result = await act({ type: 'save-pay-settings', patch: { ...form, qrisPath } })
        setNote(result.error || result.info || '')
      }}>
        <CaraMengisi judul="Cara mengisi" butir={['Unggah gambar QRIS usaha dan isi rekening. Ini jalur gratis.', 'Gateway opsional: QRIS dinamis saja, virtual account bisa dimatikan.', 'Kartu dan dompet digital tidak diaktifkan. Biaya per transaksi mengikuti tarif resmi gateway, tanpa angka tetap di aplikasi.']} />
        <Field id="penyedia" label="Jalur" required tooltip="Manual selalu tersedia. Gateway hanya menambah QRIS dinamis.">
          <select id="penyedia" className="field" value={form.provider} onChange={(event) => set('provider', event.target.value as PaySettings['provider'])}>
            <option value="manual">QRIS statis dan transfer (gratis)</option>
            <option value="midtrans">Midtrans · QRIS dinamis</option>
            <option value="xendit">Xendit · QRIS dinamis</option>
            <option value="tripay">Tripay · QRIS dinamis</option>
            <option value="duitku">Duitku · QRIS dinamis</option>
          </select>
        </Field>
        <p className="hint">Biaya per transaksi mengikuti tarif resmi gateway yang dipilih. ANARA tidak menambahkan biaya langganan dan tidak mengunci angka fee di aplikasi.</p>
        <label className="check"><input type="checkbox" checked={form.sandbox} onChange={(event) => set('sandbox', event.target.checked)} /> Mode sandbox</label>
        <label className="check"><input type="checkbox" checked={form.qrisDynamic} onChange={(event) => set('qrisDynamic', event.target.checked)} /> QRIS dinamis, bila gateway aktif</label>
        <label className="check"><input type="checkbox" checked={form.vaEnabled} onChange={(event) => set('vaEnabled', event.target.checked)} /> Virtual account opsional</label>
        <p className="hint">Kartu kredit dan e-wallet berbiaya lebih tinggi tidak ditawarkan.</p>
        <Combobox label="Bank" value={form.bankName} options={banks.map((item) => ({ value: item.label, label: item.label }))} onChange={(value) => set('bankName', value)}           onCreate={async (label) => { await act({ type: 'add-option', category: 'bank', label }) }} hint="Bisa menambah bank baru." />
        <Field id="rekening" label="Nomor rekening" hint="Dilihat klien di halaman tagihan.">
          <input className="field" id="rekening" value={form.bankNumber} onChange={(event) => set('bankNumber', event.target.value)} />
        </Field>
        <Field id="atas-nama" label="Atas nama">
          <input className="field" id="atas-nama" value={form.bankHolder} onChange={(event) => set('bankHolder', event.target.value)} />
        </Field>
        <Field id="qris" label="Gambar QRIS" hint="PNG atau JPG. Tampil di invoice publik.">
          <input className="field" id="qris" name="qris" type="file" accept="image/*" />
        </Field>
        <Field id="tripay" label="Kode merchant Tripay" hint="Hanya identitas merchant. Kunci privat di secret server.">
          <input className="field" id="tripay" value={form.tripayMerchant} onChange={(event) => set('tripayMerchant', event.target.value)} />
        </Field>
        <Field id="duitku" label="Kode merchant Duitku" hint="Kunci API tetap di secret server.">
          <input className="field" id="duitku" value={form.duitkuMerchant} onChange={(event) => set('duitkuMerchant', event.target.value)} />
        </Field>
        {note ? <p role="status">{note}</p> : null}
        <ActionButton type="submit">Simpan pembayaran</ActionButton>
      </form>
    </AppShell>
  )
}
