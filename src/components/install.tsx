import { useState, useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const BANNER_KEY = 'anara-pwa-banner-off'

function installedNow(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

function iosNow(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/i.test(ua) || iPadOs
}

function androidNow(): boolean {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

type Snap = {
  installed: boolean
  ios: boolean
  android: boolean
  prompt: BeforeInstallPromptEvent | null
}

let snap: Snap = {
  installed: installedNow(),
  ios: iosNow(),
  android: androidNow(),
  prompt: null,
}
const listeners = new Set<() => void>()

function publish(next: Partial<Snap>) {
  snap = { ...snap, ...next }
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    publish({ prompt: event as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => {
    publish({ installed: true, prompt: null })
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstall(): Snap {
  return useSyncExternalStore(subscribe, () => snap, () => snap)
}

export function InstallButton({ className = 'btn btn-grad btn-sm', placement = 'pop' }: { className?: string; placement?: 'pop' | 'below' }) {
  const info = useInstall()
  const [help, setHelp] = useState('')
  if (info.installed) return null

  async function onClick() {
    if (info.ios) {
      setHelp('Ketuk ikon Bagikan, lalu pilih Tambah ke Layar Utama.')
      return
    }
    if (!info.prompt) {
      setHelp('Gunakan Chrome atau Edge. Menu browser akan menawarkan pemasangan saat aplikasi siap dipasang.')
      return
    }
    await info.prompt.prompt()
    const choice = await info.prompt.userChoice
    publish({ prompt: null, installed: choice.outcome === 'accepted' ? true : info.installed })
    if (choice.outcome !== 'accepted') setHelp('Pemasangan ditunda. Tombol ini tetap bisa dipakai nanti.')
  }

  return (
    <span className={placement === 'below' ? 'install-wrap below' : 'install-wrap'}>
      <button className={className} type="button" onClick={() => void onClick()}>
        Pasang aplikasi
      </button>
      {help ? (
        <span className="install-hint" role="status">
          {help}
        </span>
      ) : null}
    </span>
  )
}

export function InstallBanner() {
  const info = useInstall()
  const [closed, setClosed] = useState(() => localStorage.getItem(BANNER_KEY) === '1')
  if (info.installed || !info.android || closed) return null
  return (
    <div className="install-banner" role="region" aria-label="Pasang aplikasi">
      <p>Pasang ANARA di layar utama agar pesanan lebih mudah dibuka.</p>
      <div>
        <InstallButton />
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => {
            localStorage.setItem(BANNER_KEY, '1')
            setClosed(true)
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
