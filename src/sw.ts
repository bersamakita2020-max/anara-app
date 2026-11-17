import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

const worker = self as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST: { url: string; revision: string | null }[] }
const pembaruan = Boolean(worker.registration.active)

clientsClaim()
worker.skipWaiting()
cleanupOutdatedCaches()

registerRoute(
  ({ request, url }) => request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/anara-app/') || url.pathname.endsWith('manifest.webmanifest'),
  new NetworkFirst({
    cacheName: 'anara-dokumen',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

precacheAndRoute(self.__WB_MANIFEST)

worker.addEventListener('activate', (event) => {
  if (!pembaruan) return
  event.waitUntil((async () => {
    const windows = await worker.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const pending = new Set(windows.map((client) => client.id))
    const selesai = (message: ExtendableMessageEvent) => {
      if (message.data === 'ANARA_RELOADING' && message.source) pending.delete(message.source.id)
    }
    worker.addEventListener('message', selesai)
    await Promise.all(windows.map((client) => client.postMessage({ type: 'ANARA_SW_UPDATE' })))
    await new Promise((resolve) => setTimeout(resolve, 1200))
    worker.removeEventListener('message', selesai)
    const tersisa = await worker.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await Promise.all(tersisa.filter((client) => pending.has(client.id) && client.url.includes('/anara-app')).map((client) => client.navigate(client.url)))
  })())
})
