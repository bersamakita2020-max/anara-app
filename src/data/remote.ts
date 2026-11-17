import { supabase } from '../lib/supabase'
import type { AppState, Client, Role } from '../types'
import { defaultSettings, emptyState } from './defaults'

function rows<T>(value: { data: T[] | null; error: { message: string } | null }, optional = false): T[] {
  if (value.error) {
    if (optional) return []
    throw new Error(value.error.message)
  }
  return value.data || []
}

export async function loadRemote(): Promise<AppState> {
  if (!supabase) throw new Error('Server belum dikonfigurasi.')
  const base = emptyState()
  const packages = rows(await supabase.from('packages').select('*').order('sort'))
  const [clients, workers, orders, events, checks, invoices, payments, splits, expenses, templates, contracts, portfolio, testimonials, audit, notices, rules, settingsRows, settlements, outbox] =
    await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('workers').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('order_events').select('*'),
      supabase.from('sop_checks').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('finance_splits').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('contract_templates').select('*'),
      supabase.from('contracts').select('*'),
      supabase.from('portfolio_items').select('*'),
      supabase.from('testimonials').select('*'),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('automation_rules').select('*'),
      supabase.from('app_settings').select('*').eq('id', 1),
      supabase.from('settlements').select('*'),
      supabase.from('wa_outbox').select('*').order('created_at', { ascending: false }).limit(40),
    ])
  const session = (await supabase.auth.getSession()).data.session
  let user = null as AppState['session']
  if (session) {
    const profile = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    if (profile.data) {
      user = {
        id: profile.data.id as string,
        name: (profile.data.full_name as string) || session.user.email || 'Pengguna',
        role: (profile.data.role as Role) || 'client',
        email: session.user.email || '',
      }
    }
  }
  const settings = rows(settingsRows, true)[0] as Record<string, unknown> | undefined
  return {
    ...base,
    packages: packages.map((row) => ({
      id: String(row.id),
      slug: String(row.slug || row.id),
      brand: row.brand,
      name: row.name,
      summary: row.summary || '',
      priceMin: Number(row.price_min),
      priceMax: Number(row.price_max),
      fixed: Boolean(row.fixed),
      revisions: Number(row.revisions || 2),
      active: row.active !== false,
    })),
    clients: rows(clients, true).map(mapClient),
    workers: rows(workers, true).map(mapWorker),
    orders: rows(orders, true).map(mapOrder),
    events: rows(events, true).map((row) => ({ id: String(row.id), orderId: String(row.order_id), stage: row.stage, note: row.note || '', actor: row.actor || '', at: row.created_at })),
    checks: rows(checks, true).map((row) => ({ id: String(row.id), orderId: String(row.order_id), stage: row.stage, sop: row.sop, label: row.label, done: Boolean(row.done) })),
    invoices: rows(invoices, true).map((row) => ({ id: String(row.id), orderId: String(row.order_id), kind: row.kind, number: row.number, amount: Number(row.amount), status: row.status, dueDate: row.due_date || '', issuedAt: row.issued_at })),
    payments: rows(payments, true).map((row) => ({ id: String(row.id), invoiceId: String(row.invoice_id || ''), orderId: String(row.order_id), amount: Number(row.amount), status: row.status, proofName: row.proof_name || '', note: row.note || '', paidAt: row.paid_at, verifiedAt: row.verified_at })),
    splits: rows(splits, true).map((row) => ({
      id: String(row.id), orderId: String(row.order_id), phase: row.phase, gross: Number(row.gross), referral: Number(row.referral), base: Number(row.base),
      worker: Number(row.worker_amount), cash: Number(row.cash_amount), ops: Number(row.ops_amount), profit: Number(row.profit_amount),
      ownerProfit: Number(row.owner_profit), partnerProfit: Number(row.partner_profit), workerName: row.worker_name || '', at: row.created_at,
    })),
    expenses: rows(expenses, true).map((row) => ({ id: String(row.id), date: row.spent_on, category: row.category, amount: Number(row.amount), memo: row.memo || '', sample: Boolean(row.sample) })),
    templates: rows(templates, true).map((row) => ({ key: row.key, name: row.name, prefix: row.prefix || '', body: row.body })),
    contracts: rows(contracts, true).map((row) => ({
      id: String(row.id), orderId: row.order_id ? String(row.order_id) : null, templateKey: row.template_key, number: row.number || '', title: row.title || '',
      body: row.body || '', status: row.status, signerName: row.signer_name || '', signedAt: row.signed_at, ip: row.ip || '', userAgent: row.user_agent || '',
      otpHint: row.otp_hint || null, attempts: Number(row.attempts || 0), sample: Boolean(row.sample),
    })),
    portfolio: rows(portfolio, true).map((row) => ({ id: String(row.id), brand: row.brand, title: row.title, caption: row.caption || '', published: Boolean(row.published), sample: Boolean(row.sample) })),
    testimonials: rows(testimonials, true).map((row) => ({ id: String(row.id), name: row.name, role: row.role || '', quote: row.quote, stars: Number(row.stars || 5), published: Boolean(row.published), sample: Boolean(row.sample) })),
    audit: rows(audit, true).map((row) => ({ id: String(row.id), actor: row.actor_name || '', action: row.action, entity: row.entity, detail: row.detail || '', at: row.created_at })),
    notices: rows(notices, true).map((row) => ({ id: String(row.id), title: row.title, body: row.body || '', href: row.href || '', read: Boolean(row.read), at: row.created_at, forRole: row.for_role || 'semua' })),
    rules: rows(rules, true).map((row) => ({ key: row.key, title: row.title, detail: row.detail || '', message: row.message || '', enabled: Boolean(row.enabled), group: row.group_name || 'pemberitahuan' })),
    settings: settings?.payload && typeof settings.payload === 'object' ? { ...defaultSettings(), ...(settings.payload as AppState['settings']) } : base.settings,
    settlements: rows(settlements, true).map((row) => ({ id: String(row.id), period: row.period, status: row.status, note: row.note || '', approvedAt: row.approved_at })),
    outbox: rows(outbox, true).map((row) => ({ id: String(row.id), channel: row.channel, to: row.to_address || '', body: row.body || '', href: row.href || '', status: row.status, at: row.created_at })),
    session: user,
  }
}

