import { supabase, supabaseUrl } from '../lib/supabase'

export function tautanWa(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '')
  const target = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`
}

export async function kirimWa(phone: string, text: string): Promise<void> {
  const link = tautanWa(phone, text)
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const session = await supabase?.auth.getSession()
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/wa-gateway`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${session?.data.session?.access_token || key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'send', target: phone, message: text }),
    })
    const json = await response.json().catch(() => ({})) as { sent?: boolean }
    if (json.sent) return
  } catch {
    /* fallback wa.me */
  }
  window.open(link, '_blank', 'noopener')
}
