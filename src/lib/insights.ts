import { absorbExpense, emergencyLock, phaseForDate, recruitmentOpen, TARGET_MIN_MONTHS, TARGET_MIN_ORDERS, TARGET_MIN_REVENUE, TARGET_OPT_MONTHS, TARGET_OPT_ORDERS, TARGET_OPT_REVENUE } from './finance'
import { addDays, businessDaysBetween, dueTone, todayISO } from './format'
import type { AppState, Brand, Order, Role } from '../types'

export function visibleOrders(state: AppState): Order[] {
  const role = state.session?.role
  if (!role) return []
  if (role === 'worker') {
    const worker = state.workers.find((item) => item.profileId === state.session?.id)
    return state.orders.filter((item) => item.assigneeId === worker?.id)
  }
  if (role === 'social') return []
  return state.orders
}

export function canSeeFinance(role?: Role | null): boolean {
  return role === 'owner' || role === 'finance'
}

export interface MoneySnapshot {
  revenueMonth: number
  cash: number
  ops: number
  locked: number
  available: number
  toolsOpen: boolean
  recruitOpen: boolean
  monthRevenue: number[]
  ownerProfit: number
  partnerProfit: number
  referral: number
  workerPay: number
  honor: number
}

export function moneySnapshot(state: AppState, now = new Date()): MoneySnapshot {
  const month = todayISO(now).slice(0, 7)
  const revenueMonth = state.splits.filter((item) => item.at.slice(0, 7) === month).reduce((sum, item) => sum + item.gross, 0)
  const cashIn = state.splits.reduce((sum, item) => sum + item.cash, 0)
  const opsIn = state.splits.reduce((sum, item) => sum + item.ops, 0)
  const expenseTotal = state.expenses.reduce((sum, item) => sum + item.amount, 0)
  const absorbed = absorbExpense(opsIn, cashIn, expenseTotal)
  const locked = emergencyLock(absorbed.cash, state.settings.emergencyRate, state.settings.emergencyCap)
  const months: number[] = []
  for (let index = 2; index >= 0; index -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    months.push(state.splits.filter((item) => item.at.slice(0, 7) === key).reduce((sum, item) => sum + item.gross, 0))
  }
  return {
    revenueMonth,
    cash: absorbed.cash,
    ops: absorbed.ops,
    locked,
    available: absorbed.cash - locked,
    toolsOpen: absorbed.cash > state.settings.toolsThreshold,
    recruitOpen: recruitmentOpen(months, absorbed.cash, state.settings.recruitRevenue, state.settings.recruitMonths, state.settings.recruitCash),
    monthRevenue: months,
    ownerProfit: state.splits.reduce((sum, item) => sum + item.ownerProfit, 0),
    partnerProfit: state.splits.reduce((sum, item) => sum + item.partnerProfit, 0),
    referral: state.splits.reduce((sum, item) => sum + item.referral, 0),
    workerPay: state.splits.reduce((sum, item) => sum + item.worker, 0),
    honor: state.settings.honor[state.settings.phaseAuto ? phaseForDate(todayISO(now)) : state.settings.phase],
  }
}

export interface AlertItem {
  tone: 'danger' | 'watch' | 'good'
  title: string
  detail: string
  href: string
}

export function buildAlerts(state: AppState, now = new Date()): AlertItem[] {
  const today = todayISO(now)
  const source = state.session && state.session.role !== 'social' ? visibleOrders(state) : state.orders
  const list: AlertItem[] = []
  for (const order of source) {
    if (order.stage === 'selesai' || order.stage === 'batal') continue
    const tone = dueTone(order.dueDate, today)
    if (tone === 'late') list.push({ tone: 'danger', title: `Terlambat · ${order.code}`, detail: order.title, href: `#/app/order/${order.id}` })
    else if (tone === 'soon') list.push({ tone: 'watch', title: `Hampir jatuh tempo · ${order.code}`, detail: order.title, href: `#/app/order/${order.id}` })
    const dp = state.invoices.find((item) => item.orderId === order.id && item.kind === 'dp' && item.status !== 'lunas' && item.status !== 'batal')
    if (dp) {
      const age = businessDaysBetween(dp.issuedAt, now.toISOString())
      if (age >= 2) list.push({ tone: age >= 5 ? 'danger' : 'watch', title: `DP belum masuk · ${order.code}`, detail: `Tagihan berjalan ${age} hari kerja. Kerja belum dimulai.`, href: '#/app/pembayaran' })
    }
    const fin = state.invoices.find((item) => item.orderId === order.id && item.kind === 'pelunasan' && item.status !== 'lunas' && item.status !== 'batal')
    if (fin) {
      const age = businessDaysBetween(fin.issuedAt, now.toISOString())
      if (age >= 3) list.push({ tone: age >= 7 ? 'danger' : 'watch', title: `Pelunasan tertunda · ${order.code}`, detail: age >= 7 ? 'Lewat 7 hari. Kerja dihentikan sementara.' : 'Pengingat H+3.', href: '#/app/pembayaran' })
    }
    if (order.stage === 'revisi') {
      const last = state.events.filter((item) => item.orderId === order.id && item.stage === 'revisi').at(-1)
      if (last && businessDaysBetween(last.at, now.toISOString()) >= 5) {
        list.push({ tone: 'watch', title: `Revisi menunggu · ${order.code}`, detail: 'Lima hari kerja tanpa masukan.', href: `#/app/order/${order.id}` })
      }
    }
    if (order.warrantyUntil && order.warrantyUntil >= today && order.warrantyUntil <= addDays(today, 7)) {
      list.push({ tone: 'watch', title: `Garansi Tech · ${order.code}`, detail: `Berlaku sampai ${order.warrantyUntil}`, href: `#/app/order/${order.id}` })
    }
  }
  const money = moneySnapshot(state, now)
  if (!money.recruitOpen) list.push({ tone: 'good', title: 'Rekrutmen terkunci', detail: 'Omzet 3 bulan berturut dan kas belum sama-sama memenuhi ambang.', href: '#/app/pengaturan' })
  else list.push({ tone: 'watch', title: 'Ambang rekrutmen terpenuhi', detail: 'Lowongan boleh dibuka oleh pemilik. Sistem tidak membuka lowongan sendiri.', href: '#/app/pekerja' })
  if (money.toolsOpen) list.push({ tone: 'good', title: 'Kas melewati ambang tools', detail: 'Belanja tools di atas kuota dapat diajukan.', href: '#/app/keuangan' })
  list.push({ tone: 'good', title: 'Dana darurat', detail: `Terkunci ${money.locked.toLocaleString('id-ID')} dari kas.`, href: '#/app/keuangan' })
  return list
}