function mapClient(row: Record<string, unknown>): Client {
  const studentStatus: Client['studentStatus'] = row.student_status === 'rpl' ? 'rpl' : row.student_status === 'reguler' ? 'reguler' : ''
  return {
    id: String(row.id), name: String(row.name || ''), whatsapp: String(row.whatsapp || ''), email: String(row.email || ''), address: String(row.address || ''),
    institution: String(row.institution || ''), studentStatus, notes: String(row.notes || ''), sample: Boolean(row.sample),
  }
}

function mapWorker(row: Record<string, unknown>) {
  return {
    id: String(row.id), profileId: row.profile_id ? String(row.profile_id) : null, name: String(row.name || ''), whatsapp: String(row.whatsapp || ''), title: String(row.title || ''),
    brand: (String(row.brand || 'semua') as 'studio' | 'edukasi' | 'tech' | 'semua'), active: row.active !== false, sample: Boolean(row.sample),
  }
}

function mapOrder(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    code: String(row.code || ''),
    clientId: String(row.client_id || ''),
    packageId: String(row.package_id || ''),
    brand: row.brand as 'studio' | 'edukasi' | 'tech',
    title: String(row.title || ''),
    brief: String(row.brief || ''),
    stage: row.stage as AppState['orders'][number]['stage'],
    price: Number(row.price || 0),
    dpPercent: Number(row.dp_percent || 50),
    dueDate: String(row.due_date || ''),
    assigneeId: String(row.assignee_id || ''),
    referrer: String(row.referrer || ''),
    revisionCount: Number(row.revision_count || 0),
    revisionLimit: Number(row.revision_limit || 2),
    studentStatus: String(row.student_status || ''),
    campus: String(row.campus || ''),
    scriptType: String(row.script_type || ''),
    startedAt: (row.started_at as string) || null,
    warrantyUntil: (row.warranty_until as string) || null,
    offerExpires: (row.offer_expires as string) || null,
    createdAt: String(row.created_at || new Date().toISOString()),
    sample: Boolean(row.sample),
    files: Array.isArray(row.files) ? row.files as AppState['orders'][number]['files'] : [],
  }
}

export async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase tidak diatur')
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}
