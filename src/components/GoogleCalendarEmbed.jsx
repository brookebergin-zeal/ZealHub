import { useState } from 'react'
import { useCalendarUrl } from '../hooks/useCalendarUrl'

function CalendarSetup({ onSave }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      setError('Please paste a URL.')
      return
    }
    if (!trimmed.startsWith('https://calendar.google.com/')) {
      setError("That doesn't look like a Google Calendar URL.")
      return
    }
    onSave(trimmed)
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-5">
      <div className="w-full max-w-xs">
        <p className="font-semibold text-gray-800 text-sm mb-1">Connect Google Calendar</p>
        <ol className="text-xs text-gray-400 space-y-1 mb-4 list-decimal list-inside leading-relaxed">
          <li>Open <span className="text-gray-600">calendar.google.com</span></li>
          <li>Gear icon → <span className="text-gray-600">Settings</span></li>
          <li>Left sidebar → your calendar name under <span className="text-gray-600">My calendars</span></li>
          <li>Scroll to <span className="text-gray-600">Integrate calendar</span></li>
          <li>Under <span className="text-gray-600">Embed code</span>, copy the URL inside <code className="bg-gray-100 px-1 rounded">src="…"</code></li>
        </ol>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setError('') }}
            placeholder="https://calendar.google.com/calendar/embed?src=…"
            className="text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full bg-white"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  )
}

export default function GoogleCalendarEmbed() {
  const { url, saveUrl, clearUrl } = useCalendarUrl()

  if (!url) {
    return <CalendarSetup onSave={saveUrl} />
  }

  return (
    <div className="relative h-full group">
      <iframe
        src={url}
        title="Google Calendar"
        className="w-full h-full border-0"
        loading="lazy"
      />
      <button
        onClick={clearUrl}
        className="absolute top-2 right-2 text-xs bg-white border border-gray-200 rounded-md px-2 py-1 text-gray-500 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Change
      </button>
    </div>
  )
}
