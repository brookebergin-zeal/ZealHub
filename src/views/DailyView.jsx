import { useState, useEffect, useRef } from 'react'
import TaskChecklist from '../components/TaskChecklist'
import Notes from '../components/Notes'
import GoogleCalendarEmbed from '../components/GoogleCalendarEmbed'

function ResizeHandle({ direction, onMouseDown }) {
  const isCol = direction === 'col'
  return (
    <div
      onMouseDown={onMouseDown}
      className={`hidden md:flex items-center justify-center shrink-0 group
        bg-gray-100 hover:bg-indigo-100 transition-colors
        ${isCol ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'}`}
    >
      <div
        className={`rounded-full bg-gray-300 group-hover:bg-indigo-400 transition-colors
          ${isCol ? 'w-0.5 h-8' : 'h-0.5 w-8'}`}
      />
    </div>
  )
}

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)) }

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

function readPct(key, fallback) {
  const v = localStorage.getItem(key)
  return v !== null ? Number(v) : fallback
}

export default function DailyView({ tasks, addTask, updateTask, deleteTask, dateStr, note, onNoteChange, projects }) {
  const [leftPct, setLeftPct] = useState(() => readPct('zealhub_hsplit', 50))
  const [topPct, setTopPct]   = useState(() => readPct('zealhub_vsplit', 50))

  const isDesktop = useIsDesktop()
  const rowRef    = useRef(null)
  const rightRef  = useRef(null)

  function startHDrag(e) {
    e.preventDefault()
    const rect = rowRef.current.getBoundingClientRect()
    let latest = leftPct
    function onMove(e) {
      const val = clamp(((e.clientX - rect.left) / rect.width) * 100, 20, 80)
      latest = val
      setLeftPct(val)
    }
    function onUp() {
      localStorage.setItem('zealhub_hsplit', String(latest))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function startVDrag(e) {
    e.preventDefault()
    const rect = rightRef.current.getBoundingClientRect()
    let latest = topPct
    function onMove(e) {
      const val = clamp(((e.clientY - rect.top) / rect.height) * 100, 20, 80)
      latest = val
      setTopPct(val)
    }
    function onUp() {
      localStorage.setItem('zealhub_vsplit', String(latest))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Projects whose date range includes today
  const activeProjects = projects.filter((p) => {
    if (!p.startDate || p.startDate > dateStr) return false
    if (p.endDate && p.endDate < dateStr) return false
    return true
  })

  const generalTasks = tasks.filter((t) => !t.projectId && t.date === dateStr)

  return (
    <div ref={rowRef} className="flex flex-col md:flex-row h-full">

      {/* Left: scrollable stack of task sections */}
      <section
        className="border-b md:border-b-0 md:overflow-y-auto"
        style={isDesktop ? { width: `${leftPct}%` } : undefined}
      >
        <TaskChecklist
          title="Tasks"
          tasks={generalTasks}
          onAdd={(title) => addTask({ title, date: dateStr })}
          onToggle={(id, done) => updateTask(id, { status: done ? 'done' : 'todo' })}
          onDelete={deleteTask}
        />

        {activeProjects.map((project) => (
          <div key={project.id} className="border-t border-gray-100">
            <TaskChecklist
              title={project.name || 'Untitled Project'}
              accentColor={project.color}
              tasks={tasks.filter((t) => t.projectId === project.id && t.date === dateStr)}
              onAdd={(title) => addTask({ title, date: dateStr, projectId: project.id })}
              onToggle={(id, done) => updateTask(id, { status: done ? 'done' : 'todo' })}
              onDelete={deleteTask}
            />
          </div>
        ))}
      </section>

      {/* Handle: drag left ↔ right */}
      <ResizeHandle direction="col" onMouseDown={startHDrag} />

      {/* Right: notes + calendar */}
      <section
        ref={rightRef}
        className="flex-1 flex flex-col min-h-0 md:overflow-hidden"
      >
        <div
          className="border-b border-gray-100 h-48 md:h-auto md:overflow-hidden"
          style={isDesktop ? { height: `${topPct}%` } : undefined}
        >
          <Notes value={note} onChange={onNoteChange} />
        </div>

        <ResizeHandle direction="row" onMouseDown={startVDrag} />

        <div
          className="h-72 md:h-auto flex-1 md:flex-none md:overflow-hidden"
          style={isDesktop ? { height: `${100 - topPct}%` } : undefined}
        >
          <GoogleCalendarEmbed />
        </div>
      </section>

    </div>
  )
}
