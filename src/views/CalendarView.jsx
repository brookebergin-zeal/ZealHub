import { useState, useEffect } from 'react'
import { calendarGrid, toDateString, isSameDay } from '../utils/dateUtils'
import { EventChip } from '../components/EventChip'
import { EventDetailModal } from '../components/EventDetailModal'
import { formatEventTime } from '../utils/calendarUtils'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getBarsInWeek(projects, week, year, month) {
  return projects
    .filter((p) => p.startDate && !p.archived)
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

export default function CalendarView({
  date, tasks, projects, onSelectDay, onSelectProject,
  calendarEvents = [],
  isCalendarConnected = false,
  isCalendarLoading = false,
  connectCalendar,
  disconnectCalendar,
}) {
  const year  = date.getFullYear()
  const month = date.getMonth()
  const weeks = calendarGrid(year, month)
  const today = new Date()

  const [panelDate, setPanelDate] = useState(date)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [rightPanelTab, setRightPanelTab] = useState('events')
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => { setPanelDate(date) }, [date])

  const panelDateStr     = toDateString(panelDate)
  const panelGeneralTasks = tasks.filter((t) => t.date === panelDateStr && !t.projectId)
  const panelActiveProjects = projects.filter((p) =>
    !p.archived && p.startDate && p.startDate <= panelDateStr && (!p.endDate || p.endDate >= panelDateStr)
  )
  const hasTasks = panelGeneralTasks.length > 0 || panelActiveProjects.some((p) =>
    tasks.some((t) => t.date === panelDateStr && t.projectId === p.id)
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Connect banner — shown when no calendar is connected */}
      {!isCalendarConnected && (
        <div className="flex items-center justify-between px-4 py-2 bg-brand-50 border-b border-brand-100 text-sm shrink-0">
          <span className="text-brand-300">Connect Google Calendar to see your events here</span>
          <button
            onClick={connectCalendar}
            className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700"
          >
            Connect
          </button>
        </div>
      )}

      {/* Main content: calendar grid + right panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: calendar grid */}
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
                      if (day === null) return <div key={`e-${wi}-${di}`} className="min-h-14" />

                      const cellDate   = new Date(year, month, day)
                      const dateStr    = toDateString(cellDate)
                      const isToday    = isSameDay(cellDate, today)
                      const isSelected = isSameDay(cellDate, panelDate)
                      const dayEvents  = calendarEvents.filter(e => e.dateStr === dateStr)
                      const visible    = dayEvents.slice(0, 3)
                      const overflow   = dayEvents.length - visible.length

                      return (
                        <button
                          key={day}
                          onClick={() => {
                            setPanelDate(cellDate)
                            if (window.innerWidth < 768) onSelectDay(cellDate)
                          }}
                          className={`flex flex-col rounded-xl m-0.5 p-1 min-h-14 transition-colors text-left w-full
                            ${isSelected ? 'bg-brand-600 text-white' : ''}
                            ${isToday && !isSelected ? 'bg-brand-50 font-semibold' : ''}
                            ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
                          `}
                        >
                          <span className={`text-sm leading-none mb-0.5 pl-0.5
                            ${isToday && !isSelected ? 'text-brand-600' : ''}
                          `}>
                            {day}
                          </span>
                          <div className="flex flex-col gap-0.5 w-full">
                            {visible.map(event => (
                              <EventChip key={event.id} event={event} onClick={setSelectedEvent} />
                            ))}
                          </div>
                          {overflow > 0 && (
                            <span className={`text-[9px] px-0.5 mt-0.5 ${isSelected ? 'text-white/70' : 'text-brand-300'}`}>
                              +{overflow} more
                            </span>
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

        {/* Right: panel (desktop only) */}
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

          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setRightPanelTab('events')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                rightPanelTab === 'events'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setRightPanelTab('tasks')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                rightPanelTab === 'tasks'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Tasks
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightPanelTab === 'events' ? (
              <div className="space-y-3">
                {!isCalendarConnected ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">No calendar connected.</p>
                    <button
                      onClick={connectCalendar}
                      className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700"
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                ) : isCalendarLoading ? (
                  <p className="text-sm text-gray-400">Loading events…</p>
                ) : (() => {
                  const dayEvents = calendarEvents.filter(e => e.dateStr === panelDateStr)
                  if (dayEvents.length === 0) {
                    return <p className="text-sm text-gray-400">No events this day.</p>
                  }
                  return dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="flex gap-2.5 w-full text-left hover:bg-gray-50 rounded-lg p-1 -ml-1 transition-colors"
                    >
                      <div
                        className="w-0.5 rounded-full flex-shrink-0 self-stretch"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        {!event.allDay && (
                          <p className="text-xs text-brand-300">
                            {formatEventTime(event.startISO, timezone)} – {formatEventTime(event.endISO, timezone)}
                          </p>
                        )}
                        {event.meetLink && (
                          <a
                            href={event.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            🎥 Join →
                          </a>
                        )}
                      </div>
                    </button>
                  ))
                })()}
              </div>
            ) : (
              <div className="space-y-5">
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
            )}
          </div>

        </div>

      </div>

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        timezone={timezone}
        onClose={() => setSelectedEvent(null)}
      />

    </div>
  )
}
