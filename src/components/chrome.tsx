import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import icon from '../assets/brand/ikon-a-gradien.svg'
import wordmark from '../assets/brand/wordmark-hitam.svg'
import { InstallBanner, InstallButton } from './install'
import { useAnara } from '../data/store'
import type { Role } from '../types'

const WA = 'https://wa.me/6285811699699'

export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="b1" />
      <span className="b2" />
      <span className="b3" />
      <span className="b4" />
    </div>
  )
}

export function Flash() {
  const { flash, clearFlash } = useAnara()
  if (!flash) return null
  return (
    <button className={flash.ok ? 'toast ok' : 'toast bad'} type="button" onClick={clearFlash}>
      {flash.text}
    </button>
  )
}

export function PublicShell({ children }: { children: ReactNode }) {
  const { loadError, state } = useAnara()
  const [open, setOpen] = useState(false)
  const tim = Boolean(state.session && state.session.role !== 'client')
  const akunTo = tim ? '/app' : '/masuk'
  const akunLabel = tim ? 'Dasbor' : 'Masuk tim'
  return (
    <>
      <a className="skip" href="#isi">Loncat ke isi</a>
      <Aurora />
      <header className={open ? 'nav open' : 'nav'}>
        <div className="nav-in">
          <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
            <img className="ic" src={icon} alt="" />
            <img className="wm" src={wordmark} alt="anara" />
          </NavLink>
          <nav className="nav-links" aria-label="Utama">
            <a href="#layanan">Layanan</a>
            <a href="#harga">Harga</a>
            <a href="#karya">Karya</a>
            <NavLink to="/lacak">Lacak pesanan</NavLink>
            <NavLink to={akunTo} onClick={() => setOpen(false)}>{akunLabel}</NavLink>
          </nav>
          <div className="nav-cta">
            <NavLink className="btn btn-grad btn-sm btn-masuk" to={akunTo}>{tim ? 'Dasbor' : 'Masuk'}</NavLink>
            <InstallButton />
            <a className="btn btn-grad btn-sm" href={WA} target="_blank" rel="noreferrer">WhatsApp</a>
            <button className="hamburger" type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      <InstallBanner />
      {loadError ? <div className="banner" role="alert">{loadError}</div> : null}
      <main id="isi">{children}</main>
      <footer className="foot">
        <div className="foot-in">
          <div>
            <img src={wordmark} alt="anara" style={{ height: 26, width: 'auto' }} />
            <div className="gold" style={{ marginTop: 12 }}>ANARA, Beyond Value</div>
            <p style={{ marginTop: 12 }}>Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat</p>
            <p>WhatsApp 0858-1169-9699</p>
          </div>
          <div>
            <h4>Unit</h4>
            <a href="#layanan">ANARA Studio</a>
            <a href="#layanan">ANARA Edukasi</a>
            <a href="#layanan">ANARA Tech</a>
          </div>
          <div>
            <h4>Pesan</h4>
            <NavLink to="/pesan">Formulir pesanan</NavLink>
            <NavLink to="/lacak">Lacak pesanan</NavLink>
            <NavLink to={akunTo}>{akunLabel}</NavLink>
            <a href={WA}>Chat WhatsApp</a>
          </div>
        </div>
        <div className="copy"><span>© ANARA. Studio, Edukasi, dan Tech.</span><span>ANARA, Beyond Value</span></div>
      </footer>
      <a className="wa-float" href={WA} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp">💬 <span>WhatsApp</span></a>
      <nav className="pub-nav" aria-label="Navigasi ponsel">
        <NavLink to="/" end><span>✦</span>Beranda</NavLink>
        <a href="#harga"><span>◎</span>Layanan</a>
        <NavLink to="/pesan"><span>＋</span>Pesan</NavLink>
        <NavLink to="/lacak"><span>◷</span>Lacak</NavLink>
        <NavLink to={akunTo}><span>{tim ? '▣' : '☺'}</span>{tim ? 'Dasbor' : 'Masuk'}</NavLink>
      </nav>
      <Flash />
    </>
  )
}

interface NavItem {
  to: string
  label: string
  icon: string
  roles: Role[]
  badge?: 'order' | 'jatuh' | 'bukti'
  end?: boolean
}

