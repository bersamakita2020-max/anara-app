import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loading } from './components/chrome'
import { AnaraProvider, useAnara } from './data/store'
import {
  AuditPage,
  AutomationPage,
  ContractPage,
  DashboardPage,
  FinancePage,
  MonitorPage,
  OrderDetailPage,
  OrdersPage,
  PaymentsPage,
  PeoplePage,
  PortfolioAdminPage,
  ReportPage,
  SettingsPage,
} from './pages/internal'
import { HomePage, LoginPage, OrderPage, PackagePage, SignPage, TermsPage, TrackPage } from './pages/public'

function Gate({ children }: { children: React.ReactNode }) {
  const { ready } = useAnara()
  if (!ready) return <Loading />
  return children
}

export default function App() {
  return (
    <AnaraProvider>
      <BrowserRouter basename="/anara-app">
        <Gate>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/paket/:slug" element={<PackagePage />} />
            <Route path="/pesan" element={<OrderPage />} />
            <Route path="/lacak" element={<TrackPage />} />
            <Route path="/setujui/:id" element={<SignPage />} />
            <Route path="/syarat" element={<TermsPage />} />
            <Route path="/masuk" element={<LoginPage />} />
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/app/order" element={<OrdersPage />} />
            <Route path="/app/order/:id" element={<OrderDetailPage />} />
            <Route path="/app/klien" element={<PeoplePage kind="klien" />} />
            <Route path="/app/pekerja" element={<PeoplePage kind="pekerja" />} />
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
  )
}
