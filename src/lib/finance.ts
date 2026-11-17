import type { Phase } from '../types'

export interface PhaseRatio {
  worker: number
  cash: number
  ops: number
  profit: number
}

export const DEFAULT_RATIOS: Record<Phase, PhaseRatio> = {
  1: { worker: 40, cash: 30, ops: 15, profit: 15 },
  2: { worker: 45, cash: 15, ops: 15, profit: 25 },
  3: { worker: 50, cash: 10, ops: 15, profit: 25 },
}

export function phaseForMonth(month: number): Phase {
  if (month >= 1 && month <= 4) return 1
  if (month >= 5 && month <= 9) return 2
  return 3
}

export function phaseForDate(iso: string): Phase {
  const month = Number(iso.slice(5, 7))
  return phaseForMonth(month)
}

export interface SplitResult {
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
}

export function splitAmount(
  gross: number,
  phase: Phase,
  hasReferral: boolean,
  ratios: Record<Phase, PhaseRatio> = DEFAULT_RATIOS,
  ownerShare = 60,
): SplitResult {
  const safeGross = Math.max(0, Math.round(gross))
  const referral = hasReferral ? Math.round(safeGross * 0.05) : 0
  const base = safeGross - referral
  const ratio = ratios[phase]
  const worker = Math.round((base * ratio.worker) / 100)
  const ops = Math.round((base * ratio.ops) / 100)
  const profit = Math.round((base * ratio.profit) / 100)
  const cash = base - worker - ops - profit
  const ownerProfit = Math.round((profit * ownerShare) / 100)
  const partnerProfit = profit - ownerProfit
  return { phase, gross: safeGross, referral, base, worker, cash, ops, profit, ownerProfit, partnerProfit }
}

export function emergencyLock(cashBalance: number, rate = 0.2, cap = 5_000_000): number {
  if (cashBalance <= 0) return 0
  return Math.min(cap, Math.round(cashBalance * rate))
}

export function absorbExpense(opsIn: number, cashIn: number, amount: number): { ops: number; cash: number } {
  const fromOps = Math.min(Math.max(opsIn, 0), Math.max(0, amount))
  const rest = Math.max(0, amount) - fromOps
  return { ops: opsIn - fromOps, cash: cashIn - rest }
}

export function recruitmentOpen(
  monthlyRevenue: number[],
  cash: number,
  revenueMin = 12_000_000,
  months = 3,
  cashMin = 15_000_000,
): boolean {
  if (monthlyRevenue.length < months) return false
  const last = monthlyRevenue.slice(-months)
  return last.every((value) => value >= revenueMin) && cash >= cashMin
}

export const HONOR: Record<Phase, number> = { 1: 300_000, 2: 500_000, 3: 750_000 }

export interface MonthTarget {
  key: string
  label: string
  phase: Phase
  edu: number
  studio: number
  tech: number
  revenue: number
}

export const TARGET_MIN_ORDERS = 109
export const TARGET_MIN_REVENUE = 77_550_000
export const TARGET_OPT_ORDERS = 163
export const TARGET_OPT_REVENUE = 141_300_000

export const TARGET_MIN_MONTHS: MonthTarget[] = [
  { key: '2027-01', label: 'Jan', phase: 1, edu: 2, studio: 2, tech: 0, revenue: 2_300_000 },
  { key: '2027-02', label: 'Feb', phase: 1, edu: 3, studio: 2, tech: 0, revenue: 3_000_000 },
  { key: '2027-03', label: 'Mar', phase: 1, edu: 3, studio: 3, tech: 1, revenue: 5_450_000 },
  { key: '2027-04', label: 'Apr', phase: 1, edu: 4, studio: 3, tech: 0, revenue: 4_150_000 },
  { key: '2027-05', label: 'Mei', phase: 2, edu: 4, studio: 3, tech: 1, revenue: 6_150_000 },
  { key: '2027-06', label: 'Jun', phase: 2, edu: 5, studio: 4, tech: 1, revenue: 7_300_000 },
  { key: '2027-07', label: 'Jul', phase: 2, edu: 5, studio: 4, tech: 1, revenue: 7_300_000 },
  { key: '2027-08', label: 'Agu', phase: 2, edu: 6, studio: 5, tech: 1, revenue: 8_450_000 },
  { key: '2027-09', label: 'Sep', phase: 2, edu: 6, studio: 4, tech: 1, revenue: 8_000_000 },
  { key: '2027-10', label: 'Okt', phase: 3, edu: 5, studio: 5, tech: 1, revenue: 7_750_000 },
  { key: '2027-11', label: 'Nov', phase: 3, edu: 5, studio: 6, tech: 1, revenue: 8_200_000 },
  { key: '2027-12', label: 'Des', phase: 3, edu: 4, studio: 6, tech: 2, revenue: 9_500_000 },
]

export const TARGET_OPT_MONTHS: MonthTarget[] = [
  { key: '2027-01', label: 'Jan', phase: 1, edu: 3, studio: 3, tech: 0, revenue: 4_050_000 },
  { key: '2027-02', label: 'Feb', phase: 1, edu: 4, studio: 4, tech: 1, revenue: 7_900_000 },
  { key: '2027-03', label: 'Mar', phase: 1, edu: 5, studio: 4, tech: 1, revenue: 8_700_000 },
  { key: '2027-04', label: 'Apr', phase: 1, edu: 6, studio: 5, tech: 1, revenue: 10_050_000 },
  { key: '2027-05', label: 'Mei', phase: 2, edu: 6, studio: 6, tech: 1, revenue: 10_600_000 },
  { key: '2027-06', label: 'Jun', phase: 2, edu: 7, studio: 6, tech: 2, revenue: 13_900_000 },
  { key: '2027-07', label: 'Jul', phase: 2, edu: 7, studio: 6, tech: 1, revenue: 11_400_000 },
  { key: '2027-08', label: 'Agu', phase: 2, edu: 8, studio: 7, tech: 2, revenue: 15_250_000 },
  { key: '2027-09', label: 'Sep', phase: 2, edu: 8, studio: 7, tech: 2, revenue: 15_250_000 },
  { key: '2027-10', label: 'Okt', phase: 3, edu: 7, studio: 8, tech: 2, revenue: 15_000_000 },
  { key: '2027-11', label: 'Nov', phase: 3, edu: 7, studio: 8, tech: 2, revenue: 15_000_000 },
  { key: '2027-12', label: 'Des', phase: 3, edu: 6, studio: 8, tech: 2, revenue: 14_200_000 },
]
