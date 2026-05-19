import { useState, useCallback } from 'react'

// Task shape:
// {
//   id: string,
//   title: string,
//   description: string,
//   status: 'todo' | 'in_progress' | 'done',
//   priority: 'low' | 'medium' | 'high',
//   date: string | null,      // YYYY-MM-DD — which day this task belongs to
//   tags: string[],
//   createdAt: string,        // ISO datetime
//   updatedAt: string,        // ISO datetime
// }

const STORAGE_KEY = 'zealhub_tasks'

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const STATUSES = ['todo', 'in_progress', 'done']
export const PRIORITIES = ['low', 'medium', 'high']

export function useTasks() {
  const [tasks, setTasks] = useState(loadFromStorage)

  // Single write path: always keeps React state and localStorage in sync.
  const persist = useCallback((updater) => {
    setTasks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addTask = useCallback((fields = {}) => {
    const now = new Date().toISOString()
    const task = {
      id: generateId(),
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      date: null,
      projectId: null,
      tags: [],
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    persist((prev) => [...prev, task])
    return task
  }, [persist])

  const updateTask = useCallback((id, changes) => {
    persist((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...changes, updatedAt: new Date().toISOString() }
          : t
      )
    )
  }, [persist])

  const deleteTask = useCallback((id) => {
    persist((prev) => prev.filter((t) => t.id !== id))
  }, [persist])

  // Move a task from one index to another (for drag-and-drop reordering).
  const reorderTasks = useCallback((fromIndex, toIndex) => {
    persist((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [persist])

  const clearCompleted = useCallback(() => {
    persist((prev) => prev.filter((t) => t.status !== 'done'))
  }, [persist])

  const copyTasks = useCallback((sourceTasks, targetDate) => {
    const now = new Date().toISOString()
    const copies = sourceTasks.map((t) => ({
      ...t,
      id: generateId(),
      date: targetDate,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    }))
    persist((prev) => [...prev, ...copies])
  }, [persist])

  return { tasks, addTask, updateTask, deleteTask, reorderTasks, clearCompleted, copyTasks }
}
