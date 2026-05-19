import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function sessionToUser(session) {
  if (!session?.user) return null
  const meta = session.user.user_metadata ?? {}
  return {
    id:      session.user.id,
    name:    meta.full_name ?? meta.name ?? session.user.email,
    email:   session.user.email,
    picture: meta.avatar_url ?? meta.picture ?? '',
  }
}

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(sessionToUser(session))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  function login() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  function logout() {
    supabase.auth.signOut()
  }

  return { user, loading, login, logout }
}
