import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/chrome'
import { useAnara } from '../data/store'
import { phoneKey, rupiah, tanggal } from '../lib/format'
import { STAGE_LABEL } from '../lib/sop'

export function ClientDetailPage() {
  const { id } = useParams()
  const { state } = useAnara()
  const client = state.clients.find((item) => item.id === id)
  if (!client) {
    return <AppShell><h1>Klien tidak ditemukan</h1><Link to="/app/klien">Kembali</Link></AppShell>
  }
  const key = phoneKey(client.whatsapp)
  const same = state.clients.filter((item) => (key && phoneKey(item.whatsapp) === key) || (client.email && item.email && item.email === client.email))
  const ids = new Set(same.map((item) => item.id))
  const orders = state.orders.filter((item) => ids.has(item.clientId))
  const paid = state.payments.filter((item) => orders.some((order) => order.id === item.orderId) && item.status === 'terverifikasi').reduce((sum, item) => sum + item.amount, 0)
  return (
    <AppShell>
      <p><Link to="/app/klien">Semua klien</Link></p>
      <h1>{client.name}</h1>
      <p style={{ color: 'var(--muted)' }}>{client.whatsapp} {client.email ? `· ${client.email}` : ''} {client.institution ? `· ${client.institution}` : ''}</p>
      <div className="kpis">
        <div className="kpi v"><div className="l">Pesanan</div><div className="n">{orders.length}</div></div>
        <div className="kpi e"><div className="l">Pembayaran masuk</div><div className="n">{rupiah(paid)}</div></div>
        <div className="kpi t"><div className="l">Nilai pesanan</div><div className="n">{rupiah(orders.reduce((sum, item) => sum + item.price, 0))}</div></div>
      </div>
      <div className="card table-wrap">
        <h3>Riwayat pesanan</h3>
        {orders.length === 0 ? <p className="empty">Belum ada order.</p> : null}
        <table className="data">
          <thead><tr><th>Order</th><th>Status</th><th>Bayar</th><th>Kontrak</th><th>Tagihan</th></tr></thead>
          <tbody>
            {orders.map((order) => {
              const pay = state.payments.filter((item) => item.orderId === order.id && item.status === 'terverifikasi').reduce((sum, item) => sum + item.amount, 0)
              const contract = state.contracts.find((item) => item.orderId === order.id)
              const invoices = state.invoices.filter((item) => item.orderId === order.id)
              return (
                <tr key={order.id}>
                  <td><Link to={`/app/order/${order.id}`}>{order.code}</Link><br />{order.title}<br />{tanggal(order.createdAt)}</td>
                  <td>{STAGE_LABEL[order.stage]}</td>
                  <td>{rupiah(pay)} / {rupiah(order.price)}</td>
                  <td>{contract ? <Link to={`/setujui/${contract.id}`}>{contract.number || contract.status}</Link> : '—'}</td>
                  <td>{invoices.map((item) => <div key={item.id}><Link to={`/invoice/${item.id}`}>{item.number}</Link> · {item.status}</div>)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
