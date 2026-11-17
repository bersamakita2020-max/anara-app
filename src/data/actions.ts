import { contractTitle, contractVars, fillTemplate, nextSerial, orderPrefix, templateForBrand } from '../lib/contracts'
import { phaseForDate, splitAmount, type PhaseRatio } from '../lib/finance'
import { addDays, phoneKey, todayISO, uid, waHref } from '../lib/format'
import { makeChecks, STAGE_LABEL, stageIndex } from '../lib/sop'
import type { AppState, Invoice, Order, OrderInput, Payment, Phase, Role, SessionUser, Settings, Stage } from '../types'
import { DEMO_USERS } from './seed'

export interface ApplyResult {
  state: AppState
  error?: string
  info?: string
}

type Action =
  | { type: 'login-demo'; role: Role }
  | { type: 'set-session'; user: SessionUser | null }
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
  | { type: 'sign'; contractId: string; name: string; otp: string; agree: boolean; ip: string; userAgent: string }
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
  | { type: 'reset-demo' }

export type { Action }

const WORK: Stage[] = ['pengerjaan', 'revisi', 'menunggu_pelunasan', 'serah_terima', 'selesai']

function roleOf(state: AppState): Role | null {
  return state.session?.role ?? null
}

function allow(state: AppState, roles: Role[]): string | null {
  const role = roleOf(state)
  if (!role || !roles.includes(role)) return 'Peran ini tidak berwenang untuk tindakan tersebut.'
  return null
}

function actor(state: AppState): string {
  return state.session?.name || 'Sistem'
}

function audit(state: AppState, action: string, entity: string, detail: string): AppState {
  return {
    ...state,
    audit: [{ id: uid('aud'), actor: actor(state), action, entity, detail, at: new Date().toISOString() }, ...state.audit].slice(0, 300),
  }
}

function notify(state: AppState, title: string, body: string, href: string, forRole: AppState['notices'][number]['forRole']): AppState {
  return {
    ...state,
    notices: [{ id: uid('nt'), title, body, href, read: false, at: new Date().toISOString(), forRole }, ...state.notices],
  }
}

function ruleOn(state: AppState, key: string): boolean {
  return state.rules.find((item) => item.key === key)?.enabled !== false
}

function queueWa(state: AppState, phone: string, body: string): AppState {
  if (!phone) return state
  return {
    ...state,
    outbox: [{ id: uid('out'), channel: 'wa', to: phone, body, href: waHref(phone, body), status: 'siap', at: new Date().toISOString() }, ...state.outbox],
  }
}

function ratios(settings: Settings): Record<Phase, PhaseRatio> {
  const map = (phase: Phase): PhaseRatio => {
    const [worker, cash, ops, profit] = settings.splits[phase]
    return { worker, cash, ops, profit }
  }
  return { 1: map(1), 2: map(2), 3: map(3) }
}

function activePhase(settings: Settings, iso = todayISO()): Phase {
  return settings.phaseAuto ? phaseForDate(iso) : settings.phase
}

function paidOf(state: AppState, orderId: string): number {
  return state.payments
    .filter((item) => item.orderId === orderId && item.status === 'terverifikasi')
    .reduce((sum, item) => sum + item.amount, 0)
}

function patchOrder(state: AppState, orderId: string, patch: Partial<Order>): AppState {
  return { ...state, orders: state.orders.map((item) => (item.id === orderId ? { ...item, ...patch } : item)) }
}

function refreshInvoices(state: AppState, orderId: string): AppState {
  const invoices = state.invoices.map((invoice) => {
    if (invoice.orderId !== orderId || invoice.status === 'batal') return invoice
    const paid = state.payments
      .filter((item) => item.invoiceId === invoice.id && item.status === 'terverifikasi')
      .reduce((sum, item) => sum + item.amount, 0)
    const status: Invoice['status'] = paid <= 0 ? 'terbit' : paid >= invoice.amount ? 'lunas' : 'sebagian'
    return { ...invoice, status }
  })
  return { ...state, invoices }
}

