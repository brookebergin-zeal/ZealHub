import { useState } from 'react'

export default function TaskChecklist({ tasks, onAdd, onToggle, onDelete }) {
  const [input, setInput] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tasks</h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Add
        </button>
      </form>

      <ul className="flex-1 overflow-y-auto space-y-1">
        {tasks.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-10">No tasks for this day.</li>
        )}
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2.5 py-1.5 group">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={(e) => onToggle(task.id, e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600 shrink-0 cursor-pointer"
            />
            <span
              className={`flex-1 text-sm leading-snug ${
                task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'
              }`}
            >
              {task.title}
            </span>
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