interface NavGroup {
  id: string
  title: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    id: 'ringkasan',
    title: 'Ringkasan',
    items: [
      { to: '/app', label: 'Dasbor', icon: '✦', roles: ['owner', 'finance', 'worker', 'social'], end: true },
      { to: '/app/monitoring', label: 'Monitoring', icon: '◉', roles: ['owner', 'finance', 'worker'] },
    ],
  },
  {
    id: 'penjualan',
    title: 'Penjualan',
    items: [
      { to: '/app/order', label: 'Order', icon: '☰', roles: ['owner', 'finance', 'worker'], badge: 'order' },
      { to: '/app/klien', label: 'Klien', icon: '☺', roles: ['owner', 'finance'] },
      { to: '/app/layanan', label: 'Layanan & paket', icon: '◎', roles: ['owner', 'finance'] },
      { to: '/app/portofolio', label: 'Portofolio', icon: '▣', roles: ['owner', 'social'] },
    ],
  },
  {
    id: 'dokumen',
    title: 'Dokumen',
    items: [
      { to: '/app/kontrak', label: 'Kontrak', icon: '⌘', roles: ['owner', 'finance'] },
      { to: '/app/tagihan', label: 'Invoice', icon: 'Rp', roles: ['owner', 'finance'], badge: 'jatuh' },
      { to: '/app/pembayaran', label: 'Kuitansi & pembayaran', icon: '↓', roles: ['owner', 'finance'], badge: 'bukti' },
    ],
  },
  {
    id: 'keuangan',
    title: 'Keuangan',
    items: [
      { to: '/app/keuangan', label: 'Kas & dana darurat', icon: '◈', roles: ['owner', 'finance'] },
      { to: '/app/keuangan#bagi', label: 'Bagi hasil', icon: '%', roles: ['owner', 'finance'] },
      { to: '/app/slip', label: 'Slip gaji', icon: '✎', roles: ['owner', 'finance'] },
      { to: '/app/laporan', label: 'Laporan', icon: '▤', roles: ['owner', 'finance'] },
    ],
  },
  {
    id: 'tim',
    title: 'Tim',
    items: [
      { to: '/app/pekerja', label: 'Anggota & peran', icon: '☺', roles: ['owner', 'finance'] },
      { to: '/app/monitoring#beban', label: 'Beban kerja', icon: '▦', roles: ['owner', 'finance', 'worker'] },
    ],
  },
  {
    id: 'otomasi',
    title: 'Otomasi',
    items: [
      { to: '/app/automasi', label: 'Automasi', icon: '⚡', roles: ['owner', 'finance'] },
      { to: '/app/whatsapp#log', label: 'Log pesan WhatsApp', icon: '☰', roles: ['owner', 'finance'] },
    ],
  },
  {
    id: 'pengaturan',
    title: 'Pengaturan',
    items: [
      { to: '/app/pengaturan', label: 'Profil usaha', icon: '⚙', roles: ['owner', 'finance'] },
      { to: '/app/bayar', label: 'Pembayaran', icon: '▣', roles: ['owner', 'finance'] },
      { to: '/app/whatsapp', label: 'WhatsApp', icon: '💬', roles: ['owner', 'finance'] },
      { to: '/app/opsi', label: 'Opsi dropdown', icon: '▾', roles: ['owner', 'finance'] },
      { to: '/app/pengaturan#akun', label: 'Akun', icon: '☺', roles: ['owner', 'finance', 'worker', 'social'] },
      { to: '/app/audit', label: 'Jejak audit', icon: '≡', roles: ['owner'] },
    ],
  },
]

function terlihat(item: NavItem, role: Role) {
  return item.roles.includes(role)
}

function itemAktif(item: NavItem, pathname: string, hash: string) {
  const [path, frag] = item.to.split('#')
  if (item.end) return pathname === path
  const sama = pathname === path || pathname.startsWith(`${path}/`)
  if (!sama) return false
  return frag ? hash === `#${frag}` : hash === ''
}

