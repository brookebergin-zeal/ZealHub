import { useState } from 'react'

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

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

const MAIN_NAV = [
  { id: 'daily',    label: 'Daily',    Icon: DailyIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
]

export default function Sidebar({ view, setView, onLogout, projects, activeProjectId, onSelectProject, onAddProject, onOpenSearch }) {
  const [showArchived, setShowArchived] = useState(false)

  const activeProjects   = projects.filter((p) => !p.archived)
  const archivedProjects = projects.filter((p) => p.archived)

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-gray-100 bg-white">

      <div className="h-14 flex items-center px-5 border-b border-gray-100 shrink-0">
        <span className="font-bold text-brand-600 text-lg tracking-tight">ZealHub</span>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex flex-col gap-1 p-3 pt-4 flex-1 overflow-y-auto min-h-0">

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors mb-1"
        >
          <SearchIcon />
          <span className="flex-1 text-left">Search</span>
          <span className="text-[10px] text-gray-300 font-mono">⌘K</span>
        </button>

        {/* Daily + Calendar */}
        {MAIN_NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
              ${view === id
                ? 'bg-brand-50 text-brand-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
          >
            <Icon />
            {label}
          </button>
        ))}

        {/* Active project list */}
        {activeProjects.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-0.5">
            {activeProjects.map((p) => {
              const active = view === 'project' && activeProjectId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                    ${active ? 'bg-gray-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                  style={active ? { color: p.color } : {}}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name || 'Untitled'}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Add Project */}
        <button
          onClick={onAddProject}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors mt-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add Project
        </button>

        {/* Archived projects */}
        {archivedProjects.length > 0 && (
          <div className="mt-1 pt-1 border-t border-gray-100">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex-1 text-left">Archived ({archivedProjects.length})</span>
              <svg className={`w-3 h-3 transition-transform ${showArchived ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showArchived && archivedProjects.map((p) => {
              const active = view === 'project' && activeProjectId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs transition-colors text-left
                    ${active ? 'bg-gray-50 text-gray-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 opacity-50" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name || 'Untitled'}</span>
                </button>
              )
            })}
          </div>
        )}

      </nav>

      {/* Logout — pinned to bottom */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Log out
        </button>
      </div>

    </aside>
  )
}
