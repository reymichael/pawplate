import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  /**
   * undefined  = not yet fetched
   * null       = fetched but no row exists in user_profiles (new user)
   * UserProfile = fetched and has a row
   */
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setProfile((data as UserProfile | null) ?? null)
  }

  useEffect(() => {
    // Initial session check — await profile before clearing loading
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Auth state changes (sign-in / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setProfile(undefined) // reset while re-fetching
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  /** Call this after completing onboarding to update local profile state */
  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return { user, session, profile, loading, signOut, refreshProfile }
}
