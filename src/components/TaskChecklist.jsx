import { useState } from 'react'

function DragHandle() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-300 cursor-grab active:cursor-grabbing shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <circle cx="7"  cy="5"  r="1.4" />
      <circle cx="7"  cy="10" r="1.4" />
      <circle cx="7"  cy="15" r="1.4" />
      <circle cx="13" cy="5"  r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="13" cy="15" r="1.4" />
    </svg>
  )
}

export default function TaskChecklist({ tasks, onAdd, onToggle, onDelete, onEdit, onReorder, title = 'Tasks', accentColor }) {
  const [input, setInput]         = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [dragIdx, setDragIdx]     = useState(null)
  const [overIdx, setOverIdx]     = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  function startEdit(task) {
    setEditingId(task.id)
    setEditValue(task.title)
  }

  function commitEdit() {
    if (editingId && editValue.trim() && onEdit) onEdit(editingId, editValue.trim())
    setEditingId(null)
    setEditValue('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
  }

  function handleDrop(toIdx) {
    if (dragIdx !== null && dragIdx !== toIdx && onReorder) onReorder(dragIdx, toIdx)
    setDragIdx(null)
    setOverIdx(null)
  }

  const headerColor = accentColor ?? '#9ca3af'

  return (
    <div className="flex flex-col p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        {accentColor && (
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
        )}
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: headerColor }}>
          {title}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        />
        <button type="submit" className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors font-medium">
          Add
        </button>
      </form>

      <ul className="space-y-0.5">
        {tasks.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-4">No tasks for this day.</li>
        )}
        {tasks.map((task, i) => (
          <li
            key={task.id}
            draggable={!!onReorder}
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); setOverIdx(i) }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            className={`flex items-center gap-2 py-1.5 group border-t-2 transition-colors
              ${overIdx === i && dragIdx !== i ? 'border-brand-400' : 'border-transparent'}
              ${dragIdx === i ? 'opacity-40' : ''}`}
          >
            {onReorder && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <DragHandle />
              </span>
            )}
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={(e) => onToggle(task.id, e.target.checked)}
              className="w-4 h-4 rounded shrink-0 cursor-pointer"
              style={{ accentColor: accentColor ?? 'var(--color-brand-600)' }}
            />
            {editingId === task.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleEditKeyDown}
                className="flex-1 text-sm text-gray-700 bg-transparent border-b border-brand-400 focus:outline-none py-0.5"
              />
            ) : (
              <span
                onClick={() => onEdit && startEdit(task)}
                className={`flex-1 text-sm leading-snug
                  ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}
                  ${onEdit ? 'cursor-text hover:text-gray-900' : ''}`}
              >
                {task.title}
              </span>
            )}
            <button
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
              className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none shrink-0"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