const CRUMB: Record<string, string> = {
  '/app': 'Dasbor',
  '/app/monitoring': 'Monitoring',
  '/app/order': 'Order',
  '/app/klien': 'Klien',
  '/app/layanan': 'Layanan & paket',
  '/app/portofolio': 'Portofolio',
  '/app/kontrak': 'Kontrak',
  '/app/tagihan': 'Invoice',
  '/app/pembayaran': 'Kuitansi & pembayaran',
  '/app/keuangan': 'Keuangan',
  '/app/slip': 'Slip gaji',
  '/app/laporan': 'Laporan',
  '/app/pekerja': 'Anggota & peran',
  '/app/automasi': 'Automasi',
  '/app/whatsapp': 'WhatsApp',
  '/app/pengaturan': 'Profil usaha',
  '/app/bayar': 'Pembayaran',
  '/app/opsi': 'Opsi dropdown',
  '/app/audit': 'Jejak audit',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, loadError, act, prefetch } = useAnara()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('anara-side') === '1')
  const [sheet, setSheet] = useState(false)
  const [palette, setPalette] = useState(false)
  const [closed, setClosed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('anara-nav-groups') || '[]') as string[] } catch { return [] }
  })
  const role = state.session?.role
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!state.session || role === 'client') {
    return (
      <PublicShell>
        <div className="wrap page-head">
          <h1>Masuk tim diperlukan</h1>
          <p>Halaman ini untuk pemilik, keuangan, pekerja, atau admin media sosial.</p>
          <NavLink className="btn btn-grad" to="/masuk">Masuk</NavLink>
        </div>
      </PublicShell>
    )
  }
  const peran = state.session.role
  const hari = new Date().toISOString().slice(0, 10)
  const badges = {
    order: state.orders.filter((item) => item.stage === 'masuk_brief').length,
    jatuh: state.invoices.filter((item) => item.status !== 'lunas' && item.status !== 'batal' && Boolean(item.dueDate) && item.dueDate < hari).length,
    bukti: state.payments.filter((item) => item.status === 'menunggu').length,
  }
  const groups = GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => terlihat(item, peran)) })).filter((group) => group.items.length > 0)
  const unread = state.notices.filter((item) => !item.read && (item.forRole === 'semua' || item.forRole === role)).length
  const crumb = CRUMB[location.pathname] || (location.pathname.startsWith('/app/order/') ? 'Order' : location.pathname.startsWith('/app/klien/') ? 'Klien' : 'Dasbor')
  return (
    <div className={`app ${sheet ? 'menu-open' : ''} ${collapsed ? 'side-collapsed' : ''}`}>
      <a className="skip" href="#isi">Loncat ke isi</a>
      <Aurora />
      <div className="app-shell">
        <aside className="side">
          <div className="side-top">
            <NavLink to="/app" onClick={() => setSheet(false)}><img className="wm" src={wordmark} alt="anara" /></NavLink>
            <button className="btn btn-ghost btn-sm side-fold" type="button" aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'} onClick={() => { const next = !collapsed; setCollapsed(next); localStorage.setItem('anara-side', next ? '1' : '0') }}>{collapsed ? '›' : '‹'}</button>
          </div>
          <nav aria-label="Dasbor">
            {groups.map((group) => {
              const shut = !collapsed && closed.includes(group.id) && !group.items.some((item) => location.pathname === item.to.split('#')[0])
              return (
                <div key={group.id} className="nav-block">
                  <button
                    className="nav-group"
                    type="button"
                    aria-expanded={!shut}
                    onClick={() => {
                      const next = closed.includes(group.id) ? closed.filter((id) => id !== group.id) : [...closed, group.id]
                      setClosed(next)
                      localStorage.setItem('anara-nav-groups', JSON.stringify(next))
                    }}
                  >
                    <span>{group.title}</span>
                    <span aria-hidden="true">{shut ? '+' : '–'}</span>
                  </button>
                  {shut ? null : group.items.map((item) => {
                    const count = item.badge ? badges[item.badge] : 0
                    return (
                      <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className={itemAktif(item, location.pathname, location.hash) ? 'on' : undefined} onMouseEnter={prefetch} onFocus={prefetch} onClick={() => setSheet(false)}>
                        <span className="nav-ico" aria-hidden="true">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {count > 0 ? <em className="nav-badge">{count}</em> : null}
                      </NavLink>
                    )
                  })}
                </div>
              )
            })}
            <NavLink to="/" onClick={() => setSheet(false)} title="Lihat katalog"><span className="nav-ico" aria-hidden="true">↗</span><span className="nav-label">Lihat katalog</span></NavLink>
          </nav>
          <div className="role">
            <b>{state.session.name}</b>
            <span className="nav-label">{role === 'owner' ? 'Pemilik' : role === 'finance' ? 'Keuangan dan Admin WA' : role === 'worker' ? 'Pekerja' : 'Admin media sosial'}</span>
            <small className="build-tag" title={__ANARA_BUILD__}>Versi {__ANARA_BUILD__}</small>
          </div>
        </aside>
        <div className="main" id="isi">
          {loadError ? <div className="banner" role="alert" style={{ width: 'auto', margin: '0 0 14px' }}>{loadError}</div> : null}
          <div className="topbar">
            <div>
              <p className="crumb">Dasbor / {crumb}</p>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>ANARA, Beyond Value</p>
            </div>
            <div className="top-actions">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPalette(true)}>Cari <kbd>Ctrl</kbd><kbd>K</kbd></button>
              <InstallButton />
              <ThemeButton />
              <NavLink className="btn btn-ghost btn-sm" to="/app/monitoring">Pemberitahuan{unread ? ` (${unread})` : ''}</NavLink>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { void act({ type: 'logout' }); navigate('/masuk') }}>Keluar</button>
            </div>
          </div>
          {children}
        </div>
      </div>
      <nav className="mob-nav" aria-label="Navigasi dasbor">
        <NavLink to="/app" end><span>✦</span>Dasbor</NavLink>
        {role !== 'social' ? <NavLink to="/app/order"><span>☰</span>Order{badges.order ? <i>{badges.order}</i> : null}</NavLink> : null}
        {role === 'owner' || role === 'finance' ? <NavLink to="/app/tagihan"><span>⌘</span>Dokumen{badges.jatuh + badges.bukti ? <i>{badges.jatuh + badges.bukti}</i> : null}</NavLink> : null}
        {role === 'owner' || role === 'finance' ? <NavLink to="/app/keuangan"><span>◈</span>Keuangan</NavLink> : null}
        <button type="button" onClick={() => setSheet(true)}><span>☰</span>Lainnya</button>
      </nav>
      {sheet ? (
        <div className="nav-sheet">
          <button className="palette-bg" type="button" aria-label="Tutup menu" onClick={() => setSheet(false)} />
          <div className="nav-sheet-card">
            <div className="side-top"><b>Menu</b><button className="btn btn-ghost btn-sm" type="button" onClick={() => setSheet(false)}>Tutup</button></div>
            {groups.map((group) => (
              <div key={group.id} className="nav-block">
                <p className="nav-group">{group.title}</p>
                {group.items.map((item) => {
                  const count = item.badge ? badges[item.badge] : 0
                  return (
                    <NavLink key={item.to} to={item.to} end={item.end} className={itemAktif(item, location.pathname, location.hash) ? 'on' : undefined} onClick={() => setSheet(false)}>
                      <span className="nav-ico" aria-hidden="true">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      {count > 0 ? <em className="nav-badge">{count}</em> : null}
                    </NavLink>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {palette ? <CommandPalette groups={groups} onClose={() => setPalette(false)} /> : null}
      <a className="wa-float" href={WA} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp">💬 <span>WhatsApp</span></a>
      <Flash />
    </div>
  )
}

function CommandPalette({ groups, onClose }: { groups: NavGroup[]; onClose: () => void }) {
  const { state } = useAnara()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const items = useMemo(() => {
    const pages = groups.flatMap((group) => group.items.map((item) => ({ label: item.label, hint: group.title, to: item.to })))
    const orders = state.orders.slice(0, 40).map((item) => ({ label: `${item.code} · ${item.title}`, hint: 'Penjualan', to: `/app/order/${item.id}` }))
    const clients = state.clients.slice(0, 40).map((item) => ({ label: item.name, hint: 'Penjualan', to: `/app/klien/${item.id}` }))
    const needle = query.trim().toLowerCase()
    return [...pages, ...orders, ...clients].filter((item) => !needle || `${item.hint} ${item.label}`.toLowerCase().includes(needle)).slice(0, 12)
  }, [groups, query, state.orders, state.clients])
  return (
    <div className="palette" role="dialog" aria-label="Pencarian">
      <button className="palette-bg" type="button" aria-label="Tutup pencarian" onClick={onClose} />
      <div className="palette-card">
        <input className="field" autoFocus placeholder="Cari halaman, order, atau klien" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose() }} />
        <ul>
          {items.map((item) => (
            <li key={item.to + item.label}>
              <button type="button" onClick={() => { navigate(item.to); onClose() }}><small>{item.hint}</small>{item.label}</button>
            </li>
          ))}
          {items.length === 0 ? <li className="muted">Tidak ada hasil.</li> : null}
        </ul>
      </div>
    </div>
  )
}

export function ThemeButton() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  return (
    <button
      className="theme-btn"
      type="button"
      onClick={() => {
        const next = !dark
        setDark(next)
        if (next) document.documentElement.dataset.theme = 'dark'
        else delete document.documentElement.dataset.theme
        localStorage.setItem('anara-theme', next ? 'dark' : '')
      }}
    >
      {dark ? 'Mode terang' : 'Mode gelap'}
    </button>
  )
}

export function Loading() {
  return (
    <div className="wrap page-head" aria-busy="true">
      <div className="skeleton" />
      <div className="skeleton" style={{ width: '70%', marginTop: 12 }} />
      <div className="skeleton" style={{ width: '40%', marginTop: 12 }} />
    </div>
  )
}
