import { calendarGrid, toDateString, isSameDay } from '../utils/dateUtils'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Returns projects that are active on at least one day in the week,
// each annotated with the startCol/endCol (0=Mon, 6=Sun) of their visible span.
function getBarsInWeek(projects, week, year, month) {
  return projects
    .filter((p) => p.startDate)
    .map((p) => {
      let startCol = -1, endCol = -1
      week.forEach((day, col) => {
        if (day === null) return
        const d = toDateString(new Date(year, month, day))
        if (d >= p.startDate && (!p.endDate || d <= p.endDate)) {
          if (startCol === -1) startCol = col
          endCol = col
        }
      })
      return startCol !== -1 ? { ...p, startCol, endCol } : null
    })
    .filter(Boolean)
}

export default function CalendarView({ date, tasks, projects, onSelectDay, onSelectProject }) {
  const year  = date.getFullYear()
  const month = date.getMonth()
  const weeks = calendarGrid(year, month)
  const today = new Date()

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto md:mx-0">

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2 select-none">{d}</div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const bars = getBarsInWeek(projects, week, year, month)

          return (
            <div key={wi} className="mb-1">

              {/* Project span bars — CSS grid auto-placement stacks non-overlapping bars on the same row */}
              {bars.length > 0 && (
                <div className="grid grid-cols-7 gap-x-0.5 mb-0.5 px-0.5">
                  {bars.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      title={p.name}
                      className="text-left text-[11px] leading-tight px-1.5 py-0.5 rounded truncate hover:opacity-75 transition-opacity"
                      style={{
                        gridColumn: `${p.startCol + 1} / ${p.endCol + 2}`,
                        backgroundColor: p.color + '28',
                        color: p.color,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {week.map((day, di) => {
                  if (day === null) return <div key={`e-${wi}-${di}`} className="aspect-square" />

                  const cellDate = new Date(year, month, day)
                  const dateStr  = toDateString(cellDate)
                  const taskCount = tasks.filter((t) => t.date === dateStr).length
                  const isToday    = isSameDay(cellDate, today)
                  const isSelected = isSameDay(cellDate, date)

                  return (
                    <button
                      key={day}
                      onClick={() => onSelectDay(cellDate)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl m-0.5 transition-colors
                        ${isSelected ? 'bg-indigo-600 text-white' : ''}
                        ${isToday && !isSelected ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}
                        ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
                      `}
                    >
                      <span className="text-sm leading-none">{day}</span>
                      {taskCount > 0 && (
                        <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white/70' : 'bg-indigo-400'}`} />
                      )}
                    </button>
                  )
                })}
              </div>

            </div>
          )
        })}

      </div>
    </div>
  )
}
