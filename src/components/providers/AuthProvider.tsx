'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  profileError: string | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  profileError: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    console.log('[AuthProvider] profile fetch result:', { userId, data, error })

    if (error) {
      console.error('[AuthProvider] profile error:', error.message, error.code)
      setProfileError(error.message)
      setProfile(null)
      return
    }

    if (!data) {
      console.warn('[AuthProvider] no profile row for user:', userId)
      setProfileError('no_profile')
      setProfile(null)
      return
    }

    if (!data.role) {
      console.warn('[AuthProvider] profile has no role:', data)
      setProfileError('no_role')
      setProfile(data)
      return
    }

    console.log('[AuthProvider] profile set to state:', data)
    setProfile(data)
  }, [])

  // Log whenever profile state actually changes
  useEffect(() => {
    console.log('[AuthProvider] profile state is now:', profile)
  }, [profile])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately with the current session,
    // so getSession() is redundant — removing it eliminates the duplicate fetch.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthProvider] auth state change:', _event, session?.user?.id ?? 'no user')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setProfileError(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ user, session, profile, profileError, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
