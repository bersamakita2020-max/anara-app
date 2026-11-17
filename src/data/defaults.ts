import type { AppState, Settings } from '../types'

export function defaultSettings(): Settings {
  return {
    phase: 3,
    phaseAuto: true,
    splits: { 1: [40, 30, 15, 15], 2: [45, 15, 15, 25], 3: [50, 10, 15, 25] },
    bankName: '',
    bankNumber: '',
    bankHolder: '',
    emergencyRate: 0.2,
    emergencyCap: 5_000_000,
    toolsThreshold: 2_000_000,
    recruitRevenue: 12_000_000,
    recruitMonths: 3,
    recruitCash: 15_000_000,
    ownerShare: 60,
    partnerShare: 40,
    honor: { 1: 300_000, 2: 500_000, 3: 750_000 },
    waDisplay: '0858-1169-9699',
    waLink: 'https://wa.me/6285811699699',
    address: 'Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat',
    ownerName: 'M. Wilda Alfiansyah, A.Md.Kes.',
    partnerName: 'M. Fadilah Alkadri',
  }
}

export function emptyState(): AppState {
  return {
    packages: [],
    clients: [],
    workers: [],
    orders: [],
    events: [],
    checks: [],
    invoices: [],
    payments: [],
    splits: [],
    expenses: [],
    templates: [],
    contracts: [],
    portfolio: [],
    testimonials: [],
    audit: [],
    notices: [],
    rules: [],
    settings: defaultSettings(),
    settlements: [],
    outbox: [],
    options: [],
    invoiceLines: [],
    payslips: [],
    waSettings: { provider: 'none', phoneNumberId: '', wabaId: '', displayPhone: '0858-1169-9699', cloudReady: false, fonnteReady: false },
    waLog: [],
    paySettings: { provider: 'manual', sandbox: true, qrisDynamic: true, vaEnabled: false, bankName: '', bankNumber: '', bankHolder: '', qrisPath: '', tripayMerchant: '', duitkuMerchant: '' },
    session: null,
  }
}