function ensureSplit(state: AppState, order: Order): AppState {
  if (state.splits.some((item) => item.orderId === order.id)) return state
  if (!ruleOn(state, 'split')) return state
  const phase = activePhase(state.settings)
  const result = splitAmount(order.price, phase, Boolean(order.referrer.trim()), ratios(state.settings), state.settings.ownerShare)
  const worker = state.workers.find((item) => item.id === order.assigneeId)
  const warranty = order.brand === 'tech' ? addDays(todayISO(), 30) : order.warrantyUntil
  const next = patchOrder(state, order.id, { warrantyUntil: warranty })
  return {
    ...next,
    splits: [
      {
        id: uid('spl'),
        orderId: order.id,
        phase,
        gross: result.gross,
        referral: result.referral,
        base: result.base,
        worker: result.worker,
        cash: result.cash,
        ops: result.ops,
        profit: result.profit,
        ownerProfit: result.ownerProfit,
        partnerProfit: result.partnerProfit,
        workerName: worker?.name || '',
        at: new Date().toISOString(),
      },
      ...next.splits,
    ],
  }
}

function assigneeFor(state: AppState, brand: Order['brand']): string {
  if (brand === 'edukasi') {
    return state.workers.find((item) => item.name.includes('Fadilah'))?.id || state.workers.find((item) => item.brand === 'edukasi')?.id || ''
  }
  return state.workers.find((item) => item.name.includes('Wilda'))?.id || state.workers.find((item) => item.brand === 'studio' || item.brand === 'semua')?.id || ''
}

