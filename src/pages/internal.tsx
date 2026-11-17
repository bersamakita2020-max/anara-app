import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/chrome'
import { useAnara } from '../data/store'
import { downloadCsv } from '../lib/csv'
import { downloadTablePdf, downloadTextPdf } from '../lib/pdf'
import { rupiah, tanggal, dueTone, todayISO } from '../lib/format'
import { buildAlerts, buildReport, defaultFilter, moneySnapshot, slaByStage, visibleOrders, type ReportFilter } from '../lib/insights'
import { STAGE_FLOW, STAGE_LABEL } from '../lib/sop'
import { TARGET_MIN_MONTHS } from '../lib/finance'
import type { Stage } from '../types'

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}

export function DashboardPage() {
  const { state } = useAnara()
  const money = moneySnapshot(state)
  const orders = visibleOrders(state)
  const active = orders.filter((item) => item.stage !== 'selesai' && item.stage !== 'batal')
  const counts = {
    studio: active.filter((item) => item.brand === 'studio').length,
    edukasi: active.filter((item) => item.brand === 'edukasi').length,
    tech: active.filter((item) => item.brand === 'tech').length,
  }
  const phase = state.settings.phase
  const ratio = state.settings.splits[phase]
  const maxTarget = Math.max(...TARGET_MIN_MONTHS.map((item) => item.revenue))
  return (
    <Shell>
      <div className="topbar" style={{ marginTop: -8 }}>
        <div>
          <h1>Ringkasan usaha</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Fase {phase} · porsi {ratio.join(' / ')} · laba {state.settings.ownerShare}:{state.settings.partnerShare}</p>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi v"><div className="l">Pendapatan bulan ini</div><div className="n">{rupiah(money.revenueMonth)}</div><div className="s">Dari order yang sudah lunas</div></div>
        <div className="kpi e"><div className="l">Saldo kas</div><div className="n">{rupiah(money.cash)}</div><div className="s">Dana darurat terkunci {rupiah(money.locked)}</div></div>
        <div className="kpi t"><div className="l">Order aktif</div><div className="n">{active.length}</div><div className="s">{counts.studio} Studio · {counts.edukasi} Edukasi · {counts.tech} Tech</div></div>
        <div className="kpi g"><div className="l">Settlement berikutnya</div><div className="n">Tgl 5</div><div className={`s ${money.recruitOpen ? '' : 'warn'}`}>{money.recruitOpen ? 'Rekrutmen boleh dibuka' : 'Rekrutmen masih terkunci'}</div></div>
      </div>
      <div className="grid-dash">
        <div className="card">
          <h3>Acuan target minimal 2027</h3>
          <div className="chart-row" aria-hidden="true">
            {TARGET_MIN_MONTHS.map((item) => (
              <div className="c" key={item.key}><i style={{ height: `${Math.max(8, (item.revenue / maxTarget) * 120)}px` }} /><b>{item.label}</b></div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Batang mengikuti target bulanan rencana bisnis. Realisasi ada di laporan.</p>
        </div>
        <div className="card">
          <h3>Bagi hasil fase {phase}</h3>
          <ul style={{ fontSize: 14, lineHeight: 1.7 }}>
            <li>Jasa pengerja {ratio[0]}%</li>
            <li>Kas {ratio[1]}%</li>
            <li>Operasional {ratio[2]}%</li>
            <li>Laba {ratio[3]}% lalu {state.settings.ownerShare}% pemilik / {state.settings.partnerShare}% mitra</li>
          </ul>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Honor peran {state.settings.partnerName.split(' ')[0]} bulan ini {rupiah(money.honor)}, dari pos operasional.</p>
        </div>
      </div>
      <BoardBlock />
    </Shell>
  )
}

function BoardBlock() {
  const { state } = useAnara()
  const orders = visibleOrders(state)
  const columns: { title: string; stages: Stage[] }[] = [
    { title: 'Masuk / brief', stages: ['masuk_brief', 'penawaran'] },
    { title: 'Kontrak / DP', stages: ['kontrak', 'menunggu_dp'] },
    { title: 'Pengerjaan / revisi', stages: ['pengerjaan', 'revisi', 'ditahan'] },
    { title: 'Pelunasan / serah', stages: ['menunggu_pelunasan', 'serah_terima'] },
  ]
  return (
    <div className="card" id="order">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h3>Papan order</h3>
        <Link className="btn btn-grad btn-sm" to="/app/order">Buka papan penuh</Link>
      </div>
      <div className="kanban" style={{ marginTop: 12 }}>
        {columns.map((column) => (
          <div className="col" key={column.title}>
            <h4>{column.title}</h4>
            {orders.filter((item) => column.stages.includes(item.stage)).map((item) => (
              <Link className="ticket" key={item.id} to={`/app/order/${item.id}`}>
                <span className={`badge ${item.brand === 'edukasi' ? 'edu' : item.brand}`}>{item.brand}</span>
                <b>{item.title}</b>
                <div className="meta">{item.code} · {rupiah(item.price)}</div>
              </Link>
            ))}
            {orders.filter((item) => column.stages.includes(item.stage)).length === 0 ? <p className="empty">Kosong</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OrdersPage() {
  const { state } = useAnara()
  const [brand, setBrand] = useState('semua')
  const orders = visibleOrders(state).filter((item) => brand === 'semua' || item.brand === brand)
  return (
    <Shell>
      <h1>Papan order</h1>
      <div className="tabs" role="tablist">
        {['semua', 'studio', 'edukasi', 'tech'].map((item) => (
          <button key={item} className={brand === item ? 'tab on' : 'tab'} type="button" onClick={() => setBrand(item)}>{item}</button>
        ))}
      </div>
      <div className="kanban">
        {STAGE_FLOW.map((stage) => (
          <div className="col" key={stage}>
            <h4>{STAGE_LABEL[stage]}</h4>
            {orders.filter((item) => item.stage === stage).map((item) => {
              const tone = dueTone(item.dueDate)
              return (
                <Link className="ticket" key={item.id} to={`/app/order/${item.id}`}>
                  <span className={`badge ${tone === 'late' ? 'late' : tone === 'soon' ? 'soon' : item.brand}`}>{tone === 'late' ? 'Terlambat' : tone === 'soon' ? 'Segera' : item.brand}</span>
                  {item.sample ? <span className="demo-tag" /> : null}
                  <b>{item.title}</b>
                  <div className="meta">{item.code}<br />{tanggal(item.dueDate)} · {rupiah(item.price)}</div>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
      {orders.length === 0 ? <p className="empty">Tidak ada order pada saringan ini.</p> : null}
    </Shell>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const { state, act } = useAnara()
  const order = state.orders.find((item) => item.id === id)
  const [note, setNote] = useState('')
  if (!order) return <Shell><h1>Order tidak ditemukan</h1></Shell>
  const client = state.clients.find((item) => item.id === order.clientId)
  const worker = state.workers.find((item) => item.id === order.assigneeId)
  const checks = state.checks.filter((item) => item.orderId === order.id && item.stage === order.stage)
  const invoices = state.invoices.filter((item) => item.orderId === order.id)
  const role = state.session?.role
  return (
    <Shell>
      <p><Link to="/app/order">Kembali ke papan</Link></p>
      <h1>{order.title}</h1>
      <p style={{ color: 'var(--muted)' }}>{order.code} {order.sample ? <span className="demo-tag" /> : null} · {STAGE_LABEL[order.stage]} · {rupiah(order.price)} · DP {order.dpPercent}% · revisi {order.revisionCount}/{order.revisionLimit}</p>
      <div className="grid-dash" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Brief</h3>
          <p>{order.brief || 'Belum ada uraian.'}</p>
          <p>Klien: {client?.name} · {client?.whatsapp}</p>
          <p>Pengerja: {worker?.name || 'Belum ditugaskan'}</p>
          <p>Tenggat: {tanggal(order.dueDate)} {order.referrer ? `· Perujuk ${order.referrer}` : ''}</p>
          {order.studentStatus ? <p>Status {order.studentStatus} · {order.campus} · {order.scriptType}</p> : null}
          {order.warrantyUntil ? <p>Garansi Tech sampai {tanggal(order.warrantyUntil)}</p> : null}
          <label htmlFor="tahap">Geser tahap</label>
          <select id="tahap" className="field" value={order.stage} onChange={(event) => void act({ type: 'move-stage', orderId: order.id, stage: event.target.value as Stage })}>
            {Object.entries(STAGE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          {role === 'owner' ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'move-stage', orderId: order.id, stage: order.stage === 'selesai' ? 'selesai' : 'serah_terima', override: true })}>Pengecualian pemilik ke serah terima</button> : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'add-revision', orderId: order.id, note })}>Catat revisi</button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'cancel-order', orderId: order.id, reason: note || 'Dibatalkan dari dasbor' })}>Batalkan</button>
          </div>
          <label htmlFor="catatan">Catatan</label>
          <input className="field" id="catatan" value={note} onChange={(event) => setNote(event.target.value)} />
          {role === 'owner' || role === 'finance' ? (
            <label>Tugaskan
              <select className="field" value={order.assigneeId} onChange={(event) => void act({ type: 'assign', orderId: order.id, workerId: event.target.value })}>
                {state.workers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          ) : null}
          <h3>Checklist {STAGE_LABEL[order.stage]}</h3>
          {checks.length === 0 ? <p className="empty">Tidak ada checklist pada tahap ini.</p> : null}
          {checks.map((item) => (
            <label key={item.id} style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
              <input type="checkbox" checked={item.done} onChange={() => void act({ type: 'toggle-check', checkId: item.id })} />
              <span>{item.sop} · {item.label}</span>
            </label>
          ))}
          <h3>Berkas</h3>
          {order.files.length === 0 ? <p>Belum ada berkas.</p> : <ul>{order.files.map((file) => <li key={file.id}>{file.name} · {file.kind}</li>)}</ul>}
          <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const file = new FormData(event.currentTarget).get('file') as File | null
            if (file?.name) void act({ type: 'add-file', orderId: order.id, name: file.name, kind: 'kerja' })
          }}>
            <label htmlFor="file">Unggah nama berkas</label>
            <input id="file" name="file" className="field" type="file" />
            <button className="btn btn-ghost btn-sm" type="submit">Simpan nama berkas</button>
          </form>
        </div>
        <div>
          <div className="card">
            <h3>Tagihan</h3>
            {invoices.length === 0 ? <p className="empty">Tagihan terbit setelah kontrak disetujui.</p> : null}
            {invoices.map((invoice) => (
              <p key={invoice.id}>{invoice.number}<br />{invoice.kind} · {rupiah(invoice.amount)} · {invoice.status}</p>
            ))}
            {state.contracts.filter((item) => item.orderId === order.id).map((item) => (
              <p key={item.id}><Link to={`/app/kontrak?id=${item.id}`}>{item.number || item.title}</Link> · {item.status}</p>
            ))}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Riwayat</h3>
            {state.events.filter((item) => item.orderId === order.id).slice(0, 8).map((item) => (
              <p key={item.id} style={{ fontSize: 13 }}>{tanggal(item.at)} · {STAGE_LABEL[item.stage]} · {item.note}</p>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function PeoplePage({ kind }: { kind: 'klien' | 'pekerja' }) {
  const { state, act } = useAnara()
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  return (
    <Shell>
      <h1>{kind === 'klien' ? 'Klien' : 'Pekerja'}</h1>
      {kind === 'klien' ? (
        state.clients.length === 0 ? <p className="empty">Belum ada klien.</p> : (
          <div className="table-wrap card">
            <table className="data">
              <thead><tr><th>Nama</th><th>WhatsApp</th><th>Instansi</th><th>Status</th></tr></thead>
              <tbody>
                {state.clients.map((item) => (
                  <tr key={item.id}><td>{item.name} {item.sample ? <span className="demo-tag" /> : null}</td><td>{item.whatsapp}</td><td>{item.institution || '—'}</td><td>{item.studentStatus || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="table-wrap card">
          <table className="data">
            <thead><tr><th>Nama</th><th>Peran</th><th>Order aktif</th></tr></thead>
            <tbody>
              {state.workers.map((item) => (
                <tr key={item.id}><td>{item.name} {item.sample ? <span className="demo-tag" /> : null}</td><td>{item.title}</td><td>{state.orders.filter((order) => order.assigneeId === item.id && order.stage !== 'selesai' && order.stage !== 'batal').length}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => {
        event.preventDefault()
        if (kind === 'klien') void act({ type: 'save-client', name, whatsapp })
        else void act({ type: 'save-worker', name, whatsapp, title: 'Pekerja lepas', brand: 'studio' })
        setName(''); setWhatsapp('')
      }}>
        <h3>Tambah</h3>
        <label htmlFor="nama-orang">Nama</label>
        <input className="field" id="nama-orang" value={name} onChange={(event) => setName(event.target.value)} required />
        <label htmlFor="wa-orang">WhatsApp</label>
        <input className="field" id="wa-orang" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required />
        <button className="btn btn-grad" type="submit">Simpan</button>
      </form>
    </Shell>
  )
}

export function PaymentsPage() {
  const { state, act } = useAnara()
  return (
    <Shell>
      <h1>Pembayaran</h1>
      <div className="table-wrap card">
        <table className="data">
          <thead><tr><th>Tagihan</th><th>Order</th><th>Nominal</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {state.payments.map((item) => {
              const invoice = state.invoices.find((row) => row.id === item.invoiceId)
              const order = state.orders.find((row) => row.id === item.orderId)
              return (
                <tr key={item.id}>
                  <td>{invoice?.number}<br />{item.proofName}</td>
                  <td>{order?.code}</td>
                  <td className="num">{rupiah(item.amount)}</td>
                  <td>{item.status}</td>
                  <td>{item.status === 'menunggu' ? <button className="btn btn-grad btn-sm" type="button" onClick={() => void act({ type: 'verify-payment', paymentId: item.id, accept: true })}>Verifikasi</button> : null}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {state.payments.length === 0 ? <p className="empty">Belum ada pembayaran.</p> : null}
      </div>
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const invoiceId = String(form.get('invoice'))
        const invoice = state.invoices.find((item) => item.id === invoiceId)
        if (!invoice) return
        void act({ type: 'add-payment', orderId: invoice.orderId, invoiceId, amount: Number(form.get('jumlah')), proofName: String(form.get('bukti') || 'bukti') })
      }}>
        <h3>Catat bukti transfer</h3>
        <label htmlFor="inv">Tagihan</label>
        <select className="field" id="inv" name="invoice" required>
          {state.invoices.filter((item) => item.status !== 'lunas').map((item) => <option key={item.id} value={item.id}>{item.number} · {rupiah(item.amount)}</option>)}
        </select>
        <label htmlFor="jumlah">Nominal</label>
        <input className="field" id="jumlah" name="jumlah" type="number" required />
        <label htmlFor="bukti">Nama berkas bukti</label>
        <input className="field" id="bukti" name="bukti" />
        <button className="btn btn-grad" type="submit">Simpan bukti</button>
      </form>
    </Shell>
  )
}

export function FinancePage() {
  const { state, act } = useAnara()
  const money = moneySnapshot(state)
  const phase = state.settings.phase
  return (
    <Shell>
      <h1>Keuangan</h1>
      <div className="kpis">
        <div className="kpi e"><div className="l">Kas</div><div className="n">{rupiah(money.cash)}</div><div className="s">Tersedia {rupiah(money.available)}</div></div>
        <div className="kpi g"><div className="l">Dana darurat</div><div className="n">{rupiah(money.locked)}</div><div className="s">Plafon {rupiah(state.settings.emergencyCap)}</div></div>
        <div className="kpi v"><div className="l">Operasional</div><div className="n">{rupiah(money.ops)}</div><div className="s">Setelah pengeluaran</div></div>
        <div className="kpi t"><div className="l">Laba tercatat</div><div className="n">{rupiah(money.ownerProfit + money.partnerProfit)}</div><div className="s">Pemilik {rupiah(money.ownerProfit)}</div></div>
      </div>
      <div className="card table-wrap">
        <h3>Bagi hasil per order lunas</h3>
        <table className="data">
          <thead><tr><th>Order</th><th>Fase</th><th className="num">Nilai</th><th className="num">Pengerja</th><th className="num">Kas</th><th className="num">Ops</th><th className="num">Laba</th></tr></thead>
          <tbody>
            {state.splits.map((item) => {
              const order = state.orders.find((row) => row.id === item.orderId)
              return (
                <tr key={item.id}>
                  <td>{order?.code}<br />{item.workerName}</td>
                  <td>{item.phase}</td>
                  <td className="num">{rupiah(item.gross)}</td>
                  <td className="num">{rupiah(item.worker)}</td>
                  <td className="num">{rupiah(item.cash)}</td>
                  <td className="num">{rupiah(item.ops)}</td>
                  <td className="num">{rupiah(item.ownerProfit)} / {rupiah(item.partnerProfit)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {state.splits.length === 0 ? <p className="empty">Belum ada order lunas.</p> : null}
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Referral tercatat {rupiah(money.referral)}. Honor fase {phase}: {rupiah(money.honor)}.</p>
      </div>
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        void act({ type: 'add-expense', date: String(form.get('tanggal') || todayISO()), category: String(form.get('kategori')), amount: Number(form.get('jumlah')), memo: String(form.get('memo') || '') })
      }}>
        <h3>Pengeluaran operasional</h3>
        <div className="form-row">
          <div><label htmlFor="kategori">Kategori</label><input className="field" id="kategori" name="kategori" required placeholder="Kuota, langganan, atau tools" /></div>
          <div><label htmlFor="jumlah-keluar">Nominal</label><input className="field" id="jumlah-keluar" name="jumlah" type="number" required /></div>
        </div>
        <label htmlFor="memo">Catatan</label>
        <input className="field" id="memo" name="memo" />
        <input type="hidden" name="tanggal" value={todayISO()} />
        <button className="btn btn-grad" type="submit">Catat pengeluaran</button>
        <p className="hint">Tools di atas kuota ditolak jika kas belum melewati {rupiah(state.settings.toolsThreshold)}.</p>
      </form>
    </Shell>
  )
}

export function ContractPage() {
  const { state, act } = useAnara()
  const [orderId, setOrderId] = useState(state.orders[0]?.id || '')
  const [templateKey, setTemplateKey] = useState('studio')
  const [current, setCurrent] = useState(state.contracts[0]?.id || '')
  const contract = state.contracts.find((item) => item.id === current) || state.contracts[0]
  const template = state.templates.find((item) => item.key === (contract?.templateKey || templateKey))
  const [draft, setDraft] = useState(template?.body || '')
  const address = `${state.settings.address} · WhatsApp ${state.settings.waDisplay}`
  return (
    <Shell>
      <div className="topbar">
        <div><h1>Generator kontrak</h1><p style={{ color: 'var(--muted)' }}>Tujuh templat resmi. Nomor berbentuk ANR/STD/001/XI/2026.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => contract && void downloadTextPdf({ filename: `${contract.number || 'kontrak'}.pdf`, kicker: 'ANARA', title: contract.title, number: contract.number, address, body: contract.body })}>Unduh PDF</button>
          <button className="btn btn-grad btn-sm" type="button" onClick={() => contract && void act({ type: 'set-contract-status', id: contract.id, status: 'terkirim' })}>Tandai terkirim</button>
        </div>
      </div>
      <div className="layout-2" style={{ padding: 0 }}>
        <div>
          <div className="card">
            <div className="form-row">
              <div>
                <label htmlFor="sumber">Order sumber</label>
                <select id="sumber" className="field" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
                  <option value="">Tanpa order (PKS atau pekerja)</option>
                  {state.orders.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="templat">Templat</label>
                <select id="templat" className="field" value={templateKey} onChange={(event) => { setTemplateKey(event.target.value); const found = state.templates.find((item) => item.key === event.target.value); setDraft(found?.body || '') }}>
                  {state.templates.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-grad" type="button" onClick={async () => {
              const result = await act({ type: 'generate-contract', orderId: orderId || null, templateKey })
              const id = result.info?.split('|')[0]
              if (id) setCurrent(id)
            }}>Terbitkan draf</button>
            <label htmlFor="pilih">Dokumen</label>
            <select id="pilih" className="field" value={contract?.id || ''} onChange={(event) => setCurrent(event.target.value)}>
              {state.contracts.map((item) => <option key={item.id} value={item.id}>{item.number || item.title} · {item.status}</option>)}
            </select>
          </div>
          {contract ? (
            <article className="contract-preview" style={{ marginTop: 16 }}>
              <div className="kop"><strong>ANARA</strong><div>{contract.number}</div></div>
              <div className="rule" />
              <div className="addr">{address}</div>
              <h2>{contract.title}</h2>
              <div className="sub">{contract.status}</div>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{contract.body}</pre>
            </article>
          ) : <p className="empty">Belum ada kontrak.</p>}
        </div>
        <aside>
          <div className="card">
            <h3>Status</h3>
            <p>{contract ? `${contract.status}${contract.signerName ? ` · ${contract.signerName}` : ''}` : '—'}</p>
            {contract?.otpHint && state.session?.role !== 'worker' ? <p><span className="demo-tag" /> Kode untuk diteruskan: {contract.otpHint}</p> : null}
            {contract?.signedAt ? <p>Waktu {tanggal(contract.signedAt)} · IP {contract.ip || 'tidak tersedia'}</p> : null}
            {contract?.orderId ? <p><Link to={`/setujui/${contract.id}`}>Tautan persetujuan klien</Link></p> : null}
          </div>
          {state.session?.role === 'owner' ? (
            <form className="card" style={{ marginTop: 12 }} onSubmit={(event) => { event.preventDefault(); void act({ type: 'update-template', key: templateKey, body: draft }) }}>
              <h3>Sunting templat</h3>
              <textarea className="field" value={draft} onChange={(event) => setDraft(event.target.value)} style={{ minHeight: 220 }} />
              <button className="btn btn-ghost" type="submit">Simpan templat</button>
            </form>
          ) : null}
        </aside>
      </div>
    </Shell>
  )
}

export function MonitorPage() {
  const { state, act } = useAnara()
  const alerts = buildAlerts(state)
  const orders = visibleOrders(state).filter((item) => !['selesai', 'batal'].includes(item.stage))
  const sla = slaByStage(state)
  const load = state.workers.map((worker) => ({
    worker,
    count: state.orders.filter((order) => order.assigneeId === worker.id && !['selesai', 'batal'].includes(order.stage)).length,
  }))
  const pendingPay = state.payments.filter((item) => item.status === 'menunggu')
  const revisions = state.orders.filter((item) => item.stage === 'revisi')
  const money = moneySnapshot(state)
  return (
    <Shell>
      <h1>Monitoring</h1>
      <p style={{ color: 'var(--muted)' }}>Status, tenggat, beban, SLA, pembayaran, dan kesehatan kas. Pada mode server, papan ikut berubah saat data diperbarui.</p>
      <div className="warn-list" style={{ margin: '16px 0' }}>
        {alerts.map((item) => <a key={item.title} className={`warn ${item.tone}`} href={item.href}><b>{item.title}</b><div>{item.detail}</div></a>)}
      </div>
      <div className="grid-dash">
        <div className="card table-wrap">
          <h3>Tenggat order berjalan</h3>
          <table className="data">
            <thead><tr><th>Order</th><th>Tahap</th><th>Tenggat</th><th>Pengerja</th></tr></thead>
            <tbody>
              {orders.map((item) => {
                const tone = dueTone(item.dueDate)
                return (
                  <tr key={item.id}>
                    <td><Link to={`/app/order/${item.id}`}>{item.code}</Link><br />{item.title}</td>
                    <td>{STAGE_LABEL[item.stage]}</td>
                    <td><span className={`badge ${tone === 'late' ? 'late' : tone === 'soon' ? 'soon' : 'okb'}`}>{tanggal(item.dueDate)}</span></td>
                    <td>{state.workers.find((worker) => worker.id === item.assigneeId)?.name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {orders.length === 0 ? <p className="empty">Tidak ada order berjalan.</p> : null}
        </div>
        <div className="card">
          <h3>Beban kerja</h3>
          {load.map((item) => (
            <div key={item.worker.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{item.worker.name}</span><b>{item.count}</b></div>
              <div className="bar"><span style={{ width: `${Math.min(100, item.count * 25)}%` }} /></div>
            </div>
          ))}
          <h3>Kas</h3>
          <p>Kas {rupiah(money.cash)}. Darurat {rupiah(money.locked)}. {money.toolsOpen ? 'Ambang tools terbuka.' : 'Ambang tools belum terbuka.'}</p>
        </div>
      </div>
      <div className="grid-dash">
        <div className="card">
          <h3>Rata-rata hari per tahap</h3>
          {sla.map((item) => <p key={item.stage}>{STAGE_LABEL[item.stage as Stage] || item.stage}: {item.n ? `${item.days} hari (${item.n} contoh)` : 'belum cukup data'}</p>)}
        </div>
        <div className="card">
          <h3>Pembayaran dan revisi</h3>
          <p>Bukti menunggu verifikasi: {pendingPay.length}</p>
          <p>Revisi berjalan: {revisions.length}</p>
          {revisions.map((item) => <p key={item.id}>{item.code} · {item.revisionCount}/{item.revisionLimit}</p>)}
          <h3>Aktivitas</h3>
          {state.events.slice(0, 6).map((item) => <p key={item.id} style={{ fontSize: 13 }}>{tanggal(item.at)} · {item.note}</p>)}
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => { const unread = state.notices.find((item) => !item.read); if (unread) void act({ type: 'read-notice', id: unread.id }) }}>Tandai satu pemberitahuan dibaca</button>
        </div>
      </div>
    </Shell>
  )
}

export function ReportPage() {
  const { state, act } = useAnara()
  const [filter, setFilter] = useState<ReportFilter>(defaultFilter())
  const report = useMemo(() => buildReport(state, filter), [state, filter])
  function setPreset(preset: 'hari' | 'minggu' | 'bulan' | 'tahun') {
    const today = todayISO()
    if (preset === 'hari') setFilter({ ...filter, from: today, to: today })
    if (preset === 'minggu') setFilter({ ...filter, from: todayISO(new Date(Date.now() - 6 * 86400000)), to: today })
    if (preset === 'bulan') setFilter({ ...filter, from: today.slice(0, 8) + '01', to: today })
    if (preset === 'tahun') setFilter({ ...filter, from: `${today.slice(0, 4)}-01-01`, to: today })
  }
  const headers = ['Kode', 'Layanan', 'Nilai', 'Tahap']
  const rows = report.orders.map((item) => [item.code, item.title, item.price, STAGE_LABEL[item.stage]])
  return (
    <Shell>
      <h1>Laporan</h1>
      <div className="tabs">
        <button className="tab" type="button" onClick={() => setPreset('hari')}>Harian</button>
        <button className="tab" type="button" onClick={() => setPreset('minggu')}>Mingguan</button>
        <button className="tab" type="button" onClick={() => setPreset('bulan')}>Bulanan</button>
        <button className="tab" type="button" onClick={() => setPreset('tahun')}>Tahunan</button>
      </div>
      <div className="card">
        <div className="form-row">
          <div><label htmlFor="dari">Dari</label><input className="field" id="dari" type="date" value={filter.from} onChange={(event) => setFilter({ ...filter, from: event.target.value })} /></div>
          <div><label htmlFor="sampai">Sampai</label><input className="field" id="sampai" type="date" value={filter.to} onChange={(event) => setFilter({ ...filter, to: event.target.value })} /></div>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="unit">Unit</label>
            <select id="unit" className="field" value={filter.brand} onChange={(event) => setFilter({ ...filter, brand: event.target.value as ReportFilter['brand'] })}>
              <option value="semua">Semua unit</option>
              <option value="studio">Studio</option>
              <option value="edukasi">Edukasi</option>
              <option value="tech">Tech</option>
            </select>
          </div>
          <div>
            <label htmlFor="layanan">Layanan</label>
            <select id="layanan" className="field" value={filter.packageId} onChange={(event) => setFilter({ ...filter, packageId: event.target.value })}>
              <option value="semua">Semua layanan</option>
              {state.packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="pekerja">Pekerja</label>
            <select id="pekerja" className="field" value={filter.workerId} onChange={(event) => setFilter({ ...filter, workerId: event.target.value })}>
              <option value="semua">Semua</option>
              {state.workers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="klien">Klien</label>
            <select id="klien" className="field" value={filter.clientId} onChange={(event) => setFilter({ ...filter, clientId: event.target.value })}>
              <option value="semua">Semua</option>
              {state.clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi v"><div className="l">Order pada rentang</div><div className="n">{report.count}</div></div>
        <div className="kpi e"><div className="l">Pendapatan lunas</div><div className="n">{rupiah(report.revenue)}</div></div>
        <div className="kpi t"><div className="l">Laba bersih</div><div className="n">{rupiah(report.profit)}</div><div className="s">Pemilik {rupiah(report.ownerProfit)} · mitra {rupiah(report.partnerProfit)}</div></div>
        <div className="kpi g"><div className="l">Piutang pada saringan</div><div className="n">{rupiah(report.receivables.reduce((sum, item) => sum + item.amount, 0))}</div></div>
      </div>
      <div className="card">
        <h3>Laba rugi dan arus kas</h3>
        <p>Pendapatan {rupiah(report.revenue)}. Referral {rupiah(report.referral)}. Jasa pengerja {rupiah(report.worker)}. Kas {rupiah(report.cash)}. Operasional {rupiah(report.ops)}. Pengeluaran {rupiah(report.expenseTotal)}.</p>
        <p>Arus masuk {rupiah(report.revenue)}. Arus keluar operasional {rupiah(report.expenseTotal)}. Bersih kas periode {rupiah(report.cash - report.expenseTotal)}.</p>
        {report.minMonth ? <p>Acuan target minimal bulan yang sama pada rencana 2027: {rupiah(report.minMonth.revenue)} ({report.minMonth.edu + report.minMonth.studio + report.minMonth.tech} order). Optimal {report.optMonth ? rupiah(report.optMonth.revenue) : '—'}.</p> : null}
        <p>Target tahun 2027 minimal {report.yearMinOrders} order / {rupiah(report.yearMinRevenue)}. Optimal {report.yearOptOrders} order / {rupiah(report.yearOptRevenue)}.</p>
        <div className="chart-row" aria-label="Pendapatan per unit">
          {report.byBrand.map((item) => (
            <div className="c" key={item.name}><i style={{ height: `${Math.max(12, item.revenue / Math.max(report.revenue, 1) * 120)}px` }} /><b>{item.name}</b></div>
          ))}
        </div>
      </div>
      <div className="grid-dash">
        <Group title="Per layanan" rows={report.byPackage} />
        <Group title="Per pekerja" rows={report.byWorker} />
        <Group title="Per klien" rows={report.byClient} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
        <button className="btn btn-grad btn-sm" type="button" onClick={() => downloadCsv(`laporan-anara-${filter.from}.csv`, headers, rows)}>Unduh CSV</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => void downloadTablePdf({ filename: `laporan-anara-${filter.from}.pdf`, title: 'Laporan ANARA', subtitle: `${filter.from} s.d. ${filter.to}`, headers, rows: rows.map((row) => row.map(String)) })}>Unduh PDF</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'build-settlement', period: filter.from.slice(0, 7) })}>Susun settlement bulan ini</button>
      </div>
      <div className="card" id="cetak-settlement">
        <h3>Settlement tanggal 5</h3>
        {state.settlements.length === 0 ? <p className="empty">Belum ada settlement.</p> : null}
        {state.settlements.map((item) => (
          <article key={item.id} style={{ marginBottom: 12 }}>
            <b>{item.period}</b> · {item.status} {item.note ? `· ${item.note}` : ''}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {state.session?.role === 'owner' && item.status !== 'disetujui' && item.status !== 'dibayar' ? <button className="btn btn-grad btn-sm" type="button" onClick={() => void act({ type: 'approve-settlement', id: item.id })}>Setujui</button> : null}
              {item.status === 'disetujui' ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'pay-settlement', id: item.id })}>Tandai dibayar</button> : null}
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => window.print()}>Cetak</button>
            </div>
          </article>
        ))}
        <p>Honor peran {rupiah(state.settings.honor[state.settings.phase])} dan laba dibayar setelah pemilik menyetujui laporan.</p>
      </div>
    </Shell>
  )
}

function Group({ title, rows }: { title: string; rows: { name: string; count: number; revenue: number }[] }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {rows.length === 0 ? <p className="empty">Tidak ada data pada saringan.</p> : null}
      {rows.map((item) => <p key={item.name}>{item.name}: {item.count} order · {rupiah(item.revenue)}</p>)}
    </div>
  )
}

export function AutomationPage() {
  const { state, act } = useAnara()
  return (
    <Shell>
      <h1>Automasi</h1>
      <div className="layout-2" style={{ padding: 0 }}>
        <div className="card">
          {state.rules.map((rule) => (
            <div className="switch" key={rule.key}>
              <div>
                <div className="t">{rule.title}</div>
                <p>{rule.detail}</p>
              </div>
              <button className={rule.enabled ? 'toggle on' : 'toggle'} type="button" aria-pressed={rule.enabled} aria-label={rule.title} onClick={() => void act({ type: 'toggle-rule', key: rule.key })} disabled={state.session?.role !== 'owner'}><i /></button>
            </div>
          ))}
        </div>
        <aside>
          <div className="card">
            <h3>Antrean WhatsApp</h3>
            <p>Tautan wa.me terisi dari templat. Gateway Fonnte dipakai lewat edge function bila token diisi di Supabase, bukan di repositori.</p>
            {state.outbox.length === 0 ? <p className="empty">Antrean kosong.</p> : null}
            {state.outbox.slice(0, 8).map((item) => (
              <p key={item.id}>
                {item.status} · {item.to}<br />
                <a href={item.href} target="_blank" rel="noreferrer">Buka WhatsApp</a>
                {item.status === 'siap' ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => void act({ type: 'mark-outbox', id: item.id })}>Tandai terkirim</button> : null}
              </p>
            ))}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Pemberitahuan dalam aplikasi</h3>
            {state.notices.slice(0, 6).map((item) => <p key={item.id}>{item.read ? 'dibaca' : 'baru'} · {item.title}</p>)}
          </div>
        </aside>
      </div>
    </Shell>
  )
}

export function PortfolioAdminPage() {
  const { state, act } = useAnara()
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [brand, setBrand] = useState<'studio' | 'edukasi' | 'tech'>('studio')
  return (
    <Shell>
      <h1>Portofolio</h1>
      <p>Naskah Edukasi tidak boleh tayang. Testimoni hanya dari izin klien.</p>
      <div className="pkg-grid">
        {state.portfolio.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.caption}</p>
            <p>{item.published ? 'Tayang' : 'Disembunyikan'} {item.sample ? <span className="demo-tag" /> : null}</p>
          </article>
        ))}
      </div>
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => { event.preventDefault(); void act({ type: 'save-portfolio', title, caption, brand, published: brand !== 'edukasi' }) }}>
        <h3>Tambah karya</h3>
        <label htmlFor="judul">Judul</label>
        <input className="field" id="judul" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <label htmlFor="caption">Keterangan</label>
        <input className="field" id="caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
        <label htmlFor="unit-karya">Unit</label>
        <select id="unit-karya" className="field" value={brand} onChange={(event) => setBrand(event.target.value as 'studio' | 'edukasi' | 'tech')}>
          <option value="studio">Studio</option>
          <option value="tech">Tech</option>
          <option value="edukasi">Edukasi (tidak ditayangkan)</option>
        </select>
        <button className="btn btn-grad" type="submit">Simpan</button>
      </form>
    </Shell>
  )
}

export function SettingsPage() {
  const { state, act, mode } = useAnara()
  const money = moneySnapshot(state)
  const settings = state.settings
  const owner = state.session?.role === 'owner'
  return (
    <Shell>
      <h1>Pengaturan</h1>
      <div className="card">
        <p>Rekrutmen {money.recruitOpen ? 'terbuka' : 'terkunci'}. Syarat omzet {rupiah(settings.recruitRevenue)} selama {settings.recruitMonths} bulan dan kas {rupiah(settings.recruitCash)}.</p>
        <p>Omzet tiga bulan terakhir: {money.monthRevenue.map((item) => rupiah(item)).join(' · ')}. Kas {rupiah(money.cash)}.</p>
        {!owner ? <p>Perubahan skema, harga resmi, dan rekening hanya dapat disimpan pemilik.</p> : null}
      </div>
      <form className="card" style={{ marginTop: 16 }} onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        void act({
          type: 'update-settings',
          patch: {
            phase: Number(form.get('fase')) as 1 | 2 | 3,
            phaseAuto: form.get('otomatis') === 'on',
            bankName: String(form.get('bank') || ''),
            bankNumber: String(form.get('rekening') || ''),
            bankHolder: String(form.get('atas') || ''),
          },
        })
      }}>
        <h3>Fase dan rekening</h3>
        <label htmlFor="fase">Fase berjalan</label>
        <select id="fase" name="fase" className="field" defaultValue={settings.phase} disabled={!owner}>
          <option value={1}>Fase 1 · Jan–Apr · 40/30/15/15</option>
          <option value={2}>Fase 2 · Mei–Sep · 45/15/15/25</option>
          <option value={3}>Fase 3 · Okt–Des · 50/10/15/25</option>
        </select>
        <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" name="otomatis" defaultChecked={settings.phaseAuto} disabled={!owner} /> Ikuti bulan kalender</label>
        <label htmlFor="bank">Bank</label>
        <input className="field" id="bank" name="bank" defaultValue={settings.bankName} disabled={!owner} placeholder="Kosong sampai rekening usaha terbuka" />
        <label htmlFor="rekening">Nomor rekening</label>
        <input className="field" id="rekening" name="rekening" defaultValue={settings.bankNumber} disabled={!owner} />
        <label htmlFor="atas">Atas nama</label>
        <input className="field" id="atas" name="atas" defaultValue={settings.bankHolder} disabled={!owner} />
        <button className="btn btn-grad" type="submit" disabled={!owner}>Simpan</button>
      </form>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Harga resmi</h3>
        {state.packages.map((item) => (
          <form key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr .8fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }} onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            void act({ type: 'update-package', id: item.id, patch: { priceMin: Number(form.get('min')), priceMax: Number(form.get('max')), active: form.get('aktif') === 'on' } })
          }}>
            <span>{item.name}</span>
            <input className="field" name="min" type="number" defaultValue={item.priceMin} aria-label={`Harga minimum ${item.name}`} disabled={!owner} style={{ margin: 0 }} />
            <input className="field" name="max" type="number" defaultValue={item.priceMax} aria-label={`Harga maksimum ${item.name}`} disabled={!owner} style={{ margin: 0 }} />
            <button className="btn btn-ghost btn-sm" type="submit" disabled={!owner}>Simpan</button>
          </form>
        ))}
      </div>
      {mode === 'demo' ? <button className="btn btn-ghost" type="button" style={{ marginTop: 16 }} onClick={() => void act({ type: 'reset-demo' })}>Kembalikan data contoh</button> : null}
    </Shell>
  )
}

export function AuditPage() {
  const { state } = useAnara()
  return (
    <Shell>
      <h1>Jejak audit</h1>
      <p>Perubahan status, pembayaran, kontrak, dan pengaturan. Jejak tidak dihapus dari dasbor.</p>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th><th>Detail</th></tr></thead>
          <tbody>
            {state.audit.map((item) => (
              <tr key={item.id}><td>{tanggal(item.at)}</td><td>{item.actor}</td><td>{item.action}</td><td>{item.detail}</td></tr>
            ))}
          </tbody>
        </table>
        {state.audit.length === 0 ? <p className="empty">Belum ada jejak.</p> : null}
      </div>
    </Shell>
  )
}
