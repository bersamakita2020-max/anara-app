import { useState } from 'react'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { CurrencyInput } from '../components/CurrencyInput'
import { useAnara } from '../data/store'
import { rupiah } from '../lib/format'
import type { Brand } from '../types'

export function LayananPage() {
  const { state, act } = useAnara()
  const [brand, setBrand] = useState<Brand>('studio')
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [features, setFeatures] = useState('')
  const [icon, setIcon] = useState('✦')
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(0)
  const [days, setDays] = useState(7)
  const [editing, setEditing] = useState<string | undefined>()
  const items = [...state.packages].sort((a, b) => a.sort - b.sort)
  return (
    <AppShell>
      <h1>Kelola layanan</h1>
      <p style={{ color: 'var(--muted)' }}>Perubahan langsung tampil di katalog pelanggan.</p>
      <div className="card table-wrap" style={{ marginTop: 16 }}>
        {items.length === 0 ? <p className="empty">Belum ada layanan.</p> : null}
        <table className="data">
          <thead><tr><th>Layanan</th><th>Unit</th><th>Harga</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.icon} {item.name}<br /><span style={{ color: 'var(--muted)' }}>{item.leadDays} hari · {item.features || item.summary}</span></td>
                <td>{item.brand}</td>
                <td>{item.priceMin === item.priceMax ? rupiah(item.priceMin) : `${rupiah(item.priceMin)}–${rupiah(item.priceMax)}`}</td>
                <td>{item.active ? 'Aktif' : 'Nonaktif'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setEditing(item.id); setName(item.name); setSummary(item.summary); setFeatures(item.features); setIcon(item.icon || '✦'); setBrand(item.brand); setMin(item.priceMin); setMax(item.priceMax); setDays(item.leadDays) }}>Ubah</button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'save-package', id: item.id, slug: item.slug, brand: item.brand, name: item.name, summary: item.summary, features: item.features, priceMin: item.priceMin, priceMax: item.priceMax, leadDays: item.leadDays, icon: item.icon, active: !item.active })}>{item.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'move-package', id: item.id, direction: 'naik' })}>Naik</button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'move-package', id: item.id, direction: 'turun' })}>Turun</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => {
        event.preventDefault()
        const slug = editing || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        void act({ type: 'save-package', id: editing, slug, brand, name, summary, features, priceMin: min, priceMax: max || min, leadDays: days, icon, active: true })
        setEditing(undefined); setName(''); setSummary(''); setFeatures(''); setMin(0); setMax(0)
      }}>
        <h3>{editing ? 'Ubah layanan' : 'Layanan baru'}</h3>
        <label htmlFor="nama-layanan">Nama</label>
        <input className="field" id="nama-layanan" value={name} onChange={(event) => setName(event.target.value)} required />
        <label htmlFor="unit-layanan">Sub-brand</label>
        <select id="unit-layanan" className="field" value={brand} onChange={(event) => setBrand(event.target.value as Brand)}>
          <option value="studio">Studio</option>
          <option value="edukasi">Edukasi</option>
          <option value="tech">Tech</option>
        </select>
        <label htmlFor="ringkas">Deskripsi</label>
        <textarea className="field" id="ringkas" value={summary} onChange={(event) => setSummary(event.target.value)} />
        <label htmlFor="fitur">Fitur</label>
        <textarea className="field" id="fitur" value={features} onChange={(event) => setFeatures(event.target.value)} />
        <div className="form-row">
          <div><label htmlFor="harga-min">Harga minimum</label><CurrencyInput id="harga-min" value={min} onChange={setMin} required /></div>
          <div><label htmlFor="harga-max">Harga maksimum</label><CurrencyInput id="harga-max" value={max} onChange={setMax} /></div>
        </div>
        <div className="form-row">
          <div><label htmlFor="hari">Estimasi hari</label><input className="field" id="hari" type="number" min={1} value={days} onChange={(event) => setDays(Number(event.target.value))} /></div>
          <div><label htmlFor="ikon">Ikon</label><input className="field" id="ikon" value={icon} onChange={(event) => setIcon(event.target.value)} /></div>
        </div>
        <ActionButton type="submit">{editing ? 'Simpan perubahan' : 'Tambah layanan'}</ActionButton>
      </form>
    </AppShell>
  )
}
