import { useState } from 'react'

const STORAGE_KEY = 'zealhub_gcal_url'

export function useCalendarUrl() {
  const [url, setUrl] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')

  function saveUrl(newUrl) {
    localStorage.setItem(STORAGE_KEY, newUrl)
    setUrl(newUrl)
  }

  function clearUrl() {
    localStorage.removeItem(STORAGE_KEY)
    setUrl('')
  }

  return { url, saveUrl, clearUrl }
}
