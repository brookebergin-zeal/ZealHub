import { useState, useEffect } from 'react'
import { calendarGrid, toDateString, isSameDay } from '../utils/dateUtils'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

function TaskGroup({ title, tasks, color }) {
  if (tasks.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {color && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: color ?? '#9ca3af' }}>
          {title}
        </p>
      </div>
      <ul className="space-y-0.5">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-2 py-0.5">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-gray-200' : 'bg-brand-400'}`} />
            <span className={`text-sm leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {task.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CalendarView({ date, tasks, projects, onSelectDay, onSelectProject }) {
  const year  = date.getFullYear()
  const month = date.getMonth()
  const weeks = calendarGrid(year, month)
  const today = new Date()

  const [panelDate, setPanelDate] = useState(date)
  useEffect(() => { setPanelDate(date) }, [date])

  const panelDateStr     = toDateString(panelDate)
  const panelGeneralTasks = tasks.filter((t) => t.date === panelDateStr && !t.projectId)
  const panelActiveProjects = projects.filter((p) =>
    p.startDate && p.startDate <= panelDateStr && (!p.endDate || p.endDate >= panelDateStr)
  )
  const hasTasks = panelGeneralTasks.length > 0 || panelActiveProjects.some((p) =>
    tasks.some((t) => t.date === panelDateStr && t.projectId === p.id)
  )

  return (
    <div className="h-full flex overflow-hidden">

      {/* Left: calendar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-lg mx-auto md:mx-0">

          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2 select-none">{d}</div>
            ))}
          </div>

          {weeks.map((week, wi) => {
            const bars = getBarsInWeek(projects, week, year, month)

            return (
              <div key={wi} className="mb-1">

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

                <div className="grid grid-cols-7">
                  {week.map((day, di) => {
                    if (day === null) return <div key={`e-${wi}-${di}`} className="aspect-square" />

                    const cellDate  = new Date(year, month, day)
                    const dateStr   = toDateString(cellDate)
                    const taskCount = tasks.filter((t) => t.date === dateStr).length
                    const isToday    = isSameDay(cellDate, today)
                    const isSelected = isSameDay(cellDate, panelDate)

                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setPanelDate(cellDate)
                          if (window.innerWidth < 768) onSelectDay(cellDate)
                        }}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl m-0.5 transition-colors
                          ${isSelected ? 'bg-brand-600 text-white' : ''}
                          ${isToday && !isSelected ? 'bg-brand-50 text-brand-600 font-semibold' : ''}
                          ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
                        `}
                      >
                        <span className="text-sm leading-none">{day}</span>
                        {taskCount > 0 && (
                          <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white/70' : 'bg-brand-400'}`} />
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

      {/* Right: task panel (desktop only) */}
      <div className="hidden md:flex flex-col w-72 shrink-0 border-l border-gray-100">

        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-xs font-semibold text-gray-500">
            {panelDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          <button
            onClick={() => onSelectDay(panelDate)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Daily →
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!hasTasks && (
            <p className="text-sm text-gray-400 text-center pt-4">No tasks this day.</p>
          )}

          <TaskGroup
            title="Tasks"
            tasks={panelGeneralTasks}
          />

          {panelActiveProjects.map((p) => (
            <TaskGroup
              key={p.id}
              title={p.name || 'Untitled'}
              color={p.color}
              tasks={tasks.filter((t) => t.date === panelDateStr && t.projectId === p.id)}
            />
          ))}
        </div>

      </div>

    </div>
  )
}
