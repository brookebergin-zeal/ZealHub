import { useState, useCallback } from 'react'

const STORAGE_KEY = 'zealhub_projects'

const PALETTE = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6']

function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Project shape:
// {
//   id: string,
//   name: string,
//   startDate: string,     // YYYY-MM-DD
//   endDate: string|null,  // YYYY-MM-DD
//   teamMembers: string[],
//   notes: string,
//   color: string,         // hex, auto-assigned from palette
//   createdAt: string,
//   updatedAt: string,
// }

export function useProjects() {
  const [projects, setProjects] = useState(load)

  const persist = useCallback((updater) => {
    setProjects((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Returns the new project's id synchronously (id is generated before the async state update)
  const addProject = useCallback((fields) => {
    const id  = generateId()
    const now = new Date().toISOString()
    persist((prev) => {
      const color = PALETTE[prev.length % PALETTE.length]
      return [...prev, {
        id,
        name: '',
        startDate: '',
        endDate: null,
        teamMembers: [],
        notes: '',
        color,
        ...fields,
        createdAt: now,
        updatedAt: now,
      }]
    })
    return id
  }, [persist])

  const updateProject = useCallback((id, changes) => {
    persist((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p
      )
    )
  }, [persist])

  const deleteProject = useCallback((id) => {
    persist((prev) => prev.filter((p) => p.id !== id))
  }, [persist])

  return { projects, addProject, updateProject, deleteProject }
}