export function apply(state: AppState, action: Action): ApplyResult {
  switch (action.type) {
    case 'login-demo': {
      const user = DEMO_USERS.find((item) => item.role === action.role)
      if (!user) return { state, error: 'Peran tidak dikenal.' }
      return { state: { ...state, session: user }, info: `Masuk sebagai ${user.name}` }
    }
    case 'set-session':
      return { state: { ...state, session: action.user } }
    case 'logout':
      return { state: { ...state, session: null } }
    case 'reset-demo':
      return { state, info: 'reset' }
    case 'create-order':
      return createOrder(state, action.input)
    case 'sign':
      return sign(state, action)
    case 'move-stage':
      return moveStage(state, action.orderId, action.stage, Boolean(action.override))
    case 'toggle-check':
      return toggleCheck(state, action.checkId)
    case 'assign':
      return assign(state, action.orderId, action.workerId)
    case 'set-price':
      return setPrice(state, action.orderId, action.price)
    case 'add-revision':
      return addRevision(state, action.orderId, action.note)
    case 'cancel-order':
      return cancelOrder(state, action.orderId, action.reason)
    case 'add-payment':
      return addPayment(state, action)
    case 'verify-payment':
      return verifyPayment(state, action.paymentId, action.accept)
    case 'add-expense':
      return addExpense(state, action)
    case 'generate-contract':
      return generateContract(state, action.orderId, action.templateKey)
    case 'update-template': {
      const denied = allow(state, ['owner'])
      if (denied) return { state, error: denied }
      return {
        state: audit(
          { ...state, templates: state.templates.map((item) => (item.key === action.key ? { ...item, body: action.body } : item)) },
          'ubah',
          'templat',
          `Templat ${action.key} diperbarui`,
        ),
        info: 'Templat disimpan.',
      }
    }
    case 'set-contract-status': {
      const denied = allow(state, ['owner', 'finance'])
      if (denied) return { state, error: denied }
      return {
        state: audit(
          { ...state, contracts: state.contracts.map((item) => (item.id === action.id ? { ...item, status: action.status } : item)) },
          'status',
          'kontrak',
          `Status kontrak menjadi ${action.status}`,
        ),
      }
    }
    case 'toggle-rule': {
      const denied = allow(state, ['owner'])
      if (denied) return { state, error: denied }
      return {
        state: audit(
          { ...state, rules: state.rules.map((item) => (item.key === action.key ? { ...item, enabled: !item.enabled } : item)) },
          'aturan',
          'automasi',
          `Aturan ${action.key} diubah`,
        ),
      }
    }
    case 'update-settings': {
      const denied = allow(state, ['owner'])
      if (denied) return { state, error: denied }
      return { state: audit({ ...state, settings: { ...state.settings, ...action.patch } }, 'ubah', 'pengaturan', 'Pengaturan usaha diperbarui'), info: 'Pengaturan disimpan.' }
    }
    case 'update-package': {
      const denied = allow(state, ['owner'])
      if (denied) return { state, error: denied }
      return {
        state: audit(
          { ...state, packages: state.packages.map((item) => (item.id === action.id ? { ...item, ...action.patch, fixed: action.patch.priceMin !== undefined && action.patch.priceMin === (action.patch.priceMax ?? item.priceMax) ? item.fixed : item.fixed } : item)) },
          'harga',
          'paket',
          `Paket ${action.id} diperbarui`,
        ),
        info: 'Daftar harga diperbarui.',
      }
    }
    case 'save-client':
      return saveClient(state, action)
    case 'save-worker':
      return saveWorker(state, action)
    case 'save-portfolio':
      return savePortfolio(state, action)
    case 'save-testimonial':
      return saveTestimonial(state, action)
    case 'read-notice':
      return { state: { ...state, notices: state.notices.map((item) => (item.id === action.id ? { ...item, read: true } : item)) } }
    case 'build-settlement':
      return buildSettlement(state, action.period)
    case 'approve-settlement': {
      const denied = allow(state, ['owner'])
      if (denied) return { state, error: denied }
      return {
        state: audit(
          { ...state, settlements: state.settlements.map((item) => (item.id === action.id ? { ...item, status: 'disetujui', approvedAt: new Date().toISOString() } : item)) },
          'setujui',
          'settlement',
          'Laporan tanggal 5 disetujui pemilik',
        ),
        info: 'Settlement disetujui.',
      }
    }
    case 'pay-settlement': {
      const denied = allow(state, ['finance', 'owner'])
      if (denied) return { state, error: denied }
      return {
        state: audit(
          { ...state, settlements: state.settlements.map((item) => (item.id === action.id ? { ...item, status: 'dibayar' } : item)) },
          'bayar',
          'settlement',
          'Honor dan laba ditandai dibayar',
        ),
        info: 'Settlement ditandai dibayar.',
      }
    }
    case 'add-file': {
      const denied = allow(state, ['owner', 'finance', 'worker'])
      if (denied) return { state, error: denied }
      const order = state.orders.find((item) => item.id === action.orderId)
      if (!order) return { state, error: 'Order tidak ditemukan.' }
      return {
        state: patchOrder(state, order.id, { files: [...order.files, { id: uid('file'), name: action.name, kind: action.kind, at: new Date().toISOString() }] }),
        info: 'Berkas dicatat.',
      }
    }
    case 'mark-outbox':
      return { state: { ...state, outbox: state.outbox.map((item) => (item.id === action.id ? { ...item, status: 'terkirim' } : item)) } }
    default:
      return { state }
  }
}

