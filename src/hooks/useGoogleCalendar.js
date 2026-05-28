import { useState, useEffect, useCallback } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { supabase } from '../lib/supabase'
import { isTokenExpired, getEventDateStr } from '../utils/calendarUtils'

export function useGoogleCalendar({ userId, date }) {
  const [calendarAccount, setCalendarAccount] = useState(null)
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load existing connection from Supabase on mount
  useEffect(() => {
    if (!userId) return
    supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .maybeSingle()
      .then(({ data }) => setCalendarAccount(data))
  }, [userId])

  // Re-fetch events when the connected account or displayed month changes
  useEffect(() => {
    if (!calendarAccount || !date) return

    if (isTokenExpired(calendarAccount.expires_at)) {
      // Token expired — clear the row and let the connect banner reappear
      supabase
        .from('user_calendars')
        .delete()
        .eq('id', calendarAccount.id)
        .then(() => {})
      setCalendarAccount(null)
      setEvents([])
      return
    }

    const year  = date.getFullYear()
    const month = date.getMonth()
    const timeMin = new Date(year, month, 1).toISOString()
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const url =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${encodeURIComponent(timeMin)}` +
      `&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime`

    setIsLoading(true)
    fetch(url, {
      headers: { Authorization: `Bearer ${calendarAccount.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error?.code === 401) {
          // Token was revoked externally — clear connection and show banner
          supabase.from('user_calendars').delete().eq('id', calendarAccount.id).then(() => {})
          setCalendarAccount(null)
          setEvents([])
          return
        }
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const normalized = (data.items || []).map(item => ({
          id:           item.id,
          title:        item.summary || '(No title)',
          startISO:     item.start?.dateTime ?? item.start?.date,
          endISO:       item.end?.dateTime   ?? item.end?.date,
          allDay:       !item.start?.dateTime,
          color:        calendarAccount.calendar_color,
          meetLink:     item.conferenceData?.entryPoints
                          ?.find(e => e.entryPointType === 'video')?.uri ?? null,
          location:     item.location ?? null,
          attendees:    (item.attendees ?? []).map(a => ({
                          name:  a.displayName ?? a.email,
                          email: a.email,
                        })),
          calendarEmail: calendarAccount.email,
          dateStr:       getEventDateStr(
                           item.start?.dateTime ?? item.start?.date,
                           timezone
                         ),
        }))
        setEvents(normalized)
      })
      .finally(() => setIsLoading(false))
  }, [calendarAccount, date])

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async tokenResponse => {
      const expiresAt = new Date(
        Date.now() + tokenResponse.expires_in * 1000
      ).toISOString()

      const userInfo = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      ).then(r => r.json())

      const calMeta = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      ).then(r => r.json())

      const row = {
        user_id:        userId,
        provider:       'google',
        email:          userInfo.email,
        access_token:   tokenResponse.access_token,
        refresh_token:  null,
        expires_at:     expiresAt,
        calendar_color: calMeta.backgroundColor ?? '#4285F4',
      }

      const { data } = await supabase
        .from('user_calendars')
        .upsert(row, { onConflict: 'user_id,provider' })
        .select()
        .single()

      setCalendarAccount(data)
    },
    onError: error => {
      console.error('Google Calendar connect failed:', error)
    },
  })

  const connectCalendar = useCallback(() => login(), [login])

  const disconnectCalendar = useCallback(async () => {
    if (!calendarAccount) return
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${calendarAccount.access_token}`,
      { method: 'POST' }
    )
    await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarAccount.id)
      .then(() => {})
    setCalendarAccount(null)
    setEvents([])
  }, [calendarAccount])

  return {
    events,
    isConnected:       !!calendarAccount && !isTokenExpired(calendarAccount.expires_at),
    isLoading,
    connectCalendar,
    disconnectCalendar,
  }
}
