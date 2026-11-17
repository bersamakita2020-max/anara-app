export type Role = 'owner' | 'finance' | 'worker' | 'social' | 'client'
export type Brand = 'studio' | 'edukasi' | 'tech'
export type Phase = 1 | 2 | 3
export type Stage =
  | 'masuk_brief'
  | 'penawaran'
  | 'kontrak'
  | 'menunggu_dp'
  | 'pengerjaan'
  | 'revisi'
  | 'menunggu_pelunasan'
  | 'serah_terima'
  | 'selesai'
  | 'ditahan'
  | 'batal'

export interface SessionUser {
  id: string
  name: string
  role: Role
  email: string
}

export interface PackageItem {
  id: string
  slug: string
  brand: Brand
  name: string
  summary: string
  priceMin: number
  priceMax: number
  fixed: boolean
  revisions: number
  active: boolean
}

export interface Client {
  id: string
  name: string
  whatsapp: string
  email: string
  address: string
  institution: string
  studentStatus: '' | 'reguler' | 'rpl'
  notes: string
  sample: boolean
}

export interface Worker {
  id: string
  profileId: string | null
  name: string
  whatsapp: string
  title: string
  brand: Brand | 'semua'
  active: boolean
  sample: boolean
}

export interface OrderFile {
  id: string
  name: string
  kind: string
  at: string
}

export interface Order {
  id: string
  code: string
  clientId: string
  packageId: string
  brand: Brand
  title: string
  brief: string
  stage: Stage
  price: number
  dpPercent: number
  dueDate: string
  assigneeId: string
  referrer: string
  revisionCount: number
  revisionLimit: number
  studentStatus: string
  campus: string
  scriptType: string
  startedAt: string | null
  warrantyUntil: string | null
  offerExpires: string | null
  createdAt: string
  sample: boolean
  files: OrderFile[]
}

export interface OrderEvent {
  id: string
  orderId: string
  stage: Stage
  note: string
  actor: string
  at: string
}

export interface SopCheck {
  id: string
  orderId: string
  stage: Stage
  sop: string
  label: string
  done: boolean
}

export interface Invoice {
  id: string
  orderId: string
  kind: 'dp' | 'pelunasan'
  number: string
  amount: number
  status: 'terbit' | 'sebagian' | 'lunas' | 'batal'
  dueDate: string
  issuedAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  orderId: string
  amount: number
  status: 'menunggu' | 'terverifikasi' | 'ditolak'
  proofName: string
  note: string
  paidAt: string
  verifiedAt: string | null
}

export interface Split {
  id: string
  orderId: string
  phase: Phase
  gross: number
  referral: number
  base: number
  worker: number
  cash: number
  ops: number
  profit: number
  ownerProfit: number
  partnerProfit: number
  workerName: string
  at: string
}

export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  memo: string
  sample: boolean
}

export interface Template {
  key: string
  name: string
  prefix: string
  body: string
}

export interface ContractDoc {
  id: string
  orderId: string | null
  templateKey: string
  number: string
  title: string
  body: string
  status: 'draf' | 'terkirim' | 'disetujui'
  signerName: string
  signedAt: string | null
  ip: string
  userAgent: string
  otpHint: string | null
  attempts: number
  sample: boolean
}

export interface Audit {
  id: string
  actor: string
  action: string
  entity: string
  detail: string
  at: string
}

export interface Notice {
  id: string
  title: string
  body: string
  href: string
  read: boolean
  at: string
  forRole: Role | 'semua'
}

export interface Rule {
  key: string
  title: string
  detail: string
  message: string
  enabled: boolean
  group: 'pemberitahuan' | 'keuangan' | 'laporan'
}

export interface Settings {
  phase: Phase
  phaseAuto: boolean
  splits: Record<Phase, [number, number, number, number]>
  bankName: string
  bankNumber: string
  bankHolder: string
  emergencyRate: number
  emergencyCap: number
  toolsThreshold: number
  recruitRevenue: number
  recruitMonths: number
  recruitCash: number
  ownerShare: number
  partnerShare: number
  honor: Record<Phase, number>
  waDisplay: string
  waLink: string
  address: string
  ownerName: string
  partnerName: string
}

export interface PortfolioItem {
  id: string
  brand: Brand
  title: string
  caption: string
  published: boolean
  sample: boolean
}

export interface Testimonial {
  id: string
  name: string
  role: string
  quote: string
  stars: number
  published: boolean
  sample: boolean
}

export interface Settlement {
  id: string
  period: string
  status: 'draf' | 'siap' | 'disetujui' | 'dibayar'
  note: string
  approvedAt: string | null
}

export interface Outbox {
  id: string
  channel: 'wa' | 'email'
  to: string
  body: string
  href: string
  status: 'siap' | 'terkirim'
  at: string
}

export interface AppState {
  packages: PackageItem[]
  clients: Client[]
  workers: Worker[]
  orders: Order[]
  events: OrderEvent[]
  checks: SopCheck[]
  invoices: Invoice[]
  payments: Payment[]
  splits: Split[]
  expenses: Expense[]
  templates: Template[]
  contracts: ContractDoc[]
  portfolio: PortfolioItem[]
  testimonials: Testimonial[]
  audit: Audit[]
  notices: Notice[]
  rules: Rule[]
  settings: Settings
  settlements: Settlement[]
  outbox: Outbox[]
  session: SessionUser | null
}

export interface OrderInput {
  name: string
  whatsapp: string
  email: string
  address: string
  institution: string
  packageId: string
  brief: string
  dueDate: string
  studentStatus: '' | 'reguler' | 'rpl'
  campus: string
  scriptType: string
  referrer: string
  files: string[]
  price?: number
}
