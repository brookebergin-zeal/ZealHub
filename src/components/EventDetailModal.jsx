import { formatEventTimeRange } from '../utils/calendarUtils'

export function EventDetailModal({ event, timezone, onClose }) {
  if (!event) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-96 max-w-[90vw] p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-300 hover:text-brand-600 text-base leading-none"
        >
          ✕
        </button>

        <h2 className="text-base font-semibold pr-6 mb-1">{event.title}</h2>

        {event.allDay ? (
          <p className="text-sm text-brand-300 mb-3">All day</p>
        ) : (
          <p className="text-sm text-brand-300 mb-3">
            {formatEventTimeRange(event.startISO, event.endISO, timezone)}
          </p>
        )}

        {event.meetLink && (
          <a
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mb-3"
          >
            🎥 Join Meeting →
          </a>
        )}

        {event.location && !event.meetLink && (
          <p className="text-sm text-brand-300 mb-3">📍 {event.location}</p>
        )}

        {event.attendees.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-brand-300 uppercase tracking-wide mb-1">
              Participants
            </p>
            {event.attendees.slice(0, 5).map(a => (
              <p key={a.email} className="text-sm">
                {a.name} · <span className="text-brand-300">{a.email}</span>
              </p>
            ))}
            {event.attendees.length > 5 && (
              <p className="text-xs text-brand-300">+{event.attendees.length - 5} more</p>
            )}
          </div>
        )}

        <p className="text-xs text-brand-300 border-t border-brand-100 pt-2 mt-2">
          🗓 {event.calendarEmail}
        </p>
      </div>
    </div>
  )
}
