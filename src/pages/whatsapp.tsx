import { useState } from 'react'
import { AppShell } from '../components/chrome'
import { ActionButton } from '../components/ActionButton'
import { DataTable } from '../components/DataTable'
import { CaraMengisi, Field } from '../components/Field'
import { useAnara } from '../data/store'
import { supabaseUrl } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { tanggalWaktu } from '../lib/format'

async function gateway(body: Record<string, unknown>) {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const session = await supabase?.auth.getSession()
  const response = await fetch(`${supabaseUrl}/functions/v1/wa-gateway`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${session?.data.session?.access_token || key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({})) as { error?: string; sent?: boolean; ready?: boolean }
  if (!response.ok) throw new Error(json.error || 'Fungsi WhatsApp belum di-deploy.')
  return json
}

export function WhatsappPage() {
  const { state, act } = useAnara()
  const settings = state.waSettings
  const [provider, setProvider] = useState(settings.provider)
  const [phoneId, setPhoneId] = useState(settings.phoneNumberId)
  const [waba, setWaba] = useState(settings.wabaId)
  const [cloud, setCloud] = useState('')
  const [fonnte, setFonnte] = useState('')
  const [target, setTarget] = useState('085811699699')
  const [note, setNote] = useState('')
  const siap = provider === 'cloud' ? settings.cloudReady : provider === 'fonnte' ? settings.fonnteReady : false
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <h1>WhatsApp</h1>
          <p>Jalur aktif dipakai untuk order, tagihan, pengingat, dan slip. Bila belum terhubung, aplikasi membuka tautan wa.me.</p>
        </div>
        <span className={siap ? 'pill ok' : 'pill'}>{siap ? 'Terhubung' : 'Belum terhubung'}</span>
      </header>
      <form className="card" onSubmit={async (event) => {
        event.preventDefault()
        setNote('')
        const saved = await act({ type: 'save-wa-public', provider, phoneNumberId: phoneId, wabaId: waba })
        if (saved.error) { setNote(saved.error); return }
        try {
          if (cloud) await gateway({ action: 'secret', kind: 'cloud', value: cloud })
          if (fonnte) await gateway({ action: 'secret', kind: 'fonnte', value: fonnte })
          setCloud(''); setFonnte('')
          setNote('Pengaturan tersimpan. Token tidak ditampilkan kembali.')
        } catch (error) {
          setNote(error instanceof Error ? error.message : 'Token belum tersimpan.')
        }
      }}>
        <CaraMengisi judul="Cara menghubungkan" butir={['Pilih Cloud API Meta atau Fonnte.', 'Isi Phone Number ID dan WABA ID untuk Meta. Token hanya dikirim ke fungsi server.', 'Tekan Tes kirim. Rahasia yang perlu ada di Supabase: tidak wajib bila token diisi dari halaman ini.']} />
        <Field id="jalur" label="Jalur aktif" required tooltip="Hanya satu jalur yang dipakai untuk kiriman otomatis.">
          <select id="jalur" className="field" value={provider} onChange={(event) => setProvider(event.target.value as typeof provider)}>
            <option value="none">Belum dihubungkan (wa.me)</option>
            <option value="cloud">WhatsApp Cloud API</option>
            <option value="fonnte">Fonnte</option>
          </select>
        </Field>
        <Field id="phone-id" label="Phone Number ID" hint="Dari Meta WhatsApp Manager. Bukan nomor yang dilihat pelanggan.">
          <input className="field" id="phone-id" value={phoneId} placeholder="123456789012345" onChange={(event) => setPhoneId(event.target.value)} />
        </Field>
        <Field id="waba" label="WABA ID" hint="ID akun WhatsApp Business.">
          <input className="field" id="waba" value={waba} onChange={(event) => setWaba(event.target.value)} />
        </Field>
        <Field id="token-cloud" label="Access token Cloud API" hint="Dikosongkan bila tidak diganti. Tidak pernah disimpan di browser." tooltip="Disimpan di tabel private lewat Edge Function wa-gateway.">
          <input className="field" id="token-cloud" type="password" autoComplete="off" value={cloud} onChange={(event) => setCloud(event.target.value)} />
        </Field>
        <Field id="token-fonnte" label="Token Fonnte" hint="Alternatif bila Cloud API belum dipakai.">
          <input className="field" id="token-fonnte" type="password" autoComplete="off" value={fonnte} onChange={(event) => setFonnte(event.target.value)} />
        </Field>
        {note ? <p role="status">{note}</p> : null}
        <ActionButton type="submit">Simpan jalur</ActionButton>
      </form>
      <form className="card" style={{ marginTop: 16 }} onSubmit={async (event) => {
        event.preventDefault()
        try {
          const result = await gateway({ action: 'send', target, message: 'Tes kirim dari ANARA.' })
          setNote(result.sent ? 'Pesan tes terkirim.' : 'Gateway belum mengirim. Tautan wa.me tetap tersedia.')
        } catch (error) {
          setNote(error instanceof Error ? error.message : 'Tes gagal.')
        }
      }}>
        <Field id="tujuan" label="Nomor tes" required hint="Contoh 085811699699.">
          <input className="field" id="tujuan" value={target} onChange={(event) => setTarget(event.target.value)} />
        </Field>
        <ActionButton type="submit">Tes kirim</ActionButton>
      </form>
      <div id="log" style={{ marginTop: 16 }}>
        <DataTable
          rows={state.waLog}
          empty="Belum ada log. Log terisi setelah fungsi wa-gateway berjalan."
          columns={[
            { key: 'waktu', label: 'Waktu', render: (row) => tanggalWaktu(row.at) },
            { key: 'arah', label: 'Arah', render: (row) => row.direction },
            { key: 'lawan', label: 'Nomor', render: (row) => row.peer },
            { key: 'status', label: 'Status', render: (row) => row.status },
          ]}
        />
      </div>
    </AppShell>
  )
}
