import { useState, useCallback } from 'react'

const STORAGE_KEY = 'zealhub_notes'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function useNotes() {
  const [notes, setNotes] = useState(load)

  const setNote = useCallback((dateStr, text) => {
    setNotes((prev) => {
      const next = { ...prev, [dateStr]: text }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { notes, setNote }
}
