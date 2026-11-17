import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const supabaseEnabled = Boolean(url && key && url.startsWith('https://') && !key.includes('ISI_'))

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export const supabaseUrl = url
