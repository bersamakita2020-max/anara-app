import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const body = await req.json().catch(() => ({}))
  const to = String(body.to || "")
  const subject = String(body.subject || "ANARA")
  const text = String(body.text || "")
  const key = Deno.env.get("RESEND_API_KEY") || ""
  const from = Deno.env.get("MAIL_FROM") || ""
  if (!to) return Response.json({ sent: false, note: "Surel klien kosong." }, { headers: cors })
  if (!key || !from) {
    return Response.json({ sent: false, note: "Surel usaha belum diaktifkan." }, { headers: cors })
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  })
  return Response.json({ sent: response.ok }, { headers: cors, status: response.ok ? 200 : 502 })
})
