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
  const { loadError } = useAnara()
  const [open, setOpen] = useState(false)
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
          </nav>
          <div className="nav-cta">
            <NavLink className="btn btn-ghost btn-sm" to="/masuk">Masuk tim</NavLink>
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
      </nav>
      <Flash />
    </>
  )
}

const LINKS: { to: string; label: string; icon: string; roles: Role[] }[] = [
  { to: '/app', label: 'Ringkasan', icon: '✦', roles: ['owner', 'finance', 'worker', 'social'] },
  { to: '/app/order', label: 'Order', icon: '☰', roles: ['owner', 'finance', 'worker'] },
  { to: '/app/klien', label: 'Klien', icon: '☺', roles: ['owner', 'finance'] },
  { to: '/app/layanan', label: 'Layanan', icon: '◎', roles: ['owner', 'finance'] },
  { to: '/app/tagihan', label: 'Tagihan', icon: 'Rp', roles: ['owner', 'finance'] },
  { to: '/app/kontrak', label: 'Kontrak', icon: '⌘', roles: ['owner', 'finance'] },
  { to: '/app/slip', label: 'Slip gaji', icon: '✎', roles: ['owner', 'finance'] },
  { to: '/app/pembayaran', label: 'Kas masuk', icon: '↓', roles: ['owner', 'finance'] },
  { to: '/app/keuangan', label: 'Keuangan', icon: '◈', roles: ['owner', 'finance'] },
  { to: '/app/bayar', label: 'QRIS & gateway', icon: '▣', roles: ['owner', 'finance'] },
  { to: '/app/whatsapp', label: 'WhatsApp', icon: '💬', roles: ['owner', 'finance'] },
  { to: '/app/pekerja', label: 'Pekerja', icon: '☺', roles: ['owner', 'finance'] },
  { to: '/app/monitoring', label: 'Monitoring', icon: '◉', roles: ['owner', 'finance', 'worker'] },
  { to: '/app/laporan', label: 'Laporan', icon: '▤', roles: ['owner', 'finance'] },
  { to: '/app/automasi', label: 'Automasi', icon: '⚡', roles: ['owner', 'finance'] },
  { to: '/app/portofolio', label: 'Portofolio', icon: '▣', roles: ['owner', 'social'] },
  { to: '/app/pengaturan', label: 'Pengaturan', icon: '⚙', roles: ['owner', 'finance'] },
  { to: '/app/audit', label: 'Jejak audit', icon: '≡', roles: ['owner', 'finance'] },
]

const CRUMB: Record<string, string> = Object.fromEntries(LINKS.map((item) => [item.to, item.label]))

export function AppShell({ children }: { children: ReactNode }) {
  const { state, loadError, act, prefetch } = useAnara()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('anara-side') === '1')
  const [menu, setMenu] = useState(false)
  const [palette, setPalette] = useState(false)
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
  const links = LINKS.filter((item) => role && item.roles.includes(role))
  const unread = state.notices.filter((item) => !item.read && (item.forRole === 'semua' || item.forRole === role)).length
  const crumb = CRUMB[location.pathname] || 'Dasbor'
  return (
    <div className={`app ${menu ? 'menu-open' : ''} ${collapsed ? 'side-collapsed' : ''}`}>
      <a className="skip" href="#isi">Loncat ke isi</a>
      <Aurora />
      <div className="app-shell">
        <aside className="side">
          <div className="side-top">
            <NavLink to="/app" onClick={() => setMenu(false)}><img className="wm" src={wordmark} alt="anara" /></NavLink>
            <button className="btn btn-ghost btn-sm side-fold" type="button" aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'} onClick={() => { const next = !collapsed; setCollapsed(next); localStorage.setItem('anara-side', next ? '1' : '0') }}>{collapsed ? '›' : '‹'}</button>
          </div>
          <nav aria-label="Dasbor">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/app'} title={item.label} className={({ isActive }) => (isActive ? 'on' : undefined)} onMouseEnter={prefetch} onFocus={prefetch} onClick={() => setMenu(false)}>
                <span aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
            <NavLink to="/" onClick={() => setMenu(false)}><span aria-hidden="true">↗</span><span className="nav-label">Lihat katalog</span></NavLink>
          </nav>
          <div className="role">
            <b>{state.session.name}</b>
            <span className="nav-label">{role === 'owner' ? 'Pemilik' : role === 'finance' ? 'Keuangan dan Admin WA' : role === 'worker' ? 'Pekerja' : 'Admin media sosial'}</span>
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
        <NavLink to="/app" end><span>✦</span>Ringkas</NavLink>
        <NavLink to="/app/order"><span>☰</span>Order</NavLink>
        <NavLink to="/app/tagihan"><span>Rp</span>Tagihan</NavLink>
        <button type="button" onClick={() => setMenu((value) => !value)}><span>☰</span>Menu</button>
      </nav>
      {palette ? <CommandPalette links={links} onClose={() => setPalette(false)} /> : null}
      <a className="wa-float" href={WA} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp">💬 <span>WhatsApp</span></a>
      <Flash />
    </div>
  )
}

function CommandPalette({ links, onClose }: { links: typeof LINKS; onClose: () => void }) {
  const { state } = useAnara()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const items = useMemo(() => {
    const pages = links.map((item) => ({ label: item.label, hint: 'Halaman', to: item.to }))
    const orders = state.orders.slice(0, 40).map((item) => ({ label: `${item.code} · ${item.title}`, hint: 'Order', to: `/app/order/${item.id}` }))
    const clients = state.clients.slice(0, 40).map((item) => ({ label: item.name, hint: 'Klien', to: `/app/klien/${item.id}` }))
    const needle = query.trim().toLowerCase()
    return [...pages, ...orders, ...clients].filter((item) => !needle || item.label.toLowerCase().includes(needle)).slice(0, 12)
  }, [links, query, state.orders, state.clients])
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
