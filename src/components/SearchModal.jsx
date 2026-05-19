import { useState, useEffect } from 'react'

function Highlight({ text, query }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-inherit rounded-sm not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function SearchModal({ tasks, projects, onNavigate, onClose }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const results = q
    ? tasks
        .filter((t) => t.date && t.title.toLowerCase().includes(q))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30)
    : []

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 pt-[15vh] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="flex-1 text-sm focus:outline-none text-gray-800 placeholder-gray-400"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {q && results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No tasks found.</p>
          )}
          {!q && (
            <p className="text-xs text-gray-400 text-center py-8">Type to search all tasks.</p>
          )}
          {results.map((task) => {
            const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null
            return (
              <button
                key={task.id}
                onClick={() => onNavigate(task.date)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-gray-300' : 'bg-brand-400'}`} />
                <div className="min-w-0">
                  <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    <Highlight text={task.title} query={query.trim()} />
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    {formatDate(task.date)}
                    {project && (
                      <>
                        <span>·</span>
                        <span style={{ color: project.color }}>{project.name || 'Untitled'}</span>
                      </>
                    )}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
