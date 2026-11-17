import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const body = await req.json().catch(() => ({}))
  const target = String(body.target || "").replace(/\D/g, "")
  const message = String(body.message || "")
  const token = Deno.env.get("FONNTE_TOKEN") || ""
  const link = `https://wa.me/${target}?text=${encodeURIComponent(message)}`
  if (!token) {
    return Response.json({ sent: false, link, note: "Token Fonnte kosong. Gunakan tautan wa.me." }, { headers: cors })
  }
  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token },
    body: new URLSearchParams({ target, message }),
  })
  const text = await response.text()
  return Response.json({ sent: response.ok, gateway: text.slice(0, 500), link }, { headers: cors, status: response.ok ? 200 : 502 })
})
