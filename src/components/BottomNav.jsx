function CalendarIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function DailyIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12h12M9 6h12M9 18h12M5 12h.01M5 6h.01M5 18h.01" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'daily', label: 'Daily', Icon: DailyIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
]

export default function BottomNav({ view, setView }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-white border-t border-gray-100 flex z-40">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            <Icon active={active} />
            <span className={`text-xs font-medium ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
