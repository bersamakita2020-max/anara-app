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
  const token = Deno.env.get("FONNTE_TOKEN") || ""
  const pending = await supabase.from("wa_outbox").select("id,to_address,body").eq("status", "siap").limit(20)
  let sent = 0
  if (token) {
    for (const row of pending.data || []) {
      const target = String(row.to_address || "").replace(/\D/g, "")
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: token },
        body: new URLSearchParams({ target, message: String(row.body || "") }),
      })
      await supabase.from("wa_outbox").update({ status: response.ok ? "terkirim" : "gagal" }).eq("id", row.id)
      if (response.ok) sent += 1
    }
  }
  return Response.json({ ok: true, fonnte: Boolean(token), sent, queued: pending.data?.length || 0 })
})
