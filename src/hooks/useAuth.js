import { useState } from 'react'

const STORAGE_KEY = 'zealhub_user'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  function login(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    setUser(profile)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return { user, login, logout }
}
