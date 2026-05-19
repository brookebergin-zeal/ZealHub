import { useAuth } from '../hooks/useAuth'

export default function GoogleCalendarEmbed() {
  const { user } = useAuth()

  if (!user?.email) return null

  const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone
  const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(user.email)}&ctz=${encodeURIComponent(tz)}`

  return (
    <iframe
      src={src}
      title="Google Calendar"
      className="w-full h-full border-0"
      loading="lazy"
    />
  )
}
