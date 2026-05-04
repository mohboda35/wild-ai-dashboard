import { supabase } from './supabase'
import type { Profile } from './types'

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return data ?? null
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}
