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
  return Response.json({ ok: true })
})
