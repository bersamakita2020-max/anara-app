import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET") || ""
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return new Response("ditolak", { status: 401 })
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "")
  const { error } = await supabase.rpc("run_daily_maintenance")
  if (error) {
    const direct = await supabase.schema("private").rpc("run_daily_maintenance")
    if (direct.error) return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
  const config = await supabase.rpc("wa_dispatch_config")
  const cfg = (config.data || {}) as { provider?: string; fonnteToken?: string; cloudToken?: string; phoneNumberId?: string }
  const fonnte = cfg.fonnteToken || Deno.env.get("FONNTE_TOKEN") || ""
  const pending = await supabase.from("wa_outbox").select("id,to_address,body").eq("status", "siap").limit(20)
  let sent = 0
  for (const row of pending.data || []) {
    const target = String(row.to_address || "").replace(/\D/g, "")
    const phone = target.startsWith("0") ? `62${target.slice(1)}` : target
    let ok = false
    if (cfg.provider === "cloud" && cfg.cloudToken && cfg.phoneNumberId) {
      const response = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.cloudToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: row.body } }),
      })
      ok = response.ok
    } else if (fonnte) {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: fonnte },
        body: new URLSearchParams({ target: phone, message: String(row.body || "") }),
      })
      ok = response.ok
    } else {
      break
    }
    await supabase.from("wa_outbox").update({ status: ok ? "terkirim" : "gagal" }).eq("id", row.id)
    if (ok) sent += 1
  }
  return Response.json({ ok: true, provider: cfg.provider || "wa.me", sent, queued: pending.data?.length || 0 })
})
