import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { apply, type Action, type ApplyResult } from './actions'
import { callRpc, loadRemote } from './remote'
import { createDemoState } from './seed'
import type { AppState } from '../types'

const KEY = 'anara-demo-v1'

interface StoreValue {
  state: AppState
  ready: boolean
  mode: 'demo' | 'live'
  banner: string
  flash: string | null
  clearFlash: () => void
  act: (action: Action) => Promise<ApplyResult>
  loginLive: (email: string, password: string) => Promise<string | null>
  signupLive: (email: string, password: string, name: string) => Promise<string | null>
  reload: () => Promise<void>
}

const Ctx = createContext<StoreValue | null>(null)

function readLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.packages?.length && parsed.settings) return parsed
    }
  } catch {
    /* data lama diabaikan */
  }
  return createDemoState()
}

export function AnaraProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createDemoState)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'demo' | 'live'>('demo')
  const [banner, setBanner] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode

  async function boot() {
    if (!supabaseEnabled || !supabase) {
      setState(readLocal())
      setMode('demo')
      setBanner('Mode contoh. Data operasional bertanda contoh dan tersimpan di peramban ini.')
      setReady(true)
      return
    }
    try {
      const remote = await loadRemote()
      setState(remote)
      setMode('live')
      setBanner('')
    } catch {
      setState(readLocal())
      setMode('demo')
      setBanner('Basis data belum siap atau belum diisi paket. Menampilkan data contoh.')
    }
    setReady(true)
  }

  useEffect(() => {
    void boot()
  }, [])

  useEffect(() => {
    if (mode !== 'live' || !supabase) return
    const channel = supabase
      .channel('anara-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void reload()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        void reload()
      })
      .subscribe()
    const client = supabase
    return () => {
      void client.removeChannel(channel)
    }
  }, [mode])

  async function reload() {
    if (!supabaseEnabled || !supabase) return
    try {
      const remote = await loadRemote()
      setState((current) => ({ ...remote, session: remote.session || current.session }))
      setMode('live')
    } catch {
      /* tetap pada data yang sudah tampil */
    }
  }

  const api = useMemo<StoreValue>(() => {
    return {
      state,
      ready,
      mode,
      banner,
      flash,
      clearFlash: () => setFlash(null),
      reload,
      async loginLive(email, password) {
        if (!supabase) return 'Mode contoh tidak memakai kata sandi server.'
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return error.message
        await reload()
        return null
      },
      async signupLive(email, password, name) {
        if (!supabase) return 'Pendaftaran server tidak aktif pada mode contoh.'
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) return error.message
        return null
      },
      async act(action) {
        if (modeRef.current === 'live' && supabase && (action.type === 'create-order' || action.type === 'sign')) {
          try {
            if (action.type === 'create-order') {
              const data = await callRpc<{ code: string; contractId: string; number: string }>('create_public_order', { payload: action.input })
              await reload()
              return { state, info: `Pesanan ${data.code} tercatat di server.|${data.contractId}|${data.code}|` }
            }
            const data = await callRpc<{ ok: boolean }>('sign_contract', {
              p_contract_id: action.contractId,
              p_name: action.name,
              p_otp: action.otp,
              p_agree: action.agree,
              p_ip: action.ip,
              p_ua: action.userAgent,
            })
            await reload()
            return { state, info: data.ok ? 'Kontrak disetujui di server.' : 'Kontrak diproses.' }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menghubungi server'
            setFlash(message)
            return { state, error: message }
          }
        }
        if (action.type === 'reset-demo') {
          localStorage.removeItem(KEY)
          const fresh = createDemoState()
          setState(fresh)
          setMode('demo')
          return { state: fresh, info: 'Data contoh dikembalikan.' }
        }
        const result = apply(state, action)
        if (!result.error) {
          setState(result.state)
          if (modeRef.current === 'demo') localStorage.setItem(KEY, JSON.stringify(result.state))
        }
        if (result.error) setFlash(result.error)
        else if (result.info && !result.info.includes('|')) setFlash(result.info)
        return result
      },
    }
  }, [state, ready, mode, banner, flash])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useAnara(): StoreValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('Konteks ANARA belum siap')
  return value
}