export interface ReportFilter {
  from: string
  to: string
  brand: Brand | 'semua'
  packageId: string
  workerId: string
  clientId: string
}

export function defaultFilter(now = new Date()): ReportFilter {
  const today = todayISO(now)
  return { from: today.slice(0, 8) + '01', to: today, brand: 'semua', packageId: 'semua', workerId: 'semua', clientId: 'semua' }
}

export function buildReport(state: AppState, filter: ReportFilter) {
  const inRange = (iso?: string | null) => Boolean(iso && iso.slice(0, 10) >= filter.from && iso.slice(0, 10) <= filter.to)
  const orders = state.orders.filter((order) => {
    if (!inRange(order.createdAt) && !state.splits.some((split) => split.orderId === order.id && inRange(split.at))) return false
    if (filter.brand !== 'semua' && order.brand !== filter.brand) return false
    if (filter.packageId !== 'semua' && order.packageId !== filter.packageId) return false
    if (filter.workerId !== 'semua' && order.assigneeId !== filter.workerId) return false
    if (filter.clientId !== 'semua' && order.clientId !== filter.clientId) return false
    return true
  })
  const ids = new Set(orders.map((order) => order.id))
  const splits = state.splits.filter((item) => ids.has(item.orderId) && inRange(item.at))
  const expenses = state.expenses.filter((item) => inRange(item.date))
  const revenue = splits.reduce((sum, item) => sum + item.gross, 0)
  const monthNumber = filter.from.slice(5, 7)
  const minMonth = TARGET_MIN_MONTHS.find((item) => item.key.endsWith('-' + monthNumber))
  const optMonth = TARGET_OPT_MONTHS.find((item) => item.key.endsWith('-' + monthNumber))
  const group = (keyer: (order: Order) => string) => {
    const map = new Map<string, { name: string; count: number; revenue: number }>()
    for (const order of orders) {
      const key = keyer(order)
      const current = map.get(key) || { name: key, count: 0, revenue: 0 }
      current.count += 1
      current.revenue += splits.find((item) => item.orderId === order.id)?.gross || 0
      map.set(key, current)
    }
    return [...map.values()]
  }
  return {
    orders,
    splits,
    expenses,
    revenue,
    count: orders.length,
    paidCount: orders.filter((order) => order.stage === 'selesai' || order.stage === 'serah_terima').length,
    referral: splits.reduce((sum, item) => sum + item.referral, 0),
    worker: splits.reduce((sum, item) => sum + item.worker, 0),
    cash: splits.reduce((sum, item) => sum + item.cash, 0),
    ops: splits.reduce((sum, item) => sum + item.ops, 0),
    profit: splits.reduce((sum, item) => sum + item.profit, 0),
    ownerProfit: splits.reduce((sum, item) => sum + item.ownerProfit, 0),
    partnerProfit: splits.reduce((sum, item) => sum + item.partnerProfit, 0),
    expenseTotal: expenses.reduce((sum, item) => sum + item.amount, 0),
    byBrand: group((order) => order.brand),
    byPackage: group((order) => state.packages.find((item) => item.id === order.packageId)?.name || order.title),
    byWorker: group((order) => state.workers.find((item) => item.id === order.assigneeId)?.name || '—'),
    byClient: group((order) => state.clients.find((item) => item.id === order.clientId)?.name || '—'),
    receivables: state.invoices.filter((invoice) => invoice.status !== 'lunas' && invoice.status !== 'batal' && ids.has(invoice.orderId)),
    minMonth,
    optMonth,
    yearMinOrders: TARGET_MIN_ORDERS,
    yearMinRevenue: TARGET_MIN_REVENUE,
    yearOptOrders: TARGET_OPT_ORDERS,
    yearOptRevenue: TARGET_OPT_REVENUE,
  }
}

export function slaByStage(state: AppState): { stage: string; days: number; n: number }[] {
  const stages = ['masuk_brief', 'penawaran', 'kontrak', 'menunggu_dp', 'pengerjaan', 'revisi', 'menunggu_pelunasan', 'serah_terima']
  return stages.map((stage) => {
    const samples: number[] = []
    for (const order of state.orders) {
      const mine = state.events.filter((item) => item.orderId === order.id).sort((a, b) => a.at.localeCompare(b.at))
      const start = mine.find((item) => item.stage === stage)
      if (!start) continue
      const later = mine.find((item) => item.at > start.at)
      const end = later?.at || (order.stage === stage ? new Date().toISOString() : '')
      if (!end) continue
      samples.push((new Date(end).getTime() - new Date(start.at).getTime()) / 86400000)
    }
    const avg = samples.length ? samples.reduce((sum, item) => sum + item, 0) / samples.length : 0
    return { stage, days: Math.round(avg * 10) / 10, n: samples.length }
  })
}
