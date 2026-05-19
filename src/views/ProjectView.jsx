import { useState } from 'react'
import { PALETTE } from '../hooks/useProjects'

export default function ProjectView({ project, onUpdate, onDelete, onArchive }) {
  const [memberInput, setMemberInput]         = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)

  function addMember() {
    const t = memberInput.trim()
    if (!t) return
    const next = [...new Set([...(project.teamMembers || []), t])]
    onUpdate(project.id, { teamMembers: next })
    setMemberInput('')
  }

  function removeMember(name) {
    onUpdate(project.id, { teamMembers: project.teamMembers.filter((m) => m !== name) })
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-xl">

        {/* Color dot + editable name */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              className="w-5 h-5 rounded-full shrink-0 hover:ring-2 hover:ring-offset-2 hover:ring-gray-300 transition-all focus:outline-none"
              style={{ backgroundColor: project.color }}
              title="Change colour"
            />
            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-[9]" onClick={() => setShowColorPicker(false)} />
                <div className="absolute top-7 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1.5 flex-wrap w-max">
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => { onUpdate(project.id, { color: hex }); setShowColorPicker(false) }}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ${project.color === hex ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <input
            value={project.name}
            onChange={(e) => onUpdate(project.id, { name: e.target.value })}
            placeholder="Project name"
            className="text-2xl font-bold text-gray-900 bg-transparent focus:outline-none border-b-2 border-transparent focus:border-brand-400 transition-colors flex-1 min-w-0"
          />
          {project.archived && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">Archived</span>
          )}
        </div>

        <div className="space-y-6">

          {/* Dates */}
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
              <input
                type="date"
                value={project.startDate || ''}
                onChange={(e) => onUpdate(project.id, { startDate: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">End Date</p>
              <input
                type="date"
                value={project.endDate || ''}
                min={project.startDate || undefined}
                onChange={(e) => onUpdate(project.id, { endDate: e.target.value || null })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Team Members */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Team Members</p>
            <div className="flex gap-2 mb-2">
              <input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
                placeholder="Add a team member…"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={addMember}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Add
              </button>
            </div>
            {(project.teamMembers || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.teamMembers.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: project.color + '22', color: project.color }}
                  >
                    {m}
                    <button onClick={() => removeMember(m)} className="hover:opacity-60 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <textarea
              value={project.notes || ''}
              onChange={(e) => onUpdate(project.id, { notes: e.target.value })}
              placeholder="Add project notes…"
              rows={8}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

        </div>

        {/* Archive + Delete */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-6">
          <button
            onClick={() => {
              if (project.archived) {
                onUpdate(project.id, { archived: false })
              } else {
                onArchive(project.id)
              }
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {project.archived ? 'Unarchive' : 'Archive project'}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${project.name || 'this project'}"? All associated tasks will also be deleted.`)) {
                onDelete(project.id)
              }
            }}
            className="text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Delete project
          </button>
        </div>

      </div>
    </div>
  )
}
