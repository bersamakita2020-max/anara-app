import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "")
}

async function callerRole(req: Request): Promise<string> {
  const header = req.headers.get("Authorization") || ""
  const token = header.replace("Bearer ", "")
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return ""
  const client = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: { headers: { Authorization: header } },
  })
  const { data } = await client.auth.getUser()
  if (!data.user) return ""
  const profile = await admin().from("profiles").select("role").eq("id", data.user.id).maybeSingle()
  return String(profile.data?.role || "")
}

async function config() {
  const { data, error } = await admin().rpc("wa_dispatch_config")
  if (error || !data) {
    return {
      provider: Deno.env.get("WA_CLOUD_TOKEN") ? "cloud" : Deno.env.get("FONNTE_TOKEN") ? "fonnte" : "none",
      phoneNumberId: Deno.env.get("WA_PHONE_NUMBER_ID") || "",
      cloudToken: Deno.env.get("WA_CLOUD_TOKEN") || "",
      fonnteToken: Deno.env.get("FONNTE_TOKEN") || "",
      verifyToken: Deno.env.get("WA_WEBHOOK_VERIFY_TOKEN") || "",
    }
  }
  const row = data as { provider: string; phoneNumberId: string; cloudToken: string; fonnteToken: string; verifyToken: string }
  return {
    ...row,
    cloudToken: row.cloudToken || Deno.env.get("WA_CLOUD_TOKEN") || "",
    fonnteToken: row.fonnteToken || Deno.env.get("FONNTE_TOKEN") || "",
    phoneNumberId: row.phoneNumberId || Deno.env.get("WA_PHONE_NUMBER_ID") || "",
    verifyToken: row.verifyToken || Deno.env.get("WA_WEBHOOK_VERIFY_TOKEN") || "",
  }
}

async function kirim(target: string, message: string) {
  const digits = target.replace(/\D/g, "")
  const phone = digits.startsWith("0") ? `62${digits.slice(1)}` : digits
  const cfg = await config()
  const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  let sent = false
  let detail = "Jalur belum terhubung."
  if (cfg.provider === "cloud" && cfg.cloudToken && cfg.phoneNumberId) {
    const response = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.cloudToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: message } }),
    })
    detail = (await response.text()).slice(0, 400)
    sent = response.ok
  } else if ((cfg.provider === "fonnte" || cfg.fonnteToken) && cfg.fonnteToken && cfg.provider !== "cloud") {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: cfg.fonnteToken },
      body: new URLSearchParams({ target: phone, message }),
    })
    detail = (await response.text()).slice(0, 400)
    sent = response.ok
  }
  await admin().from("wa_log").insert({ direction: "keluar", peer: phone, body: message, status: sent ? "terkirim" : "gagal", provider: cfg.provider, detail })
  return { sent, link, provider: cfg.provider }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const url = new URL(req.url)
  if (req.method === "GET") {
    const cfg = await config()
    if (url.searchParams.get("hub.verify_token") === cfg.verifyToken) {
      return new Response(url.searchParams.get("hub.challenge") || "", { headers: cors })
    }
    return new Response("ditolak", { status: 401 })
  }
  const body = await req.json().catch(() => ({})) as Record<string, string>
  if (body.entry) {
    const text = JSON.stringify(body).slice(0, 500)
    await admin().from("wa_log").insert({ direction: "masuk", peer: "", body: text, status: "masuk", provider: "cloud", detail: "" })
    return Response.json({ ok: true }, { headers: cors })
  }
  const role = await callerRole(req)
  if (!["owner", "finance"].includes(role)) return Response.json({ error: "Akses ditolak" }, { status: 403, headers: cors })
  if (body.action === "secret") {
    const { error } = await admin().rpc("wa_store_secret", { p_kind: body.kind, p_value: body.value || "" })
    if (error) return Response.json({ error: error.message }, { status: 400, headers: cors })
    return Response.json({ ready: true }, { headers: cors })
  }
  if (body.action === "send") {
    const result = await kirim(String(body.target || ""), String(body.message || "Tes kirim ANARA."))
    return Response.json(result, { headers: cors })
  }
  const cfg = await config()
  return Response.json({ provider: cfg.provider, cloud: Boolean(cfg.cloudToken), fonnte: Boolean(cfg.fonnteToken) }, { headers: cors })
})
