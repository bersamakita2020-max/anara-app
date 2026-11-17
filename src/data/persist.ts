import { contractTitle, contractVars, fillTemplate, nextSerial } from '../lib/contracts'
import { moneySnapshot } from '../lib/insights'
import { supabase } from '../lib/supabase'
import { STAGE_LABEL } from '../lib/sop'
import { todayISO, waHref } from '../lib/format'
import type { Stage } from '../types'
import { deny, type Action, type ApplyResult } from './actions'
import type { AppState } from '../types'

function db() {
  if (!supabase) throw new Error('Server belum dikonfigurasi.')
  return supabase
}

function pesan(error: { message: string } | null): string | null {
  if (!error) return null
  const text = error.message
  if (text.includes('JWT') || text.includes('permission') || text.includes('row-level')) return 'Akses ditolak. Masuk dengan peran yang sesuai.'
  return text
}

async function catat(actor: string, action: string, entity: string, detail: string) {
  const client = db()
  await client.from('audit_log').insert({ actor_name: actor, action, entity, detail })
}

export async function persist(state: AppState, action: Action): Promise<ApplyResult> {
  try {
    return await run(state, action)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Gagal menyimpan.' }
  }
}

async function run(state: AppState, action: Action): Promise<ApplyResult> {
  const client = db()
  const actor = state.session?.name || 'Sistem'

  switch (action.type) {
    case 'logout':
      return {}
    case 'create-order': {
      const { data, error } = await client.rpc('create_public_order', { payload: action.input })
      const fail = pesan(error)
      if (fail) return { error: fail }
      const row = data as { code: string; contractId: string; number: string }
      return { info: `Pesanan ${row.code} tercatat.|${row.contractId}|${row.code}|` }
    }
    case 'sign': {
      if (!action.agree) return { error: 'Centang persetujuan terlebih dahulu.' }
      if (action.name.trim().length < 3) return { error: 'Tuliskan nama terang.' }
      const { data, error } = await client.rpc('sign_contract', {
        p_contract_id: action.contractId,
        p_name: action.name.trim(),
        p_otp: action.otp.trim(),
        p_agree: action.agree,
        p_ip: action.ip,
        p_ua: action.userAgent,
      })
      const fail = pesan(error)
      if (fail) return { error: fail }
      const ok = (data as { ok?: boolean } | null)?.ok
      return { info: ok ? 'Kontrak disetujui. Tagihan uang muka terbit.' : 'Kontrak diproses.' }
    }
    case 'move-stage': {
      const denied = deny(state, ['owner', 'finance', 'worker'])
      if (denied) return { error: denied }
      const order = state.orders.find((item) => item.id === action.orderId)
      if (!order) return { error: 'Order tidak ditemukan.' }
      if (state.session?.role === 'worker' && !['pengerjaan', 'revisi', 'serah_terima'].includes(action.stage)) {
        return { error: 'Pekerja hanya menggeser tahap pengerjaan.' }
      }
      const current = state.checks.filter((item) => item.orderId === order.id && item.stage === order.stage)
      if (current.length && !current.every((item) => item.done) && !(action.override && state.session?.role === 'owner')) {
        return { error: 'Checklist SOP tahap ini belum lengkap.' }
      }
      const patch: Record<string, unknown> = { stage: action.stage }
      if (action.stage === 'pengerjaan' && !order.startedAt) patch.started_at = new Date().toISOString()
      const updated = await client.from('orders').update(patch).eq('id', order.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      await client.from('order_events').insert({ order_id: order.id, stage: action.stage, note: `Masuk tahap ${STAGE_LABEL[action.stage]}.`, actor })
      if (action.stage === 'menunggu_pelunasan' && !state.invoices.some((item) => item.orderId === order.id && item.kind === 'pelunasan')) {
        const paid = state.payments.filter((item) => item.orderId === order.id && item.status === 'terverifikasi').reduce((sum, item) => sum + item.amount, 0)
        await client.from('invoices').insert({
          order_id: order.id,
          kind: 'pelunasan',
          number: nextSerial('INV/LUN', state.invoices.map((item) => item.number)),
          amount: Math.max(order.price - paid, 0),
          status: 'terbit',
          due_date: todayISO(),
        })
      }
      await catat(actor, 'tahap', 'order', `${order.code} → ${STAGE_LABEL[action.stage as Stage]}`)
      return { info: `Tahap menjadi ${STAGE_LABEL[action.stage]}.` }
    }
    case 'toggle-check': {
      const denied = deny(state, ['owner', 'finance', 'worker'])
      if (denied) return { error: denied }
      const check = state.checks.find((item) => item.id === action.checkId)
      if (!check) return { error: 'Checklist tidak ditemukan.' }
      const updated = await client.from('sop_checks').update({ done: !check.done }).eq('id', check.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return {}
    }
    case 'assign': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const updated = await client.from('orders').update({ assignee_id: action.workerId }).eq('id', action.orderId)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      await catat(actor, 'tugaskan', 'order', action.orderId)
      return { info: 'Penugasan disimpan.' }
    }
    case 'set-price': {
      const denied = deny(state, ['owner'])
      if (denied) return { error: denied }
      if (action.price <= 0) return { error: 'Harga tidak valid.' }
      const updated = await client.from('orders').update({ price: action.price, dp_percent: action.price >= 3_000_000 ? 70 : 50 }).eq('id', action.orderId)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Nilai order dikunci.' }
    }
    case 'add-revision': {
      const denied = deny(state, ['owner', 'finance', 'worker'])
      if (denied) return { error: denied }
      const order = state.orders.find((item) => item.id === action.orderId)
      if (!order) return { error: 'Order tidak ditemukan.' }
      if (order.revisionCount >= order.revisionLimit) return { error: `Kuota ${order.revisionLimit} putaran sudah terpakai. Berikutnya dihitung perubahan lingkup.` }
      const count = order.revisionCount + 1
      const updated = await client.from('orders').update({ revision_count: count, stage: 'revisi' }).eq('id', order.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      await client.from('order_events').insert({ order_id: order.id, stage: 'revisi', note: action.note || `Revisi ${count}/${order.revisionLimit}`, actor })
      return { info: `Revisi ${count} dari ${order.revisionLimit} dicatat.` }
    }
    case 'cancel-order': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const order = state.orders.find((item) => item.id === action.orderId)
      if (!order) return { error: 'Order tidak ditemukan.' }
      const started = Boolean(order.startedAt) || ['pengerjaan', 'revisi', 'menunggu_pelunasan', 'serah_terima', 'selesai'].includes(order.stage)
      const note = started ? 'Dibatalkan setelah kerja dimulai. Uang muka tidak kembali.' : 'Dibatalkan sebelum mulai. Uang muka kembali setelah dipotong 10 persen.'
      const updated = await client.from('orders').update({ stage: 'batal' }).eq('id', order.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      await client.from('order_events').insert({ order_id: order.id, stage: 'batal', note: `${note} ${action.reason}`, actor })
      await catat(actor, 'batal', 'order', `${order.code}: ${note}`)
      return { info: note }
    }
    case 'add-payment': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const inserted = await client.from('payments').insert({
        invoice_id: action.invoiceId,
        order_id: action.orderId,
        amount: action.amount,
        status: 'menunggu',
        proof_name: action.proofName || 'bukti',
      })
      const fail = pesan(inserted.error)
      if (fail) return { error: fail }
      return { info: 'Bukti pembayaran tercatat dan menunggu verifikasi.' }
    }
    case 'verify-payment': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const updated = await client.from('payments').update({ status: action.accept ? 'terverifikasi' : 'ditolak', verified_at: new Date().toISOString() }).eq('id', action.paymentId)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      await catat(actor, 'verifikasi', 'pembayaran', action.paymentId)
      return { info: action.accept ? 'Pembayaran diverifikasi.' : 'Pembayaran ditolak.' }
    }
    case 'add-expense': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      if (action.amount <= 0) return { error: 'Nominal tidak valid.' }
      const money = moneySnapshot(state)
      if (action.category.toLowerCase().includes('tools') && money.cash < state.settings.toolsThreshold) {
        return { error: 'Tools berbayar di atas kuota baru dibuka setelah kas melewati ambang.' }
      }
      const inserted = await client.from('expenses').insert({ spent_on: action.date || todayISO(), category: action.category, amount: action.amount, memo: action.memo })
      const fail = pesan(inserted.error)
      if (fail) return { error: fail }
      return { info: 'Pengeluaran dicatat.' }
    }
    case 'generate-contract': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const template = state.templates.find((item) => item.key === action.templateKey)
      if (!template) return { error: 'Templat tidak ditemukan.' }
      const order = action.orderId ? state.orders.find((item) => item.id === action.orderId) || null : null
      const number = template.prefix ? nextSerial(template.prefix, state.contracts.map((item) => item.number)) : ''
      const body = fillTemplate(template.body, contractVars(state, order, number))
      const { data, error } = await client.rpc('issue_contract', {
        p_order_id: action.orderId,
        p_template_key: action.templateKey,
        p_number: number,
        p_title: contractTitle(action.templateKey),
        p_body: body,
      })
      const fail = pesan(error)
      if (fail) return { error: fail }
      const row = data as { id: string; number: string }
      await catat(actor, 'terbit', 'kontrak', row.number || template.name)
      return { info: `${row.id}|${row.number || number}|` }
    }
    case 'update-template': {
      const denied = deny(state, ['owner'])
      if (denied) return { error: denied }
      const updated = await client.from('contract_templates').update({ body: action.body, updated_at: new Date().toISOString() }).eq('key', action.key)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Templat disimpan.' }
    }
    case 'set-contract-status': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const updated = await client.from('contracts').update({ status: action.status }).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Status kontrak diperbarui.' }
    }
    case 'toggle-rule': {
      const denied = deny(state, ['owner'])
      if (denied) return { error: denied }
      const rule = state.rules.find((item) => item.key === action.key)
      if (!rule) return { error: 'Aturan tidak ditemukan.' }
      const updated = await client.from('automation_rules').update({ enabled: !rule.enabled }).eq('key', action.key)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: rule.enabled ? 'Aturan dimatikan.' : 'Aturan diaktifkan.' }
    }
    case 'update-settings': {
      const denied = deny(state, ['owner'])
      if (denied) return { error: denied }
      const payload = { ...state.settings, ...action.patch }
      const updated = await client.from('app_settings').update({ payload }).eq('id', 1)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Pengaturan disimpan.' }
    }
    case 'update-package': {
      const denied = deny(state, ['owner'])
      if (denied) return { error: denied }
      const updated = await client.from('packages').update({
        price_min: action.patch.priceMin,
        price_max: action.patch.priceMax,
        active: action.patch.active,
        summary: action.patch.summary,
      }).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Daftar harga diperbarui.' }
    }
    case 'save-client': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const row = {
        name: action.name,
        whatsapp: action.whatsapp,
        email: action.email || '',
        address: action.address || '',
        institution: action.institution || '',
        student_status: action.studentStatus || '',
        notes: action.notes || '',
      }
      const saved = action.id ? await client.from('clients').update(row).eq('id', action.id) : await client.from('clients').insert(row)
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: action.id ? 'Klien diperbarui.' : 'Klien ditambahkan.' }
    }
    case 'save-worker': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const row = { name: action.name, whatsapp: action.whatsapp, title: action.title, brand: action.brand }
      const saved = action.id ? await client.from('workers').update(row).eq('id', action.id) : await client.from('workers').insert(row)
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: 'Data pekerja disimpan.' }
    }
    case 'save-portfolio': {
      const denied = deny(state, ['owner', 'social'])
      if (denied) return { error: denied }
      if (action.brand === 'edukasi' && action.published) return { error: 'Naskah Edukasi tidak dipublikasikan tanpa izin tertulis.' }
      const row = { brand: action.brand, title: action.title, caption: action.caption, published: action.published }
      const saved = action.id ? await client.from('portfolio_items').update(row).eq('id', action.id) : await client.from('portfolio_items').insert(row)
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: 'Portofolio disimpan.' }
    }
    case 'save-testimonial': {
      const denied = deny(state, ['owner', 'social', 'finance'])
      if (denied) return { error: denied }
      const row = { name: action.name, role: action.role, quote: action.quote, stars: action.stars, published: action.published }
      const saved = action.id ? await client.from('testimonials').update(row).eq('id', action.id) : await client.from('testimonials').insert(row)
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: 'Testimoni disimpan.' }
    }
    case 'read-notice': {
      const updated = await client.from('notifications').update({ read: true }).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return {}
    }
    case 'build-settlement': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const inserted = await client.from('settlements').insert({ period: action.period, status: 'siap', note: 'Disusun untuk persetujuan pemilik.' })
      const fail = pesan(inserted.error)
      if (fail) return { error: fail.includes('duplicate') ? 'Settlement periode ini sudah ada.' : fail }
      return { info: `Laporan ${action.period} tersusun.` }
    }
    case 'approve-settlement': {
      const denied = deny(state, ['owner'])
      if (denied) return { error: denied }
      const updated = await client.from('settlements').update({ status: 'disetujui', approved_at: new Date().toISOString() }).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Settlement disetujui.' }
    }
    case 'pay-settlement': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const updated = await client.from('settlements').update({ status: 'dibayar' }).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Settlement ditandai dibayar.' }
    }
    case 'add-file': {
      const denied = deny(state, ['owner', 'finance', 'worker'])
      if (denied) return { error: denied }
      const order = state.orders.find((item) => item.id === action.orderId)
      if (!order) return { error: 'Order tidak ditemukan.' }
      const files = [...order.files, { id: crypto.randomUUID(), name: action.name, kind: action.kind, at: new Date().toISOString() }]
      const updated = await client.from('orders').update({ files }).eq('id', order.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Berkas dicatat.' }
    }
    case 'mark-outbox': {
      const rule = state.outbox.find((item) => item.id === action.id)
      const updated = await client.from('wa_outbox').update({ status: 'terkirim' }).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      if (rule) void waHref(rule.to, rule.body)
      return { info: 'Ditandai terkirim.' }
    }
    default:
      return { error: 'Tindakan tidak dikenal.' }
  }
}
