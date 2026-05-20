import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNotes(userId) {
  const [notes, setNotes] = useState({})

  useEffect(() => {
    if (!userId) { setNotes({}); return }
    supabase
      .from('notes')
      .select('date, text')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(({ date, text }) => { map[date] = text })
          setNotes(map)
        }
      })
  }, [userId])

  const setNote = useCallback((dateStr, text) => {
    if (!userId) return
    setNotes((prev) => ({ ...prev, [dateStr]: text }))
    supabase.from('notes').upsert({ user_id: userId, date: dateStr, text }).then(() => {})
  }, [userId])

  return { notes, setNote }
}