function createOrder(state: AppState, input: OrderInput): ApplyResult {
  const pack = state.packages.find((item) => item.id === input.packageId && item.active)
  if (!pack) return { state, error: 'Paket tidak ditemukan.' }
  if (input.name.trim().length < 3 || phoneKey(input.whatsapp).length < 8) return { state, error: 'Nama dan WhatsApp wajib diisi.' }
  let price = pack.fixed ? pack.priceMin : input.price || pack.priceMin
  if (!pack.fixed && (price < pack.priceMin || price > pack.priceMax)) price = pack.priceMin
  const dpPercent = price >= 3_000_000 ? 70 : 50
  const clientId = uid('c')
  const orderId = uid('o')
  const date = new Date()
  const code = nextSerial(orderPrefix(pack.brand), state.orders.map((item) => item.code), date)
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const templateKey = templateForBrand(pack.brand)
  const template = state.templates.find((item) => item.key === templateKey)
  const number = template?.prefix ? nextSerial(template.prefix, state.contracts.map((item) => item.number), date) : ''
  const order: Order = {
    id: orderId,
    code,
    clientId,
    packageId: pack.id,
    brand: pack.brand,
    title: pack.name,
    brief: input.brief.trim(),
    stage: 'masuk_brief',
    price,
    dpPercent,
    dueDate: input.dueDate || addDays(todayISO(), 14),
    assigneeId: assigneeFor(state, pack.brand),
    referrer: input.referrer.trim(),
    revisionCount: 0,
    revisionLimit: pack.revisions || 2,
    studentStatus: input.studentStatus,
    campus: input.campus,
    scriptType: input.scriptType,
    startedAt: null,
    warrantyUntil: null,
    offerExpires: addDays(todayISO(), 7),
    createdAt: new Date().toISOString(),
    sample: false,
    files: input.files.map((name) => ({ id: uid('file'), name, kind: 'brief', at: new Date().toISOString() })),
  }
  let next: AppState = {
    ...state,
    clients: [
      {
        id: clientId,
        name: input.name.trim(),
        whatsapp: input.whatsapp.trim(),
        email: input.email.trim(),
        address: input.address.trim(),
        institution: input.institution.trim(),
        studentStatus: input.studentStatus,
        notes: '',
        sample: false,
      },
      ...state.clients,
    ],
    orders: [order, ...state.orders],
    checks: [...makeChecks(orderId, pack.brand, 'masuk_brief'), ...state.checks],
    events: [{ id: uid('ev'), orderId, stage: 'masuk_brief', note: 'Pesanan masuk dari formulir.', actor: 'Klien', at: new Date().toISOString() }, ...state.events],
  }
  const vars = contractVars(next, order, number)
  const contractId = uid('k')
  next = {
    ...next,
    contracts: [
      {
        id: contractId,
        orderId,
        templateKey,
        number,
        title: contractTitle(templateKey),
        body: fillTemplate(template?.body || '', vars),
        status: 'terkirim',
        signerName: '',
        signedAt: null,
        ip: '',
        userAgent: '',
        otpHint: otp,
        attempts: 0,
        sample: false,
      },
      ...next.contracts,
    ],
  }
  next = audit(next, 'buat', 'order', `${code} · ${pack.name}`)
  next = notify(next, 'Pesanan baru', `${code} menunggu brief.`, `#/app/order/${orderId}`, 'semua')
  if (ruleOn(next, 'wa-status')) {
    const message = `Halo ${input.name.trim()}, pesanan ${code} (${pack.name}) sudah ANARA catat. Kontrak menyusul untuk disetujui. WhatsApp resmi 0581-1699-699.`
    next = queueWa(next, input.whatsapp, message)
  }
  const info = `Pesanan ${code} tercatat. Nomor kontrak ${number || 'menyusul'}. Kode konfirmasi contoh: ${otp}`
  return { state: next, info: `${info}|${contractId}|${code}|${otp}` }
}

