import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function dbToTask(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    status:      row.status,
    priority:    row.priority,
    date:        row.date,
    projectId:   row.project_id,
    tags:        row.tags ?? [],
    sortOrder:   row.sort_order,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

export const STATUSES   = ['todo', 'in_progress', 'done']
export const PRIORITIES = ['low', 'medium', 'high']

export function useTasks(userId) {
  const [tasks, setTasks] = useState([])
  const tasksRef = useRef([])

  useEffect(() => { tasksRef.current = tasks }, [tasks])

  useEffect(() => {
    if (!userId) { setTasks([]); return }
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setTasks(data.map(dbToTask)) })
  }, [userId])

  const addTask = useCallback((fields = {}) => {
    if (!userId) return
    const now  = new Date().toISOString()
    const task = {
      id:          generateId(),
      title:       '',
      description: '',
      status:      'todo',
      priority:    'medium',
      date:        null,
      projectId:   null,
      tags:        [],
      sortOrder:   Date.now(),
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    setTasks((prev) => [...prev, task])
    supabase.from('tasks').insert({
      id:          task.id,
      user_id:     userId,
      title:       task.title,
      description: task.description,
      status:      task.status,
      priority:    task.priority,
      date:        task.date,
      project_id:  task.projectId,
      tags:        task.tags,
      sort_order:  task.sortOrder,
      created_at:  task.createdAt,
      updated_at:  task.updatedAt,
    }).then(() => {})
    return task
  }, [userId])

  const updateTask = useCallback((id, changes) => {
    if (!userId) return
    const updatedAt = new Date().toISOString()
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, ...changes, updatedAt } : t)
    )
    const db = { updated_at: updatedAt }
    if ('title'       in changes) db.title       = changes.title
    if ('description' in changes) db.description = changes.description
    if ('status'      in changes) db.status      = changes.status
    if ('priority'    in changes) db.priority    = changes.priority
    if ('date'        in changes) db.date        = changes.date
    if ('projectId'   in changes) db.project_id  = changes.projectId
    if ('tags'        in changes) db.tags        = changes.tags
    supabase.from('tasks').update(db).eq('id', id).eq('user_id', userId).then(() => {})
  }, [userId])

  const deleteTask = useCallback((id) => {
    if (!userId) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
    supabase.from('tasks').delete().eq('id', id).eq('user_id', userId).then(() => {})
  }, [userId])

  const reorderTasks = useCallback((fromIndex, toIndex) => {
    if (!userId || fromIndex === toIndex) return
    const current = tasksRef.current
    const next = [...current]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)

    // Fractional sort_order: only the moved task needs updating
    const prevOrder = toIndex > 0 ? (next[toIndex - 1].sortOrder ?? 0) : 0
    const nextOrder = toIndex < next.length - 1
      ? (next[toIndex + 1].sortOrder ?? prevOrder + 2000)
      : prevOrder + 2000
    const newOrder = Math.floor((prevOrder + nextOrder) / 2)

    const updated = next.map((t, i) => i === toIndex ? { ...t, sortOrder: newOrder } : t)
    setTasks(updated)
    supabase.from('tasks').update({ sort_order: newOrder }).eq('id', moved.id).eq('user_id', userId).then(() => {})
  }, [userId])

  const clearCompleted = useCallback(() => {
    if (!userId) return
    setTasks((prev) => {
      const completedIds = prev.filter((t) => t.status === 'done').map((t) => t.id)
      if (completedIds.length > 0) {
        supabase.from('tasks').delete().in('id', completedIds).eq('user_id', userId).then(() => {})
      }
      return prev.filter((t) => t.status !== 'done')
    })
  }, [userId])

  const copyTasks = useCallback((sourceTasks, targetDate) => {
    if (!userId) return
    const now    = new Date().toISOString()
    const copies = sourceTasks.map((t, i) => ({
      ...t,
      id:        generateId(),
      date:      targetDate,
      status:    'todo',
      sortOrder: Date.now() + i,
      createdAt: now,
      updatedAt: now,
    }))
    setTasks((prev) => [...prev, ...copies])
    supabase.from('tasks').insert(copies.map((t) => ({
      id:          t.id,
      user_id:     userId,
      title:       t.title,
      description: t.description,
      status:      t.status,
      priority:    t.priority,
      date:        t.date,
      project_id:  t.projectId,
      tags:        t.tags,
      sort_order:  t.sortOrder,
      created_at:  t.createdAt,
      updated_at:  t.updatedAt,
    }))).then(() => {})
  }, [userId])

  return { tasks, addTask, updateTask, deleteTask, reorderTasks, clearCompleted, copyTasks }
}
