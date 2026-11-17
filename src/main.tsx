import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

function tampilkanPembaruan(muatUlang: () => void) {
  if (document.getElementById('pembaruan-sw')) return
  const toast = document.createElement('button')
  toast.id = 'pembaruan-sw'
  toast.type = 'button'
  toast.className = 'toast ok'
  toast.textContent = 'Versi baru tersedia - Perbarui'
  toast.onclick = () => muatUlang()
  document.body.appendChild(toast)
  window.setTimeout(muatUlang, 1200)
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const muatUlang = () => {
    if (sessionStorage.getItem('anara-sw-reload') === '1') return
    sessionStorage.setItem('anara-sw-reload', '1')
    window.location.reload()
  }
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'ANARA_SW_UPDATE') return
    navigator.serviceWorker.controller?.postMessage('ANARA_RELOADING')
    tampilkanPembaruan(muatUlang)
  })
  registerSW({
    immediate: true,
    onNeedReload() {
      tampilkanPembaruan(muatUlang)
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      void navigator.serviceWorker.register(swUrl, { scope: '/anara-app/', updateViaCache: 'none' })
      const cek = () => {
        if (document.visibilityState === 'visible') void registration.update()
      }
      window.setInterval(cek, 60_000)
      document.addEventListener('visibilitychange', cek)
      window.addEventListener('focus', cek)
    },
  })
  window.addEventListener('load', () => sessionStorage.removeItem('anara-sw-reload'))
}

if (localStorage.getItem('anara-theme') === 'dark') {
  document.documentElement.dataset.theme = 'dark'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
