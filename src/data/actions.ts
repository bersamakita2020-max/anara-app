import type { AppState, OrderInput, Role, Settings, Stage } from '../types'

export interface ApplyResult {
  error?: string
  info?: string
}

export type Action =
  | { type: 'logout' }
  | { type: 'create-order'; input: OrderInput }
  | { type: 'move-stage'; orderId: string; stage: Stage; override?: boolean }
  | { type: 'toggle-check'; checkId: string }
  | { type: 'assign'; orderId: string; workerId: string }
  | { type: 'set-price'; orderId: string; price: number }
  | { type: 'add-revision'; orderId: string; note: string }
  | { type: 'cancel-order'; orderId: string; reason: string }
  | { type: 'add-payment'; orderId: string; invoiceId: string; amount: number; proofName: string }
  | { type: 'verify-payment'; paymentId: string; accept: boolean }
  | { type: 'add-expense'; date: string; category: string; amount: number; memo: string }
  | { type: 'sign'; contractId: string; name: string; agree: boolean; signature: string; ip: string; userAgent: string }
  | { type: 'save-package'; id?: string; slug: string; brand: 'studio' | 'edukasi' | 'tech'; name: string; summary: string; features: string; priceMin: number; priceMax: number; leadDays: number; icon: string; active: boolean }
  | { type: 'move-package'; id: string; direction: 'naik' | 'turun' }
  | { type: 'generate-contract'; orderId: string | null; templateKey: string }
  | { type: 'update-template'; key: string; body: string }
  | { type: 'set-contract-status'; id: string; status: 'draf' | 'terkirim' | 'disetujui' }
  | { type: 'toggle-rule'; key: string }
  | { type: 'update-settings'; patch: Partial<Settings> }
  | { type: 'update-package'; id: string; patch: { priceMin?: number; priceMax?: number; active?: boolean; summary?: string } }
  | { type: 'save-client'; id?: string; name: string; whatsapp: string; email?: string; address?: string; institution?: string; studentStatus?: '' | 'reguler' | 'rpl'; notes?: string }
  | { type: 'save-worker'; id?: string; name: string; whatsapp: string; title: string; brand: 'studio' | 'edukasi' | 'tech' | 'semua' }
  | { type: 'save-portfolio'; id?: string; brand: 'studio' | 'edukasi' | 'tech'; title: string; caption: string; published: boolean }
  | { type: 'save-testimonial'; id?: string; name: string; role: string; quote: string; stars: number; published: boolean }
  | { type: 'read-notice'; id: string }
  | { type: 'approve-settlement'; id: string }
  | { type: 'pay-settlement'; id: string }
  | { type: 'build-settlement'; period: string }
  | { type: 'add-file'; orderId: string; name: string; kind: string }
  | { type: 'mark-outbox'; id: string }

export function deny(state: AppState, roles: Role[]): string | null {
  const role = state.session?.role
  if (!role || !roles.includes(role)) return 'Peran ini tidak berwenang untuk tindakan tersebut.'
  return null
}
