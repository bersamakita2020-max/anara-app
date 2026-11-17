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
      if (action.signature.trim().length < 8) return { error: 'Bubuhkan tanda tangan.' }
      const { data, error } = await client.rpc('sign_contract', {
        p_contract_id: action.contractId,
        p_name: action.name.trim(),
        p_agree: action.agree,
        p_signature: action.signature,
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
        method: action.method || '',
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
    case 'add-option': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const saved = await client.rpc('add_option', { p_category: action.category, p_label: action.label })
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: 'Pilihan disimpan dan bisa dipakai lagi.' }
    }
    case 'save-invoice': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      if (!action.clientId) return { error: 'Pilih klien terlebih dahulu.' }
      if (action.lines.length === 0 || action.lines.some((line) => !line.description.trim() || line.unitPrice < 0)) return { error: 'Lengkapi baris tagihan.' }
      const amount = action.lines.reduce((sum, line) => sum + Math.round(line.qty * line.unitPrice), 0)
      const inserted = await client.from('invoices').insert({
        order_id: action.orderId || null,
        client_id: action.clientId,
        kind: 'pelunasan',
        number: '',
        amount,
        discount: action.discount,
        tax_percent: action.taxPercent,
        note: action.note,
        manual: true,
        due_date: action.dueDate || null,
        status: 'terbit',
      }).select('id, number').single()
      const fail = pesan(inserted.error)
      if (fail || !inserted.data) return { error: fail || 'Tagihan gagal disimpan.' }
      const items = await client.from('invoice_items').insert(action.lines.map((line, index) => ({
        invoice_id: inserted.data.id,
        description: line.description,
        qty: line.qty,
        unit: line.unit,
        unit_price: line.unitPrice,
        sort: index,
      })))
      const itemFail = pesan(items.error)
      if (itemFail) return { error: itemFail }
      return { info: `Tagihan ${inserted.data.number} terbit.` }
    }
    case 'save-payslip': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const gross = action.lines.filter((line) => line.kind === 'pendapatan').reduce((sum, line) => sum + line.amount, 0)
      const deductions = action.lines.filter((line) => line.kind === 'potongan').reduce((sum, line) => sum + line.amount, 0)
      const inserted = await client.from('payslips').insert({
        number: '',
        period: action.period,
        worker_id: action.workerId || null,
        recipient_name: action.recipientName,
        recipient_title: action.recipientTitle,
        lines: action.lines,
        gross,
        deductions,
        net: gross - deductions,
        note: action.note,
        status: 'draf',
      }).select('number').single()
      const fail = pesan(inserted.error)
      if (fail) return { error: fail }
      return { info: `Slip ${inserted.data?.number || ''} tersimpan.` }
    }
    case 'set-payslip': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const patch: Record<string, string> = { status: action.status }
      if (action.status === 'disetujui') patch.approved_at = new Date().toISOString()
      if (action.status === 'dibayar') patch.paid_at = new Date().toISOString()
      const updated = await client.from('payslips').update(patch).eq('id', action.id)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Status slip diperbarui.' }
    }
    case 'save-pay-settings': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const updated = await client.from('pay_settings').update({
        provider: action.patch.provider,
        sandbox: action.patch.sandbox,
        qris_dynamic: action.patch.qrisDynamic,
        va_enabled: action.patch.vaEnabled,
        bank_name: action.patch.bankName,
        bank_number: action.patch.bankNumber,
        bank_holder: action.patch.bankHolder,
        qris_path: action.patch.qrisPath,
        tripay_merchant: action.patch.tripayMerchant,
        duitku_merchant: action.patch.duitkuMerchant,
        updated_at: new Date().toISOString(),
      }).eq('id', 1)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Pengaturan pembayaran disimpan. Jalur gratis tetap dipakai bila gateway belum siap.' }
    }
    case 'save-wa-public': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const saved = await client.rpc('wa_save_public', {
        p_provider: action.provider,
        p_phone_number_id: action.phoneNumberId,
        p_waba_id: action.wabaId,
      })
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: 'Jalur WhatsApp disimpan. Token tetap di server.' }
    }
    case 'set-order-source': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const updated = await client.from('orders').update({ source: action.source }).eq('id', action.orderId)
      const fail = pesan(updated.error)
      if (fail) return { error: fail }
      return { info: 'Sumber order disimpan.' }
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
    case 'save-package': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      if (!action.name.trim() || action.priceMin <= 0) return { error: 'Nama dan harga wajib diisi.' }
      const row = {
        id: action.id || action.slug,
        slug: action.slug,
        brand: action.brand,
        name: action.name.trim(),
        summary: action.summary,
        features: action.features,
        price_min: action.priceMin,
        price_max: Math.max(action.priceMax, action.priceMin),
        fixed: action.priceMin === action.priceMax,
        lead_days: action.leadDays || 7,
        icon: action.icon,
        active: action.active,
        revisions: 2,
        sort: action.id ? state.packages.find((item) => item.id === action.id)?.sort ?? 0 : state.packages.length + 1,
      }
      const saved = action.id
        ? await client.from('packages').update(row).eq('id', action.id)
        : await client.from('packages').insert(row)
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      return { info: 'Layanan disimpan. Katalog langsung memakai data ini.' }
    }
    case 'move-package': {
      const denied = deny(state, ['owner', 'finance'])
      if (denied) return { error: denied }
      const list = [...state.packages].sort((a, b) => a.sort - b.sort)
      const index = list.findIndex((item) => item.id === action.id)
      const swap = action.direction === 'naik' ? index - 1 : index + 1
      if (index < 0 || swap < 0 || swap >= list.length) return {}
      const current = list[index]
      const other = list[swap]
      await client.from('packages').update({ sort: other.sort }).eq('id', current.id)
      await client.from('packages').update({ sort: current.sort }).eq('id', other.id)
      return { info: 'Urutan layanan diperbarui.' }
    }
    case 'update-package': {
      const denied = deny(state, ['owner', 'finance'])
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
      const saved = action.id
        ? await client.from('clients').update(row).eq('id', action.id)
        : await client.from('clients').insert(row).select('id').single()
      const fail = pesan(saved.error)
      if (fail) return { error: fail }
      const id = action.id || (saved.data && 'id' in saved.data ? String(saved.data.id) : '')
      return { info: action.id ? 'Klien diperbarui.' : `Klien ditambahkan.|${id}` }
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
