import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PublicShell } from '../components/chrome'
import { useAnara } from '../data/store'
import { callRpc } from '../data/remote'
import { TRACK_HINT } from '../data/seed'
import { phoneKey, rupiah, tanggal } from '../lib/format'
import { STAGE_FLOW, STAGE_LABEL } from '../lib/sop'
import type { PackageItem } from '../types'

function harga(item: PackageItem): string {
  if (item.fixed || item.priceMin === item.priceMax) return rupiah(item.priceMin)
  return `${rupiah(item.priceMin)}–${rupiah(item.priceMax)}`
}

export function HomePage() {
  const { state } = useAnara()
  const groups = [
    { id: 'studio', title: 'ANARA Studio', text: 'Video, audio, video AI, dan undangan digital.' },
    { id: 'edukasi', title: 'ANARA Edukasi', text: 'Pendampingan mahasiswa reguler dan RPL. Bukan pengganti penulis, tanpa jaminan kelulusan.' },
    { id: 'tech', title: 'ANARA Tech', text: 'Situs profil, aplikasi kerja, Android, dan flipbook.' },
  ] as const
  return (
    <PublicShell>
      <section className="hero">
        <div className="wrap">
          <div className="rise">
            <div className="kicker">ANARA, Beyond Value</div>
            <h1>Karya yang <em>beyond value</em>.</h1>
            <p className="lead">Studio visual, pendampingan akademik, dan solusi digital dalam satu tempat. Pesan dari ponsel atau komputer, dengan kontrak dan pembayaran yang tertib.</p>
            <div className="hero-actions">
              <a className="btn btn-grad" href="#harga">Lihat layanan dan harga</a>
              <a className="btn btn-ghost" href="https://wa.me/625811699699">Chat WhatsApp 0581-1699-699</a>
            </div>
            <div className="chips">
              <span className="chip">✦ Studio</span>
              <span className="chip">◇ Edukasi</span>
              <span className="chip">◎ Tech</span>
              <span className="chip">Kontrak otomatis</span>
              <span className="chip">Lacak pesanan</span>
            </div>
          </div>
          <div className="bento rise">
            <div className="tile"><div className="ico st">🎬</div><h3>Studio</h3><p>Video, audio, video AI, dan undangan digital.</p></div>
            <div className="tile"><div className="ico ed">📚</div><h3>Edukasi</h3><p>Pendampingan mahasiswa reguler dan RPL.</p></div>
            <div className="tile wide"><div className="ico te">💻</div><div><h3>Tech</h3><p>Situs, aplikasi kerja, Android, dan flipbook. Satu standar: brief, kontrak, DP, file akhir.</p></div></div>
          </div>
        </div>
      </section>
      <section id="layanan">
        <div className="wrap">
          <div className="sec-head">
            <h2>Layanan yang hidup di satu atap</h2>
            <p>Pilih unit yang sesuai. Harga di halaman ini mengikuti daftar harga resmi ANARA.</p>
          </div>
        </div>
      </section>
      <section id="harga" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <h2>Daftar harga resmi</h2>
            <p>Harga undangan sudah tetap. Kisaran lain berarti nilai akhir disepakati pada penawaran, berlaku tujuh hari.</p>
          </div>
          {groups.map((group) => (
            <div key={group.id} style={{ marginBottom: 28 }}>
              <h3 className="sora" style={{ marginBottom: 6 }}>{group.title}</h3>
              <p style={{ color: 'var(--muted)', marginBottom: 14 }}>{group.text}</p>
              <div className="pkg-grid">
                {state.packages.filter((item) => item.brand === group.id && item.active).map((item) => (
                  <article key={item.id} className={`pkg ${item.brand === 'edukasi' ? 'edu' : item.brand}`}>
                    <div className="unit-tag">{group.title.replace('ANARA ', '')}</div>
                    <h3>{item.name}</h3>
                    <p className="desc">{item.summary}</p>
                    <div className="price">{harga(item)}</div>
                    <div className="price-note">{item.fixed ? 'Harga resmi' : 'Harga resmi, sesuai lingkup'}</div>
                    <Link className={item.id === 'undangan-premium' ? 'btn btn-grad btn-sm' : 'btn btn-ink btn-sm'} to={`/paket/${item.slug}`}>Lihat paket</Link>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="alur">
        <div className="wrap">
          <div className="sec-head"><h2>Cara memesan, empat langkah</h2><p>Sama di ponsel maupun komputer. Kontrak dan tagihan terbit dari data pesanan.</p></div>
          <div className="steps">
            <div className="step"><div className="n">01</div><h3>Pilih paket</h3><p>Lihat katalog, lalu isi brief singkat.</p></div>
            <div className="step"><div className="n">02</div><h3>Setujui kontrak</h3><p>Perjanjian terisi otomatis. Klien menyetujui secara digital.</p></div>
            <div className="step"><div className="n">03</div><h3>Bayar uang muka</h3><p>Standar 50 persen. Kerja dimulai setelah DP masuk.</p></div>
            <div className="step"><div className="n">04</div><h3>Revisi dan file akhir</h3><p>Dua putaran revisi termasuk. File akhir setelah pelunasan.</p></div>
          </div>
        </div>
      </section>
      <section id="karya">
        <div className="wrap">
          <div className="sec-head"><h2>Karya dan kata klien</h2><p>Cuplikan portofolio dan testimoni yang diizinkan. Naskah akademik tidak ditampilkan.</p></div>
          <div className="port" style={{ marginBottom: 22 }}>
            {state.portfolio.filter((item) => item.published).map((item) => (
              <div className="item" key={item.id}>
                <div className="ph" />
                <b>{item.title}</b>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{item.caption} {item.sample ? <span className="demo-tag" /> : null}</p>
              </div>
            ))}
          </div>
          <div className="carousel">
            {state.testimonials.filter((item) => item.published).map((item) => (
              <article className="quote" key={item.id}>
                {item.sample ? <span className="demo-tag" /> : null}
                <div className="stars">{'★'.repeat(item.stars)}</div>
                <p>“{item.quote}”</p>
                <div className="who">{item.name} · {item.role}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}

export function PackagePage() {
  const { slug } = useParams()
  const { state } = useAnara()
  const item = state.packages.find((pack) => pack.slug === slug)
  if (!item) {
    return <PublicShell><div className="wrap page-head"><h1>Paket tidak ditemukan</h1><Link to="/">Kembali ke katalog</Link></div></PublicShell>
  }
  const dp = Math.round(item.priceMin * 0.5)
  return (
    <PublicShell>
      <div className="wrap page-head">
        <div className="kicker">ANARA {item.brand === 'studio' ? 'Studio' : item.brand === 'tech' ? 'Tech' : 'Edukasi'}</div>
        <h1>{item.name}</h1>
        <p>{item.summary}</p>
      </div>
      <div className="wrap layout-2">
        <article className="card">
          <h3>Yang termasuk</h3>
          <p>Dua putaran revisi selama masih dalam lingkup. Uang muka standar 50 persen. File akhir setelah pelunasan.</p>
          {item.brand === 'edukasi' ? <p>Layanan ini pendampingan dan penyuntingan. Klien tetap bertanggung jawab atas keaslian naskah. Tidak ada jaminan kelulusan.</p> : null}
          {item.brand === 'tech' ? <p>Perbaikan bug pada lingkup yang disepakati berlaku 30 hari setelah serah terima.</p> : null}
          <p>Pembatalan sebelum kerja dimulai: DP kembali dipotong 10 persen. Setelah mulai, DP tidak kembali.</p>
          <p>Penawaran kisaran berlaku tujuh hari. Nilai akhir dikunci tertulis.</p>
        </article>
        <aside className="summary">
          <h3>Ringkasan harga</h3>
          <div className="row"><span>Harga</span><b>{harga(item)}</b></div>
          <div className="row"><span>Uang muka 50%</span><b>{item.fixed ? rupiah(dp) : 'dari penawaran'}</b></div>
          <div className="row"><span>Revisi</span><b>2 putaran</b></div>
          <p className="total">{item.fixed ? `DP ${rupiah(dp)}` : 'Nilai menyusul'}</p>
          <Link className="btn btn-ghost btn-wide" style={{ marginTop: 16, background: '#fff', color: '#0A0A0B' }} to={`/pesan?paket=${item.slug}`}>Pesan paket ini</Link>
        </aside>
      </div>
    </PublicShell>
  )
}

export function OrderPage() {
  const { state, act } = useAnara()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initial = params.get('paket') || 'undangan-premium'
  const [packageId, setPackageId] = useState(state.packages.some((item) => item.id === initial) ? initial : state.packages[0]?.id || '')
  const [message, setMessage] = useState('')
  const pack = state.packages.find((item) => item.id === packageId)
  const price = pack?.fixed ? pack.priceMin : pack?.priceMin || 0
  const dpPercent = price >= 3_000_000 ? 70 : 50
  const dp = Math.round((price * dpPercent) / 100)
  const summary = useMemo(() => ({ price, dp, rest: price - dp, dpPercent }), [price, dp, dpPercent])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const files = (form.get('berkas') as File | null)?.name ? [(form.get('berkas') as File).name] : []
    const result = await act({
      type: 'create-order',
      input: {
        name: String(form.get('nama') || ''),
        whatsapp: String(form.get('wa') || ''),
        email: String(form.get('email') || ''),
        address: String(form.get('alamat') || ''),
        institution: String(form.get('instansi') || ''),
        packageId,
        brief: String(form.get('brief') || ''),
        dueDate: String(form.get('tenggat') || ''),
        studentStatus: String(form.get('status') || '') as '' | 'reguler' | 'rpl',
        campus: String(form.get('kampus') || ''),
        scriptType: String(form.get('naskah') || ''),
        referrer: String(form.get('perujuk') || ''),
        files,
        price: pack && !pack.fixed ? Number(form.get('nilai') || price) : price,
      },
    })
    if (result.error) {
      setMessage(result.error)
      return
    }
    const parts = (result.info || '').split('|')
    navigate(`/setujui/${parts[1] || ''}`, { state: { note: parts[0], code: parts[2], otp: parts[3] } })
  }

  return (
    <PublicShell>
      <div className="wrap page-head">
        <h1>Formulir pesanan</h1>
        <p>Isi data singkat. Setelah dikirim, ANARA merapikan brief, menerbitkan kontrak, lalu menagih uang muka. Kerja dimulai setelah DP masuk.</p>
      </div>
      <div className="wrap layout-2">
        <form className="card" onSubmit={onSubmit}>
          <h3>Data pemesan</h3>
          <div className="form-row">
            <div><label htmlFor="nama">Nama lengkap</label><input className="field" id="nama" name="nama" required minLength={3} /></div>
            <div><label htmlFor="wa">WhatsApp</label><input className="field" id="wa" name="wa" required placeholder="08xxxxxxxxxx" inputMode="tel" /></div>
          </div>
          <div className="form-row">
            <div><label htmlFor="email">Surel (opsional)</label><input className="field" id="email" name="email" type="email" /></div>
            <div><label htmlFor="alamat">Alamat</label><input className="field" id="alamat" name="alamat" /></div>
          </div>
          <label htmlFor="instansi">Instansi atau kampus</label>
          <input className="field" id="instansi" name="instansi" />
          <h3>Paket dan brief</h3>
          <label htmlFor="paket">Paket</label>
          <select className="field" id="paket" value={packageId} onChange={(event) => setPackageId(event.target.value)}>
            {state.packages.filter((item) => item.active).map((item) => (
              <option key={item.id} value={item.id}>{item.name} — {harga(item)}</option>
            ))}
          </select>
          {!pack?.fixed ? (
            <>
              <label htmlFor="nilai">Nilai penawaran awal (dalam kisaran)</label>
              <input className="field" id="nilai" name="nilai" type="number" min={pack?.priceMin} max={pack?.priceMax} defaultValue={pack?.priceMin} />
              <p className="hint">Angka ini contoh hitungan awal. Nilai akhir mengikuti penawaran tertulis, berlaku tujuh hari.</p>
            </>
          ) : null}
          <label htmlFor="brief">Ceritakan kebutuhan</label>
          <textarea className="field" id="brief" name="brief" required placeholder="Tanggal acara, jenis naskah, atau fitur yang diinginkan" />
          <div className="form-row">
            <div><label htmlFor="tenggat">Target selesai</label><input className="field" id="tenggat" name="tenggat" type="date" /></div>
            <div>
              <label htmlFor="status">Status (Edukasi)</label>
              <select className="field" id="status" name="status" defaultValue="">
                <option value="">Tidak terkait Edukasi</option>
                <option value="reguler">Mahasiswa reguler</option>
                <option value="rpl">Mahasiswa RPL</option>
              </select>
            </div>
          </div>
          {pack?.brand === 'edukasi' ? (
            <div className="form-row">
              <div><label htmlFor="kampus">Kampus</label><input className="field" id="kampus" name="kampus" /></div>
              <div><label htmlFor="naskah">Jenis naskah</label><input className="field" id="naskah" name="naskah" placeholder="Tugas, KTI, skripsi, tesis, RPL" /></div>
            </div>
          ) : null}
          <label htmlFor="perujuk">Perujuk, jika ada</label>
          <input className="field" id="perujuk" name="perujuk" />
          <label htmlFor="berkas">Berkas pendukung</label>
          <input className="field" id="berkas" name="berkas" type="file" />
          <p className="hint">Nama berkas dicatat bersama brief. File akhir baru dapat diunduh setelah pelunasan.</p>
          <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
            <input type="checkbox" required style={{ marginTop: 4 }} />
            <span>Saya bersedia meninjau perjanjian sebelum membayar uang muka. DP {dpPercent} persen, dua putaran revisi, file akhir setelah pelunasan.</span>
          </label>
          {message ? <p role="alert">{message}</p> : null}
          <button className="btn btn-grad btn-wide" type="submit">Kirim pesanan dan buat kontrak</button>
        </form>
        <aside>
          <div className="summary">
            <h3>Ringkasan</h3>
            <div className="row"><span>Paket</span><b>{pack?.name}</b></div>
            <div className="row"><span>Harga awal</span><b>{rupiah(summary.price)}</b></div>
            <div className="row"><span>Uang muka {summary.dpPercent}%</span><b>{rupiah(summary.dp)}</b></div>
            <div className="row"><span>Sisa</span><b>{rupiah(summary.rest)}</b></div>
            <div className="row"><span>Revisi termasuk</span><b>2 putaran</b></div>
            <p className="total">DP {rupiah(summary.dp)}</p>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, marginTop: 8 }}>Rekening usaha tercantum pada tagihan setelah diisi di pengaturan. Order di atas Rp3 juta memakai DP 70 persen.</p>
          </div>
        </aside>
      </div>
    </PublicShell>
  )
}

export function SignPage() {
  const { id } = useParams()
  const { state, act, mode } = useAnara()
  const contract = state.contracts.find((item) => item.id === id)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  if (done) {
    return <PublicShell><div className="wrap page-head"><h1>Kontrak disetujui</h1><p>{note}</p><Link to="/lacak">Lacak pesanan</Link></div></PublicShell>
  }
  if (!contract) {
    return <PublicShell><div className="wrap page-head"><h1>Kontrak tidak ditemukan</h1><p>Buka tautan dari pesanan, atau lacak dengan kode order.</p></div></PublicShell>
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    let ip = 'tidak tersedia'
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const json = (await response.json()) as { ip?: string }
      if (json.ip) ip = json.ip
    } catch {
      ip = 'tidak tersedia'
    }
    const result = await act({
      type: 'sign',
      contractId: contract!.id,
      name: String(form.get('nama') || ''),
      otp: String(form.get('otp') || ''),
      agree: form.get('setuju') === 'on',
      ip,
      userAgent: navigator.userAgent,
    })
    setNote(result.error || result.info || '')
    if (!result.error) setDone(true)
  }
  return (
    <PublicShell>
      <div className="wrap page-head">
        <h1>Persetujuan kontrak</h1>
        <p>{contract.number || 'Tanpa nomor'} · {contract.title}</p>
      </div>
      <div className="wrap layout-2">
        <article className="contract-preview">
          <div className="kop">
            <strong className="sora">ANARA</strong>
            <div style={{ textAlign: 'right', fontSize: 12 }}>{contract.number}</div>
          </div>
          <div className="rule" />
          <div className="addr">Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0581-1699-699</div>
          <h2>{contract.title}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{contract.body}</pre>
        </article>
        <form className="card" onSubmit={onSubmit}>
          <h3>Tanda persetujuan</h3>
          <p>Tuliskan nama terang, centang persetujuan, lalu masukkan kode yang dikirim ke WhatsApp pesanan.</p>
          {mode === 'demo' && contract.otpHint ? (
            <p><span className="demo-tag" /> Kode percobaan: <b>{contract.otpHint}</b></p>
          ) : null}
          <label htmlFor="nama">Nama terang</label>
          <input className="field" id="nama" name="nama" required minLength={3} />
          <label htmlFor="otp">Kode konfirmasi</label>
          <input className="field" id="otp" name="otp" inputMode="numeric" required />
          <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
            <input type="checkbox" name="setuju" required />
            <span>Saya sudah membaca perjanjian dan menyetujuinya.</span>
          </label>
          <button className="btn btn-grad btn-wide" type="submit">Setujui kontrak</button>
          {note ? <p role="status">{note}</p> : null}
          {contract.status === 'disetujui' ? <p>Disetujui oleh {contract.signerName} pada {tanggal(contract.signedAt)}. Jejak IP: {contract.ip || 'tidak tersedia'}.</p> : null}
        </form>
      </div>
    </PublicShell>
  )
}

export function TrackPage() {
  const { state, mode } = useAnara()
  const [code, setCode] = useState('')
  const [wa, setWa] = useState('')
  const [looked, setLooked] = useState(false)
  const [remoteOrder, setRemoteOrder] = useState<{ code: string; title: string; brand: string; stage: string; price: number; dueDate: string; sample?: boolean } | null>(null)
  const order = state.orders.find((item) => item.code.toLowerCase() === code.trim().toLowerCase())
  const client = state.clients.find((item) => item.id === order?.clientId)
  const match = Boolean(order && client && phoneKey(client.whatsapp) === phoneKey(wa))
  const view = match && order ? order : remoteOrder
  const index = view ? STAGE_FLOW.indexOf(view.stage as (typeof STAGE_FLOW)[number]) : -1
  async function search(nextCode = code, nextWa = wa) {
    setLooked(true)
    setRemoteOrder(null)
    if (mode !== 'live') return
    try {
      const data = await callRpc<NonNullable<typeof remoteOrder>>('track_order', { p_code: nextCode, p_wa: nextWa })
      setRemoteOrder(data)
    } catch {
      setRemoteOrder(null)
    }
  }
  return (
    <PublicShell>
      <div className="wrap page-head">
        <h1>Lacak pesanan</h1>
        <p>Masukkan kode order dan nomor WhatsApp yang terdaftar pada pesanan.</p>
      </div>
      <div className="wrap layout-2">
        <div>
          <form className="card" style={{ marginBottom: 16 }} onSubmit={(event) => { event.preventDefault(); void search() }}>
            <label htmlFor="kode">Kode order</label>
            <input className="field" id="kode" value={code} onChange={(event) => setCode(event.target.value)} placeholder="ORD/STD/001/XI/2026" />
            <label htmlFor="wa-lacak">Nomor WhatsApp</label>
            <input className="field" id="wa-lacak" value={wa} onChange={(event) => setWa(event.target.value)} inputMode="tel" />
            <button className="btn btn-grad" type="submit">Cari</button>
            <button className="btn btn-ghost" type="button" style={{ marginLeft: 8 }} onClick={() => { setCode(TRACK_HINT.code); setWa(TRACK_HINT.whatsapp); void search(TRACK_HINT.code, TRACK_HINT.whatsapp) }}>Isi data contoh</button>
          </form>
          {looked && !view ? <div className="card empty" role="status">Pesanan tidak ditemukan. Periksa kode dan nomor WhatsApp.</div> : null}
          {view ? (
            <div className="card">
              <div className="badge studio">{view.brand}</div>
              {view.sample ? <span className="demo-tag" /> : null}
              <h2 style={{ fontSize: 22, margin: '8px 0' }}>{view.title}</h2>
              <p style={{ color: 'var(--muted)' }}>{view.code} · {rupiah(view.price)} · tenggat {tanggal(view.dueDate)}</p>
              <div className="timeline" style={{ marginTop: 16 }}>
                {STAGE_FLOW.map((stage, stageIndex) => (
                  <div key={stage} className={`tl-item ${view?.stage === 'batal' ? '' : stageIndex < index ? 'done' : stageIndex === index ? 'now' : ''}`}>
                    <div><div className="dot" />{stageIndex < STAGE_FLOW.length - 1 ? <div className="line" /> : null}</div>
                    <div className="tl-body"><h4>{STAGE_LABEL[stage]}</h4><p>{stageIndex === index ? 'Tahap saat ini.' : stageIndex < index ? 'Selesai.' : 'Belum.'}</p></div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <aside className="card">
          <h3>Butuh bantuan?</h3>
          <p>Admin WhatsApp membalas pada hari kerja yang sama.</p>
          <a className="btn btn-grad btn-wide" href="https://wa.me/625811699699">Chat 0581-1699-699</a>
          <p style={{ marginTop: 12 }}><Link to="/syarat">Syarat dan ketentuan</Link></p>
        </aside>
      </div>
    </PublicShell>
  )
}

export function TermsPage() {
  const { state } = useAnara()
  const body = state.templates.find((item) => item.key === 'snk')?.body || ''
  return (
    <PublicShell>
      <div className="wrap page-head"><h1>Syarat dan ketentuan</h1><p>Ringkasan untuk setiap order. Perjanjian yang ditandatangani diutamakan jika ada perbedaan.</p></div>
      <article className="wrap card" style={{ whiteSpace: 'pre-wrap', marginBottom: 40 }}>{body}</article>
    </PublicShell>
  )
}

export function LoginPage() {
  const { mode, act, loginLive, signupLive } = useAnara()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  return (
    <PublicShell>
      <div className="wrap page-head">
        <h1>Masuk tim</h1>
        <p>Pemilik, keuangan, pekerja, dan admin media sosial memakai peran yang berbeda.</p>
      </div>
      <div className="wrap layout-2">
        <form className="card" onSubmit={async (event) => {
          event.preventDefault()
          if (mode === 'demo') {
            setError('Mode contoh memakai tombol peran di samping.')
            return
          }
          const message = await loginLive(email, password)
          setError(message || '')
          if (!message) navigate('/app')
        }}>
          <h3>Akun server</h3>
          <label htmlFor="email">Surel</label>
          <input className="field" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
          <label htmlFor="sandi">Kata sandi</label>
          <input className="field" id="sandi" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          <label htmlFor="nama-akun">Nama saat daftar</label>
          <input className="field" id="nama-akun" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="btn btn-grad" type="submit">Masuk</button>
          <button className="btn btn-ghost" type="button" style={{ marginLeft: 8 }} onClick={async () => {
            const message = await signupLive(email, password, name)
            setError(message || 'Pendaftaran terkirim. Jika konfirmasi surel aktif, buka surel itu lalu masuk. Pemilik pertama dapat ditetapkan dari SQL di README.')
          }}>Daftar</button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
        <div className="card">
          <h3>Mode contoh</h3>
          <p>Pilih peran untuk melihat batas akses. Tidak ada kata sandi pada mode ini.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-grad" type="button" onClick={async () => { await act({ type: 'login-demo', role: 'owner' }); navigate('/app') }}>Masuk sebagai pemilik</button>
            <button className="btn btn-ghost" type="button" onClick={async () => { await act({ type: 'login-demo', role: 'finance' }); navigate('/app') }}>Masuk sebagai keuangan</button>
            <button className="btn btn-ghost" type="button" onClick={async () => { await act({ type: 'login-demo', role: 'worker' }); navigate('/app') }}>Masuk sebagai pekerja</button>
            <button className="btn btn-ghost" type="button" onClick={async () => { await act({ type: 'login-demo', role: 'social' }); navigate('/app') }}>Masuk sebagai admin medsos</button>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
