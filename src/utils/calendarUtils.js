export function formatEventTime(isoString, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(new Date(isoString))
}

export function getTimezoneAbbr(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone: timezone,
  }).formatToParts(new Date())
  return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
}

export function formatEventTimeRange(startISO, endISO, timezone) {
  const start = formatEventTime(startISO, timezone)
  const end   = formatEventTime(endISO, timezone)
  const abbr  = getTimezoneAbbr(timezone)
  return `${start} – ${end} (${abbr})`
}

export function getEventDateStr(isoString, timezone) {
  if (!isoString) return ''
  // All-day events from Google Calendar API are date-only strings (YYYY-MM-DD)
  // Parsing "2026-05-26" with new Date() gives UTC midnight, which shifts the date
  // in negative-offset timezones. Parse directly instead.
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) return isoString
  const parts = new Intl.DateTimeFormat('en-US', {
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
    timeZone: timezone,
  }).formatToParts(new Date(isoString))
  const year  = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day   = parts.find(p => p.type === 'day').value
  return `${year}-${month}-${day}`
}

export function isTokenExpired(expiresAt) {
  return new Date(expiresAt) <= new Date()
}