function sign(state: AppState, action: Extract<Action, { type: 'sign' }>): ApplyResult {
  const contract = state.contracts.find((item) => item.id === action.contractId)
  if (!contract) return { state, error: 'Kontrak tidak ditemukan.' }
  if (contract.status === 'disetujui') return { state, error: 'Kontrak ini sudah disetujui.' }
  if (!action.agree) return { state, error: 'Centang persetujuan terlebih dahulu.' }
  if (action.name.trim().length < 3) return { state, error: 'Tuliskan nama terang.' }
  if ((contract.attempts || 0) >= 5) return { state, error: 'Percobaan kode sudah mencapai batas. Minta kode baru ke Admin WA.' }
  if (action.otp.trim() !== (contract.otpHint || '')) {
    const contracts = state.contracts.map((item) => (item.id === contract.id ? { ...item, attempts: item.attempts + 1 } : item))
    return { state: { ...state, contracts }, error: 'Kode konfirmasi tidak sesuai.' }
  }
  let next: AppState = {
    ...state,
    contracts: state.contracts.map((item) =>
      item.id === contract.id
        ? { ...item, status: 'disetujui', signerName: action.name.trim(), signedAt: new Date().toISOString(), ip: action.ip || 'tidak tersedia', userAgent: action.userAgent, otpHint: null }
        : item,
    ),
  }
  const order = next.orders.find((item) => item.id === contract.orderId)
  if (order) {
    const stage = stageIndex(order.stage) < stageIndex('menunggu_dp') ? 'menunggu_dp' : order.stage
    next = patchOrder(next, order.id, { stage })
    next = {
      ...next,
      checks: next.checks.map((item) => (item.orderId === order.id && item.stage === 'kontrak' ? { ...item, done: true } : item)),
      events: [{ id: uid('ev'), orderId: order.id, stage, note: `Kontrak disetujui oleh ${action.name.trim()}.`, actor: action.name.trim(), at: new Date().toISOString() }, ...next.events],
    }
    if (!next.invoices.some((item) => item.orderId === order.id && item.kind === 'dp')) {
      const amount = Math.round((order.price * order.dpPercent) / 100)
      const invoice: Invoice = {
        id: uid('inv'),
        orderId: order.id,
        kind: 'dp',
        number: nextSerial('INV/DP', next.invoices.map((item) => item.number)),
        amount,
        status: 'terbit',
        dueDate: addDays(todayISO(), 3),
        issuedAt: new Date().toISOString(),
      }
      next = { ...next, invoices: [invoice, ...next.invoices] }
    }
    const client = next.clients.find((item) => item.id === order.clientId)
    if (ruleOn(next, 'invoice') && client) {
      next = queueWa(next, client.whatsapp, `Tagihan uang muka ${order.code} sebesar ${Math.round((order.price * order.dpPercent) / 100)} sudah terbit. Kerja dimulai setelah DP masuk.`)
    }
  }
  next = audit(next, 'setujui', 'kontrak', `${contract.number} · IP ${action.ip || 'tidak tersedia'}`)
  return { state: next, info: 'Kontrak disetujui. Tagihan uang muka terbit. Kerja dimulai setelah DP masuk.' }
}

function moveStage(state: AppState, orderId: string, stage: Stage, override: boolean): ApplyResult {
  const denied = allow(state, ['owner', 'finance', 'worker'])
  if (denied) return { state, error: denied }
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return { state, error: 'Order tidak ditemukan.' }
  if (roleOf(state) === 'worker') {
    const mine = state.workers.find((item) => item.profileId === state.session?.id)
    if (!mine || mine.id !== order.assigneeId) return { state, error: 'Order ini bukan tugas Anda.' }
    if (!['pengerjaan', 'revisi', 'serah_terima'].includes(stage)) return { state, error: 'Pekerja hanya menggeser tahap pengerjaan.' }
  }
  const currentChecks = state.checks.filter((item) => item.orderId === order.id && item.stage === order.stage)
  if (currentChecks.length && !currentChecks.every((item) => item.done) && !(override && roleOf(state) === 'owner')) {
    return { state, error: 'Checklist SOP tahap ini belum lengkap. Pemilik dapat melanjutkan dengan catat pengecualian.' }
  }
  let next = patchOrder(state, order.id, { stage, startedAt: stage === 'pengerjaan' && !order.startedAt ? new Date().toISOString() : order.startedAt })
  if (stage === 'menunggu_pelunasan' && !next.invoices.some((item) => item.orderId === order.id && item.kind === 'pelunasan')) {
    const paid = paidOf(next, order.id)
    const invoice: Invoice = {
      id: uid('inv'),
      orderId: order.id,
      kind: 'pelunasan',
      number: nextSerial('INV/LUN', next.invoices.map((item) => item.number)),
      amount: Math.max(order.price - paid, 0),
      status: 'terbit',
      dueDate: addDays(todayISO(), 7),
      issuedAt: new Date().toISOString(),
    }
    next = { ...next, invoices: [invoice, ...next.invoices] }
  }
  if (stage === 'selesai') next = ensureSplit(next, { ...order, stage })
  next = {
    ...next,
    events: [{ id: uid('ev'), orderId: order.id, stage, note: override ? 'Tahap digeser dengan pengecualian pemilik.' : `Masuk tahap ${STAGE_LABEL[stage]}.`, actor: actor(state), at: new Date().toISOString() }, ...next.events],
  }
  const client = next.clients.find((item) => item.id === order.clientId)
  if (ruleOn(next, 'wa-status') && client) next = queueWa(next, client.whatsapp, `Pesanan ${order.code} sekarang: ${STAGE_LABEL[stage]}.`)
  next = audit(next, 'tahap', 'order', `${order.code} → ${STAGE_LABEL[stage]}`)
  return { state: next, info: `Tahap menjadi ${STAGE_LABEL[stage]}.` }
}

