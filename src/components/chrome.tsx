import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
  { to: '/app/order', label: 'Papan order', icon: '☰', roles: ['owner', 'finance', 'worker'] },
  { to: '/app/klien', label: 'Klien', icon: '☺', roles: ['owner', 'finance'] },
  { to: '/app/layanan', label: 'Layanan', icon: '◎', roles: ['owner', 'finance'] },
  { to: '/app/pekerja', label: 'Pekerja', icon: '✎', roles: ['owner', 'finance'] },
  { to: '/app/pembayaran', label: 'Pembayaran', icon: 'Rp', roles: ['owner', 'finance'] },
  { to: '/app/keuangan', label: 'Keuangan', icon: '◈', roles: ['owner', 'finance'] },
  { to: '/app/kontrak', label: 'Kontrak', icon: '⌘', roles: ['owner', 'finance'] },
  { to: '/app/monitoring', label: 'Monitoring', icon: '◉', roles: ['owner', 'finance', 'worker'] },
  { to: '/app/laporan', label: 'Laporan', icon: '▤', roles: ['owner', 'finance'] },
  { to: '/app/automasi', label: 'Automasi', icon: '⚡', roles: ['owner', 'finance'] },
  { to: '/app/portofolio', label: 'Portofolio', icon: '▣', roles: ['owner', 'social'] },
  { to: '/app/pengaturan', label: 'Pengaturan', icon: '⚙', roles: ['owner', 'finance'] },
  { to: '/app/audit', label: 'Jejak audit', icon: '≡', roles: ['owner', 'finance'] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { state, loadError, act, prefetch } = useAnara()
  const navigate = useNavigate()
  const role = state.session?.role
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
  return (
    <div className="app">
      <a className="skip" href="#isi">Loncat ke isi</a>
      <Aurora />
      <div className="app-shell">
        <aside className="side">
          <NavLink to="/app"><img className="wm" src={wordmark} alt="anara" /></NavLink>
          <nav aria-label="Dasbor">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/app'} className={({ isActive }) => (isActive ? 'on' : undefined)} onMouseEnter={prefetch} onFocus={prefetch}>
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/">Lihat katalog</NavLink>
          </nav>
          <div className="install-slot">
            <InstallButton className="btn btn-grad btn-sm" placement="below" />
          </div>
          <div className="role">
            <b>{state.session.name}</b>
            {role === 'owner' ? 'Pemilik' : role === 'finance' ? 'Keuangan dan Admin WA' : role === 'worker' ? 'Pekerja' : 'Admin media sosial'}
          </div>
        </aside>
        <div className="main" id="isi">
          {loadError ? <div className="banner" role="alert" style={{ width: 'auto', margin: '0 0 14px' }}>{loadError}</div> : null}
          <div className="topbar">
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>ANARA, Beyond Value</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
        <NavLink to="/app" end><span>✦</span>Ringkasan</NavLink>
        <NavLink to="/app/order"><span>☰</span>Order</NavLink>
        <NavLink to="/app/monitoring"><span>◉</span>Pantau</NavLink>
        <NavLink to="/app/laporan"><span>▤</span>Laporan</NavLink>
      </nav>
      <a className="wa-float" href={WA} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp">💬 <span>WhatsApp</span></a>
      <Flash />
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
