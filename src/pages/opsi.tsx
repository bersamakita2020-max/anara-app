import { useState } from 'react'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { CaraMengisi, Field } from '../components/Field'
import { useAnara } from '../data/store'

const KATEGORI = ['kategori', 'sumber_order', 'metode_bayar', 'bank', 'jabatan', 'satuan']

export function OpsiPage() {
  const { state, act } = useAnara()
  const [category, setCategory] = useState(KATEGORI[0])
  const [label, setLabel] = useState('')
  const items = state.options.filter((item) => item.category === category)
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <h1>Opsi dropdown</h1>
          <p>Pilihan yang ditambah di sini muncul lagi di combobox yang sesuai.</p>
        </div>
      </header>
      <form className="card" onSubmit={(event) => {
        event.preventDefault()
        void act({ type: 'add-option', category, label })
        setLabel('')
      }}>
        <CaraMengisi judul="Cara mengisi" butir={['Pilih kelompok, misalnya bank atau jabatan.', 'Ketik label baru. Label yang sama tidak digandakan.']} />
        <Field id="kelompok" label="Kelompok" required>
          <select id="kelompok" className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
            {KATEGORI.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
          </select>
        </Field>
        <Field id="label-opsi" label="Label" required hint="Contoh: BRI atau Manajer Keuangan.">
          <input className="field" id="label-opsi" value={label} onChange={(event) => setLabel(event.target.value)} required />
        </Field>
        <ActionButton type="submit">Simpan opsi</ActionButton>
      </form>
      <ul className="card" style={{ marginTop: 16 }}>
        {items.length === 0 ? <li>Belum ada opsi pada kelompok ini.</li> : null}
        {items.map((item) => <li key={item.id}>{item.label}</li>)}
      </ul>
    </AppShell>
  )
}
