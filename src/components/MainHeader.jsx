import { formatDay, formatMonth } from '../utils/dateUtils'

export default function MainHeader({ view, date, onPrev, onNext, onToday, projectName }) {
  const isProject = view === 'project'
  const title     = isProject ? (projectName || 'Project') : view === 'daily' ? 'Daily' : 'Calendar'
  const dateLabel = isProject ? null : view === 'daily' ? formatDay(date) : formatMonth(date)

  return (
    <header className="h-12 md:h-14 flex items-center px-4 md:px-6 border-b border-gray-100 bg-white shrink-0 gap-3">
      <span className="font-semibold text-gray-900 text-sm md:text-base truncate">{title}</span>

      {dateLabel && (
        <>
          <span className="text-gray-200 select-none shrink-0">|</span>
          <span className="text-gray-500 text-sm truncate">{dateLabel}</span>
        </>
      )}

      {!isProject && (
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={onToday}
            className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Today
          </button>
          <span className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />
          <button
            onClick={onPrev}
            aria-label="Previous"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onNext}
            aria-label="Next"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </header>
  )
}