function toggleCheck(state: AppState, checkId: string): ApplyResult {
  const denied = allow(state, ['owner', 'finance', 'worker'])
  if (denied) return { state, error: denied }
  const check = state.checks.find((item) => item.id === checkId)
  if (!check) return { state, error: 'Checklist tidak ditemukan.' }
  return { state: { ...state, checks: state.checks.map((item) => (item.id === checkId ? { ...item, done: !item.done } : item)) } }
}

function assign(state: AppState, orderId: string, workerId: string): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  const worker = state.workers.find((item) => item.id === workerId)
  if (!worker) return { state, error: 'Pekerja tidak ditemukan.' }
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return { state, error: 'Order tidak ditemukan.' }
  return { state: audit(patchOrder(state, orderId, { assigneeId: workerId }), 'tugaskan', 'order', `${order.code} → ${worker.name}`), info: 'Penugasan disimpan.' }
}

function setPrice(state: AppState, orderId: string, price: number): ApplyResult {
  const denied = allow(state, ['owner'])
  if (denied) return { state, error: denied }
  if (price <= 0) return { state, error: 'Harga tidak valid.' }
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return { state, error: 'Order tidak ditemukan.' }
  const dpPercent = price >= 3_000_000 ? 70 : order.dpPercent
  return { state: audit(patchOrder(state, orderId, { price, dpPercent }), 'harga', 'order', `${order.code} menjadi ${price}`), info: 'Nilai order dikunci.' }
}

function addRevision(state: AppState, orderId: string, note: string): ApplyResult {
  const denied = allow(state, ['owner', 'finance', 'worker'])
  if (denied) return { state, error: denied }
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return { state, error: 'Order tidak ditemukan.' }
  if (order.revisionCount >= order.revisionLimit) {
    return { state, error: `Kuota ${order.revisionLimit} putaran sudah terpakai. Berikutnya dihitung perubahan lingkup dan disebut harganya sebelum dikerjakan.` }
  }
  const count = order.revisionCount + 1
  let next = patchOrder(state, orderId, { revisionCount: count, stage: 'revisi' })
  next = {
    ...next,
    events: [{ id: uid('ev'), orderId, stage: 'revisi', note: note || `Revisi ${count}/${order.revisionLimit}`, actor: actor(state), at: new Date().toISOString() }, ...next.events],
  }
  return { state: audit(next, 'revisi', 'order', `${order.code} revisi ${count}/${order.revisionLimit}`), info: `Revisi ${count} dari ${order.revisionLimit} dicatat.` }
}

function cancelOrder(state: AppState, orderId: string, reason: string): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return { state, error: 'Order tidak ditemukan.' }
  const started = Boolean(order.startedAt) || WORK.includes(order.stage)
  const paid = paidOf(state, order.id)
  const refund = started ? 0 : Math.round(paid * 0.9)
  const note = started
    ? 'Dibatalkan setelah kerja dimulai. Uang muka tidak kembali.'
    : `Dibatalkan sebelum mulai. Pengembalian ${refund} setelah potongan administrasi 10%.`
  let next = patchOrder(state, orderId, { stage: 'batal' })
  next = { ...next, events: [{ id: uid('ev'), orderId, stage: 'batal', note: `${note} ${reason}`, actor: actor(state), at: new Date().toISOString() }, ...next.events] }
  return { state: audit(next, 'batal', 'order', `${order.code}: ${note}`), info: note }
}

