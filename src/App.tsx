import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loading } from './components/chrome'
import { AnaraProvider, useAnara } from './data/store'

const HomePage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.HomePage })))
const PackagePage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.PackagePage })))
const OrderPage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.OrderPage })))
const TrackPage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.TrackPage })))
const SignPage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.SignPage })))
const TermsPage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.TermsPage })))
const LoginPage = lazy(() => import('./pages/public').then((mod) => ({ default: mod.LoginPage })))
const InvoicePage = lazy(() => import('./pages/dokumen').then((mod) => ({ default: mod.InvoicePage })))
const VerifyPage = lazy(() => import('./pages/dokumen').then((mod) => ({ default: mod.VerifyPage })))
const DashboardPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.DashboardPage })))
const OrdersPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.OrdersPage })))
const OrderDetailPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.OrderDetailPage })))
const PeoplePage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.PeoplePage })))
const ClientDetailPage = lazy(() => import('./pages/klien').then((mod) => ({ default: mod.ClientDetailPage })))
const LayananPage = lazy(() => import('./pages/layanan').then((mod) => ({ default: mod.LayananPage })))
const PaymentsPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.PaymentsPage })))
const FinancePage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.FinancePage })))
const ContractPage = lazy(() => import('./pages/kontrak').then((mod) => ({ default: mod.ContractPage })))
const TagihanPage = lazy(() => import('./pages/tagihan').then((mod) => ({ default: mod.TagihanPage })))
const SlipPage = lazy(() => import('./pages/slip').then((mod) => ({ default: mod.SlipPage })))
const BayarPage = lazy(() => import('./pages/bayar').then((mod) => ({ default: mod.BayarPage })))
const WhatsappPage = lazy(() => import('./pages/whatsapp').then((mod) => ({ default: mod.WhatsappPage })))
const MonitorPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.MonitorPage })))
const ReportPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.ReportPage })))
const AutomationPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.AutomationPage })))
const PortfolioAdminPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.PortfolioAdminPage })))
const SettingsPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.SettingsPage })))
const AuditPage = lazy(() => import('./pages/internal').then((mod) => ({ default: mod.AuditPage })))

const queryClient = new QueryClient()

function Gate({ children }: { children: React.ReactNode }) {
  const { ready } = useAnara()
  if (!ready) return <Loading />
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnaraProvider>
        <BrowserRouter basename="/anara-app">
          <Gate>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/paket/:slug" element={<PackagePage />} />
              <Route path="/pesan" element={<OrderPage />} />
              <Route path="/lacak" element={<TrackPage />} />
              <Route path="/setujui/:id" element={<SignPage />} />
              <Route path="/invoice/:id" element={<InvoicePage />} />
              <Route path="/verifikasi/:token" element={<VerifyPage />} />
              <Route path="/syarat" element={<TermsPage />} />
              <Route path="/masuk" element={<LoginPage />} />
              <Route path="/app" element={<DashboardPage />} />
              <Route path="/app/order" element={<OrdersPage />} />
              <Route path="/app/order/:id" element={<OrderDetailPage />} />
              <Route path="/app/klien" element={<PeoplePage kind="klien" />} />
              <Route path="/app/klien/:id" element={<ClientDetailPage />} />
              <Route path="/app/layanan" element={<LayananPage />} />
              <Route path="/app/pekerja" element={<PeoplePage kind="pekerja" />} />
              <Route path="/app/tagihan" element={<TagihanPage />} />
              <Route path="/app/slip" element={<SlipPage />} />
              <Route path="/app/bayar" element={<BayarPage />} />
              <Route path="/app/whatsapp" element={<WhatsappPage />} />
              <Route path="/app/pembayaran" element={<PaymentsPage />} />
              <Route path="/app/keuangan" element={<FinancePage />} />
              <Route path="/app/kontrak" element={<ContractPage />} />
              <Route path="/app/monitoring" element={<MonitorPage />} />
              <Route path="/app/laporan" element={<ReportPage />} />
              <Route path="/app/automasi" element={<AutomationPage />} />
              <Route path="/app/portofolio" element={<PortfolioAdminPage />} />
              <Route path="/app/pengaturan" element={<SettingsPage />} />
              <Route path="/app/audit" element={<AuditPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Gate>
        </BrowserRouter>
      </AnaraProvider>
    </QueryClientProvider>
  )
}
