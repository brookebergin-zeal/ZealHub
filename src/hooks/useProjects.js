import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const PALETTE = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6']

function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function dbToProject(row) {
  return {
    id:          row.id,
    name:        row.name,
    startDate:   row.start_date,
    endDate:     row.end_date,
    teamMembers: row.team_members ?? [],
    notes:       row.notes,
    color:       row.color,
    archived:    row.archived,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

export function useProjects(userId) {
  const [projects, setProjects] = useState([])
  const projectsRef = useRef([])

  useEffect(() => { projectsRef.current = projects }, [projects])

  useEffect(() => {
    if (!userId) { setProjects([]); return }
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setProjects(data.map(dbToProject)) })
  }, [userId])

  const addProject = useCallback((fields = {}) => {
    if (!userId) return
    const id    = generateId()
    const now   = new Date().toISOString()
    const color = PALETTE[projectsRef.current.length % PALETTE.length]
    const newProject = {
      id,
      name:        '',
      startDate:   '',
      endDate:     null,
      teamMembers: [],
      notes:       '',
      color,
      archived:    false,
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    setProjects((prev) => [...prev, newProject])
    supabase.from('projects').insert({
      id,
      user_id:      userId,
      name:         newProject.name,
      start_date:   newProject.startDate,
      end_date:     newProject.endDate,
      team_members: newProject.teamMembers,
      notes:        newProject.notes,
      color:        newProject.color,
      archived:     newProject.archived,
      created_at:   now,
      updated_at:   now,
    }).then(() => {})
    return id
  }, [userId])

  const updateProject = useCallback((id, changes) => {
    if (!userId) return
    const updatedAt = new Date().toISOString()
    setProjects((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...changes, updatedAt } : p)
    )
    const db = { updated_at: updatedAt }
    if ('name'        in changes) db.name         = changes.name
    if ('startDate'   in changes) db.start_date   = changes.startDate
    if ('endDate'     in changes) db.end_date     = changes.endDate
    if ('teamMembers' in changes) db.team_members = changes.teamMembers
    if ('notes'       in changes) db.notes        = changes.notes
    if ('color'       in changes) db.color        = changes.color
    if ('archived'    in changes) db.archived     = changes.archived
    supabase.from('projects').update(db).eq('id', id).eq('user_id', userId).then(() => {})
  }, [userId])

  const deleteProject = useCallback((id) => {
    if (!userId) return
    setProjects((prev) => prev.filter((p) => p.id !== id))
    supabase.from('projects').delete().eq('id', id).eq('user_id', userId).then(() => {})
  }, [userId])

  return { projects, addProject, updateProject, deleteProject }
}