function addPayment(state: AppState, action: Extract<Action, { type: 'add-payment' }>): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied && roleOf(state) !== null) return { state, error: denied }
  const invoice = state.invoices.find((item) => item.id === action.invoiceId)
  if (!invoice) return { state, error: 'Tagihan tidak ditemukan.' }
  const payment: Payment = {
    id: uid('pay'),
    invoiceId: invoice.id,
    orderId: action.orderId,
    amount: action.amount,
    status: 'menunggu',
    proofName: action.proofName || 'bukti',
    note: '',
    paidAt: new Date().toISOString(),
    verifiedAt: null,
  }
  return { state: audit({ ...state, payments: [payment, ...state.payments] }, 'bukti', 'pembayaran', `${invoice.number} menunggu verifikasi`), info: 'Bukti pembayaran tercatat dan menunggu verifikasi.' }
}

function verifyPayment(state: AppState, paymentId: string, accept: boolean): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  const payment = state.payments.find((item) => item.id === paymentId)
  if (!payment) return { state, error: 'Pembayaran tidak ditemukan.' }
  let next: AppState = {
    ...state,
    payments: state.payments.map((item) =>
      item.id === paymentId ? { ...item, status: accept ? 'terverifikasi' : 'ditolak', verifiedAt: new Date().toISOString() } : item,
    ),
  }
  next = refreshInvoices(next, payment.orderId)
  const order = next.orders.find((item) => item.id === payment.orderId)
  if (!order || !accept) return { state: audit(next, 'verifikasi', 'pembayaran', accept ? 'diterima' : 'ditolak'), info: accept ? 'Pembayaran diverifikasi.' : 'Pembayaran ditolak.' }
  const paid = paidOf(next, order.id)
  const dpNeed = Math.round((order.price * order.dpPercent) / 100)
  if (paid >= order.price) {
    next = ensureSplit(next, order)
    const stage = order.stage === 'menunggu_pelunasan' || order.stage === 'pengerjaan' || order.stage === 'revisi' ? 'serah_terima' : order.stage
    const warranty = order.brand === 'tech' ? addDays(todayISO(), 30) : order.warrantyUntil
    next = patchOrder(next, order.id, { stage, warrantyUntil: warranty, startedAt: order.startedAt || new Date().toISOString() })
  } else if (paid >= dpNeed && order.stage === 'menunggu_dp') {
    next = patchOrder(next, order.id, { stage: 'pengerjaan', startedAt: new Date().toISOString() })
  }
  const fresh = next.orders.find((item) => item.id === order.id)!
  next = {
    ...next,
    events: [{ id: uid('ev'), orderId: order.id, stage: fresh.stage, note: 'Pembayaran diverifikasi.', actor: actor(state), at: new Date().toISOString() }, ...next.events],
  }
  next = audit(next, 'verifikasi', 'pembayaran', `${order.code} diverifikasi`)
  return { state: next, info: paid >= order.price ? 'Lunas. Bagi hasil tercatat dan file akhir dapat diserahkan.' : 'Pembayaran diverifikasi.' }
}

function addExpense(state: AppState, action: Extract<Action, { type: 'add-expense' }>): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  if (action.amount <= 0) return { state, error: 'Nominal tidak valid.' }
  const cash = state.splits.reduce((sum, item) => sum + item.cash, 0)
  if (action.category.toLowerCase().includes('tools') && cash < state.settings.toolsThreshold) {
    return { state, error: `Tools berbayar di atas kuota baru dibuka setelah kas melewati ambang.` }
  }
  const next = audit(
    {
      ...state,
      expenses: [{ id: uid('ex'), date: action.date || todayISO(), category: action.category, amount: action.amount, memo: action.memo, sample: false }, ...state.expenses],
    },
    'keluar',
    'operasional',
    `${action.category} ${action.amount}`,
  )
  return { state: next, info: 'Pengeluaran dicatat.' }
}

function generateContract(state: AppState, orderId: string | null, templateKey: string): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  const template = state.templates.find((item) => item.key === templateKey)
  if (!template) return { state, error: 'Templat tidak ditemukan.' }
  const order = orderId ? state.orders.find((item) => item.id === orderId) || null : null
  const number = template.prefix ? nextSerial(template.prefix, state.contracts.map((item) => item.number)) : ''
  const id = uid('k')
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const body = fillTemplate(template.body, contractVars(state, order, number))
  const contract = {
    id,
    orderId,
    templateKey,
    number,
    title: contractTitle(templateKey),
    body,
    status: 'draf' as const,
    signerName: '',
    signedAt: null,
    ip: '',
    userAgent: '',
    otpHint: order ? otp : null,
    attempts: 0,
    sample: false,
  }
  return {
    state: audit({ ...state, contracts: [contract, ...state.contracts] }, 'terbit', 'kontrak', number || template.name),
    info: `${id}|${number}|${otp}`,
  }
}

