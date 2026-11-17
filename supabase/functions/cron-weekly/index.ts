import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET") || ""
  if (secret && req.headers.get("x-cron-secret") !== secret) return new Response("ditolak", { status: 401 })
  const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "")
  const { data, error } = await supabase.from("orders").select("id, code, stage, price, brand").limit(500)
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })
  const path = `backups/mingguan-${new Date().toISOString().slice(0, 10)}.json`
  const upload = await supabase.storage.from("order-files").upload(path, JSON.stringify({ takenAt: new Date().toISOString(), orders: data }), {
    contentType: "application/json",
    upsert: true,
  })
  if (upload.error) return Response.json({ ok: false, error: upload.error.message }, { status: 500 })
  return Response.json({ ok: true, path })
})
