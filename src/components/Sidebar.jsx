function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function DailyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12h12M9 6h12M9 18h12M5 12h.01M5 6h.01M5 18h.01" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'daily', label: 'Daily', Icon: DailyIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
]

export default function Sidebar({ view, setView }) {
  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-gray-100 bg-white">
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <span className="font-bold text-indigo-600 text-lg tracking-tight">ZealHub</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
              ${view === id
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
