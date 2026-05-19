export default function GoogleCalendarEmbed({ userEmail }) {
  if (!userEmail) return null

  const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone
  const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail)}&ctz=${encodeURIComponent(tz)}`

  return (
    <iframe
      src={src}
      title="Google Calendar"
      className="w-full h-full border-0"
      loading="lazy"
    />
  )
}
