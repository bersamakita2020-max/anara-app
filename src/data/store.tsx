import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { pesanAuth } from '../lib/authPesan'
import type { Action, ApplyResult } from './actions'
import { emptyState } from './defaults'
import { loadRemote } from './remote'
import { persist } from './persist'

interface StoreValue {
  state: ReturnType<typeof emptyState>
  ready: boolean
  loadError: string | null
  flash: string | null
  clearFlash: () => void
  act: (action: Action) => Promise<ApplyResult>
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  resetPassword: (email: string) => Promise<string | null>
  reload: () => Promise<void>
}

const Ctx = createContext<StoreValue | null>(null)

export function AnaraProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(emptyState)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function reload() {
    if (!supabase) return
    const remote = await loadRemote()
    setState((current) => ({ ...remote, session: remote.session || current.session }))
    setLoadError(null)
  }

  useEffect(() => {
    async function boot() {
      if (!supabaseEnabled || !supabase) {
        setLoadError('Server belum dikonfigurasi.')
        setReady(true)
        return
      }
      try {
        setState(await loadRemote())
        setLoadError(null)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Data tidak dapat dimuat.')
      }
      setReady(true)
    }
    void boot()
  }, [])

  useEffect(() => {
    if (!supabase || loadError) return
    const client = supabase
    const channel = client
      .channel('anara-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void reload().catch(() => undefined)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        void reload().catch(() => undefined)
      })
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [loadError])

  const api = useMemo<StoreValue>(() => {
    return {
      state,
      ready,
      loadError,
      flash,
      clearFlash: () => setFlash(null),
      reload,
      async login(email, password) {
        if (!supabase) return 'Server belum dikonfigurasi.'
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) return pesanAuth(error.message, 'masuk')
        try {
          await reload()
        } catch (err) {
          return err instanceof Error ? err.message : 'Data tidak dapat dimuat setelah masuk.'
        }
        return null
      },
      async signup(email, password) {
        if (!supabase) return 'Server belum dikonfigurasi.'
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) return pesanAuth(error.message, 'daftar')
        if (!data.session) return 'Cek email Anda untuk konfirmasi.'
        try {
          await reload()
        } catch {
          return null
        }
        return null
      },
      async resetPassword(email) {
        if (!supabase) return 'Server belum dikonfigurasi.'
        const redirectTo = `${window.location.origin}/anara-app/masuk`
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
        if (error) return pesanAuth(error.message, 'reset')
        return 'Jika email terdaftar, tautan pengaturan ulang kata sandi sudah dikirim. Cek email Anda.'
      },
      async act(action) {
        if (action.type === 'logout') {
          await supabase?.auth.signOut()
          setState((current) => ({ ...current, session: null }))
          return { info: 'Anda sudah keluar.' }
        }
        const result = await persist(state, action)
        if (result.error) setFlash(result.error)
        else {
          if (result.info && !result.info.includes('|')) setFlash(result.info)
          try {
            await reload()
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Data tidak dapat dimuat ulang.'
            setFlash(message)
            return { error: message }
          }
        }
        return result
      },
    }
  }, [state, ready, loadError, flash])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useAnara(): StoreValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('Konteks ANARA belum siap')
  return value
}
