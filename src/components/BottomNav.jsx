function CalendarIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function DailyIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12h12M9 6h12M9 18h12M5 12h.01M5 6h.01M5 18h.01" strokeLinecap="round" />
    </svg>
  )
}

export default function BottomNav({ view, activeProjectId, setView, projects, onSelectProject }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-white border-t border-gray-100 z-40">
      <div className="flex overflow-x-auto scrollbar-hide h-full">

        {/* Daily */}
        <button
          onClick={() => setView('daily')}
          className="flex flex-col items-center justify-center gap-1 px-5 shrink-0"
        >
          <DailyIcon active={view === 'daily'} />
          <span className={`text-xs font-medium ${view === 'daily' ? 'text-brand-600' : 'text-gray-400'}`}>Daily</span>
        </button>

        {/* Calendar */}
        <button
          onClick={() => setView('calendar')}
          className="flex flex-col items-center justify-center gap-1 px-5 shrink-0"
        >
          <CalendarIcon active={view === 'calendar'} />
          <span className={`text-xs font-medium ${view === 'calendar' ? 'text-brand-600' : 'text-gray-400'}`}>Calendar</span>
        </button>

        {/* Projects — one tab each, scrollable */}
        {projects.filter((p) => !p.archived).map((p) => {
          const active = view === 'project' && activeProjectId === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelectProject(p.id)}
              className="flex flex-col items-center justify-center gap-1 px-4 shrink-0 max-w-[80px]"
            >
              <div
                className="w-2 h-2 rounded-full transition-opacity"
                style={{ backgroundColor: p.color, opacity: active ? 1 : 0.4 }}
              />
              <span
                className="text-xs font-medium truncate w-full text-center"
                style={{ color: active ? p.color : '#9ca3af' }}
              >
                {p.name || 'Project'}
              </span>
            </button>
          )
        })}

      </div>
    </nav>
  )
}