function saveClient(state: AppState, action: Extract<Action, { type: 'save-client' }>): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  if (action.id) {
    return {
      state: {
        ...state,
        clients: state.clients.map((item) => (item.id === action.id ? { ...item, ...action, id: item.id, email: action.email || '', address: action.address || '', institution: action.institution || '', studentStatus: action.studentStatus || '', notes: action.notes || '' } : item)),
      },
      info: 'Klien diperbarui.',
    }
  }
  return {
    state: {
      ...state,
      clients: [{ id: uid('c'), name: action.name, whatsapp: action.whatsapp, email: action.email || '', address: action.address || '', institution: action.institution || '', studentStatus: action.studentStatus || '', notes: action.notes || '', sample: false }, ...state.clients],
    },
    info: 'Klien ditambahkan.',
  }
}

function saveWorker(state: AppState, action: Extract<Action, { type: 'save-worker' }>): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  if (action.id) {
    return { state: { ...state, workers: state.workers.map((item) => (item.id === action.id ? { ...item, name: action.name, whatsapp: action.whatsapp, title: action.title, brand: action.brand } : item)) }, info: 'Data pekerja diperbarui.' }
  }
  return {
    state: { ...state, workers: [{ id: uid('w'), profileId: null, name: action.name, whatsapp: action.whatsapp, title: action.title, brand: action.brand, active: true, sample: false }, ...state.workers] },
    info: 'Pekerja ditambahkan. Lowongan produksi tetap mengikuti kunci rekrutmen.',
  }
}

function savePortfolio(state: AppState, action: Extract<Action, { type: 'save-portfolio' }>): ApplyResult {
  const denied = allow(state, ['owner', 'social'])
  if (denied) return { state, error: denied }
  if (action.brand === 'edukasi' && action.published) {
    return { state, error: 'Naskah Edukasi tidak dipublikasikan tanpa izin tertulis, dan tidak masuk portofolio umum.' }
  }
  if (action.id) {
    return { state: { ...state, portfolio: state.portfolio.map((item) => (item.id === action.id ? { ...item, ...action, id: item.id, sample: item.sample } : item)) }, info: 'Portofolio disimpan.' }
  }
  return { state: { ...state, portfolio: [{ id: uid('p'), brand: action.brand, title: action.title, caption: action.caption, published: action.published, sample: false }, ...state.portfolio] }, info: 'Karya ditambahkan.' }
}

function saveTestimonial(state: AppState, action: Extract<Action, { type: 'save-testimonial' }>): ApplyResult {
  const denied = allow(state, ['owner', 'social', 'finance'])
  if (denied) return { state, error: denied }
  if (action.id) {
    return { state: { ...state, testimonials: state.testimonials.map((item) => (item.id === action.id ? { ...item, ...action, id: item.id, sample: item.sample } : item)) } }
  }
  return { state: { ...state, testimonials: [{ id: uid('t'), name: action.name, role: action.role, quote: action.quote, stars: action.stars, published: action.published, sample: false }, ...state.testimonials] }, info: 'Testimoni disimpan.' }
}

function buildSettlement(state: AppState, period: string): ApplyResult {
  const denied = allow(state, ['owner', 'finance'])
  if (denied) return { state, error: denied }
  if (state.settlements.some((item) => item.period === period)) return { state, error: 'Settlement periode ini sudah ada.' }
  const item = { id: uid('set'), period, status: 'siap' as const, note: 'Disusun untuk persetujuan pemilik.', approvedAt: null }
  return { state: audit({ ...state, settlements: [item, ...state.settlements] }, 'susun', 'settlement', period), info: `Laporan ${period} tersusun.` }
}
