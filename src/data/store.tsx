import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { pesanAuth } from '../lib/authPesan'
import { supabase, supabaseEnabled } from '../lib/supabase'
import type { Action, ApplyResult } from './actions'
import { emptyState } from './defaults'
import { loadRemote } from './remote'
import { persist } from './persist'

export const dataKey = ['anara-data'] as const

interface Flash {
  text: string
  ok: boolean
}

interface StoreValue {
  state: ReturnType<typeof emptyState>
  ready: boolean
  pending: boolean
  loadError: string | null
  flash: Flash | null
  clearFlash: () => void
  act: (action: Action) => Promise<ApplyResult>
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  resetPassword: (email: string) => Promise<string | null>
  reload: () => Promise<void>
  prefetch: () => void
}

const Ctx = createContext<StoreValue | null>(null)

export function AnaraProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)
  const [flash, setFlash] = useState<Flash | null>(null)
  const query = useQuery({
    queryKey: dataKey,
    queryFn: async () => {
      if (!supabase) throw new Error('Server belum dikonfigurasi.')
      return loadRemote()
    },
    enabled: supabaseEnabled,
    staleTime: 60_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
  })
  const state = query.data ?? emptyState()
  const loadError = !supabaseEnabled
    ? 'Server belum dikonfigurasi.'
    : query.error instanceof Error
      ? query.error.message
      : null

  async function reload() {
    await queryClient.invalidateQueries({ queryKey: dataKey })
  }

  function prefetch() {
    void queryClient.prefetchQuery({ queryKey: dataKey, queryFn: loadRemote, staleTime: 60_000 })
  }

  useEffect(() => {
    if (!supabase || loadError) return
    const client = supabase
    const channel = client
      .channel('anara-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void queryClient.invalidateQueries({ queryKey: dataKey })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        void queryClient.invalidateQueries({ queryKey: dataKey })
      })
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [loadError, queryClient])

  const api = useMemo<StoreValue>(() => {
    return {
      state,
      ready: supabaseEnabled ? !query.isLoading : true,
      pending,
      loadError,
      flash,
      clearFlash: () => setFlash(null),
      reload,
      prefetch,
      async login(email, password) {
        if (!supabase) return 'Server belum dikonfigurasi.'
        setPending(true)
        try {
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
          if (error) return pesanAuth(error.message, 'masuk')
          await reload()
          return null
        } finally {
          setPending(false)
        }
      },
      async signup(email, password) {
        if (!supabase) return 'Server belum dikonfigurasi.'
        setPending(true)
        try {
          const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
          if (error) return pesanAuth(error.message, 'daftar')
          if (!data.session) return 'Cek email Anda untuk konfirmasi.'
          await reload()
          return null
        } finally {
          setPending(false)
        }
      },
      async resetPassword(email) {
        if (!supabase) return 'Server belum dikonfigurasi.'
        setPending(true)
        try {
          const redirectTo = `${window.location.origin}/anara-app/masuk`
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
          if (error) return pesanAuth(error.message, 'reset')
          return 'Jika email terdaftar, tautan pengaturan ulang kata sandi sudah dikirim. Cek email Anda.'
        } finally {
          setPending(false)
        }
      },
      async act(action) {
        if (pending) return { error: 'Masih memproses tindakan sebelumnya.' }
        if (action.type === 'logout') {
          await supabase?.auth.signOut()
          await reload()
          return { info: 'Anda sudah keluar.' }
        }
        setPending(true)
        try {
          const result = await persist(state, action)
          if (result.error) setFlash({ text: result.error, ok: false })
          else {
            if (result.info && !result.info.includes('|')) setFlash({ text: result.info, ok: true })
            await reload()
          }
          return result
        } finally {
          setPending(false)
        }
      },
    }
  }, [state, query.isLoading, pending, loadError, flash])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useAnara(): StoreValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('Konteks ANARA belum siap')
  return value
}
