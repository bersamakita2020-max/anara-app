import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import md5 from "npm:md5"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
}

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "")
}

function methods(va: boolean) {
  const list = ["other_qris", "qris"]
  if (va) list.push("bca_va", "bni_va", "bri_va", "permata_va", "mandiri_va")
  return list
}

async function tandai(invoiceId: string, amount: number, method: string, ref: string) {
  await admin().rpc("mark_invoice_paid", { p_invoice: invoiceId, p_amount: amount, p_method: method, p_ref: ref })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const url = new URL(req.url)
  const provider = url.searchParams.get("provider") || ""
  const settings = await admin().from("pay_settings").select("*").eq("id", 1).maybeSingle()
  const pay = settings.data || { provider: "manual", sandbox: true, qris_dynamic: true, va_enabled: false, tripay_merchant: "", duitku_merchant: "" }
  if (provider === "midtrans") {
    const body = await req.json().catch(() => ({})) as { order_id?: string; status_code?: string; gross_amount?: string; signature_key?: string; transaction_status?: string }
    const server = Deno.env.get("MIDTRANS_SERVER_KEY") || ""
    const raw = `${body.order_id}${body.status_code}${body.gross_amount}${server}`
    const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(raw))
    const signature = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
    if (!server || signature !== body.signature_key) return new Response("signature", { status: 401 })
    if (["settlement", "capture"].includes(String(body.transaction_status))) {
      const invoiceId = String(body.order_id || "").split(":")[0]
      await tandai(invoiceId, Math.round(Number(body.gross_amount || 0)), "QRIS", `midtrans:${body.order_id}`)
    }
    return Response.json({ ok: true })
  }
  if (provider === "xendit") {
    const token = req.headers.get("x-callback-token") || ""
    if (!Deno.env.get("XENDIT_WEBHOOK_TOKEN") || token !== Deno.env.get("XENDIT_WEBHOOK_TOKEN")) return new Response("signature", { status: 401 })
    const body = await req.json().catch(() => ({})) as { status?: string; external_id?: string; paid_amount?: number; id?: string }
    if (body.status === "PAID" || body.status === "SETTLED") await tandai(String(body.external_id), Math.round(Number(body.paid_amount || 0)), "QRIS", `xendit:${body.id}`)
    return Response.json({ ok: true })
  }
  if (provider === "tripay" || provider === "duitku") {
    const body = await req.json().catch(() => ({})) as Record<string, string>
    const ref = body.merchant_ref || body.merchantOrderId || ""
    const status = body.status || body.resultCode || ""
    if (["PAID", "00"].includes(status)) await tandai(ref.split(":")[0], Math.round(Number(body.amount || body.total_amount || 0)), "QRIS", `${provider}:${ref}`)
    return Response.json({ ok: true })
  }
  const body = await req.json().catch(() => ({})) as { action?: string; invoiceId?: string }
  if (body.action !== "create" || !body.invoiceId) {
    const ready = {
      midtrans: Boolean(Deno.env.get("MIDTRANS_SERVER_KEY")),
      xendit: Boolean(Deno.env.get("XENDIT_SECRET_KEY")),
      tripay: Boolean(Deno.env.get("TRIPAY_API_KEY") && Deno.env.get("TRIPAY_PRIVATE_KEY")),
      duitku: Boolean(Deno.env.get("DUITKU_API_KEY")),
    }
    return Response.json({ provider: pay.provider, sandbox: pay.sandbox, ready, fallback: "manual" }, { headers: cors })
  }
  if (pay.provider === "manual" || !pay.qris_dynamic) {
    return Response.json({ error: "Gateway tidak aktif. Gunakan QRIS statis atau transfer." }, { status: 409, headers: cors })
  }
  const invoice = await admin().from("invoices").select("id, number, amount, discount, tax_percent").eq("id", body.invoiceId).maybeSingle()
  if (!invoice.data) return Response.json({ error: "Tagihan tidak ditemukan" }, { status: 404, headers: cors })
  const net = Math.max(0, Math.round((Number(invoice.data.amount) - Number(invoice.data.discount || 0)) * (100 + Number(invoice.data.tax_percent || 0)) / 100))
  const sandbox = pay.sandbox !== false
  const va = Boolean(pay.va_enabled)
  if (pay.provider === "midtrans") {
    const key = Deno.env.get("MIDTRANS_SERVER_KEY") || ""
    if (!key) return Response.json({ error: "Secret MIDTRANS_SERVER_KEY belum diisi." }, { status: 409, headers: cors })
    const host = sandbox ? "https://app.sandbox.midtrans.com" : "https://app.midtrans.com"
    const response = await fetch(`${host}/snap/v1/transactions`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${key}:`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_details: { order_id: `${invoice.data.id}:${Date.now()}`, gross_amount: net },
        enabled_payments: methods(va).filter((item) => item !== "qris"),
        item_details: [{ id: invoice.data.number, price: net, quantity: 1, name: invoice.data.number }],
      }),
    })
    const json = await response.json().catch(() => ({})) as { redirect_url?: string }
    if (!json.redirect_url) return Response.json({ error: "Midtrans menolak transaksi." }, { status: 502, headers: cors })
    return Response.json({ url: json.redirect_url }, { headers: cors })
  }
  if (pay.provider === "xendit") {
    const key = Deno.env.get("XENDIT_SECRET_KEY") || ""
    if (!key) return Response.json({ error: "Secret XENDIT_SECRET_KEY belum diisi." }, { status: 409, headers: cors })
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${key}:`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        external_id: invoice.data.id,
        amount: net,
        description: invoice.data.number,
        payment_methods: va ? ["QRIS", "BCA", "BNI", "BRI", "MANDIRI"] : ["QRIS"],
      }),
    })
    const json = await response.json().catch(() => ({})) as { invoice_url?: string }
    if (!json.invoice_url) return Response.json({ error: "Xendit menolak transaksi." }, { status: 502, headers: cors })
    return Response.json({ url: json.invoice_url }, { headers: cors })
  }
  if (pay.provider === "tripay") {
    const api = Deno.env.get("TRIPAY_API_KEY") || ""
    const priv = Deno.env.get("TRIPAY_PRIVATE_KEY") || ""
    const merchant = String(pay.tripay_merchant || "")
    if (!api || !priv || !merchant) return Response.json({ error: "Secret Tripay atau kode merchant belum lengkap." }, { status: 409, headers: cors })
    const ref = invoice.data.id
    const channel = va ? "BRIVA" : "QRIS"
    const signRaw = `${merchant}${ref}${net}`
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(priv), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signRaw))
    const signature = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")
    const host = sandbox ? "https://tripay.co.id/api-sandbox" : "https://tripay.co.id/api"
    const response = await fetch(`${host}/transaction/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${api}`, "Content-Type": "application/json" },
      body: JSON.stringify({ method: channel, merchant_ref: ref, amount: net, customer_name: "Klien ANARA", signature, order_items: [{ name: invoice.data.number, price: net, quantity: 1 }] }),
    })
    const json = await response.json().catch(() => ({})) as { data?: { checkout_url?: string } }
    if (!json.data?.checkout_url) return Response.json({ error: "Tripay menolak transaksi." }, { status: 502, headers: cors })
    return Response.json({ url: json.data.checkout_url }, { headers: cors })
  }
  const api = Deno.env.get("DUITKU_API_KEY") || ""
  const merchant = String(pay.duitku_merchant || "")
  if (!api || !merchant) return Response.json({ error: "Secret DUITKU_API_KEY atau kode merchant belum diisi." }, { status: 409, headers: cors })
  const orderId = invoice.data.id
  const signature = md5(`${merchant}${orderId}${net}${api}`)
  const host = sandbox ? "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry" : "https://passport.duitku.com/webapi/api/merchant/v2/inquiry"
  const response = await fetch(host, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantCode: merchant, paymentAmount: net, merchantOrderId: orderId, productDetails: invoice.data.number, paymentMethod: va ? "BC" : "SP", signature, email: "bayar@anara.local", customerVaName: "ANARA" }),
  })
  const json = await response.json().catch(() => ({})) as { paymentUrl?: string }
  if (!json.paymentUrl) return Response.json({ error: "Duitku menolak transaksi." }, { status: 502, headers: cors })
  return Response.json({ url: json.paymentUrl }, { headers: cors })
})
