import { useState } from 'react'
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import MainHeader from './components/MainHeader'
import AddProjectModal from './components/AddProjectModal'
import DailyView from './views/DailyView'
import CalendarView from './views/CalendarView'
import ProjectView from './views/ProjectView'
import WelcomePage from './pages/WelcomePage'
import { useTasks } from './hooks/useTasks'
import { useNotes } from './hooks/useNotes'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import { addDays, addMonths, toDateString } from './utils/dateUtils'

function MainApp({ onLogout }) {
  const [view, setView]                     = useState('daily')
  const [date, setDate]                     = useState(() => new Date())
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showAddProject, setShowAddProject]   = useState(false)

  const { tasks, addTask, updateTask, deleteTask, copyTasks } = useTasks()
  const { notes, setNote }                               = useNotes()
  const { projects, addProject, updateProject, deleteProject } = useProjects()

  function navigateToView(v) {
    setView(v)
    setActiveProjectId(null)
  }

  function navigateToProject(id) {
    setActiveProjectId(id)
    setView('project')
  }

  function handleDeleteProject(id) {
    tasks.filter((t) => t.projectId === id).forEach((t) => deleteTask(t.id))
    deleteProject(id)
    if (activeProjectId === id) navigateToView('daily')
  }

  function handlePrev() {
    setDate((d) => (view === 'daily' ? addDays(d, -1) : addMonths(d, -1)))
  }

  function handleNext() {
    setDate((d) => (view === 'daily' ? addDays(d, 1) : addMonths(d, 1)))
  }

  function handleSelectDay(newDate) {
    setDate(newDate)
    navigateToView('daily')
  }

  const dateStr       = toDateString(date)
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      <Sidebar
        view={view}
        setView={navigateToView}
        onLogout={onLogout}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={navigateToProject}
        onAddProject={() => setShowAddProject(true)}
      />

      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden h-12 flex items-center px-4 border-b border-gray-100 shrink-0">
          <span className="font-bold text-brand-600 tracking-tight">ZealHub</span>
        </div>

        <MainHeader
          view={view}
          date={date}
          onPrev={handlePrev}
          onNext={handleNext}
          projectName={activeProject?.name}
        />

        <main className="flex-1 overflow-y-auto md:overflow-hidden pb-14 md:pb-0">
          {view === 'daily' && (
            <DailyView
              tasks={tasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              copyTasks={copyTasks}
              dateStr={dateStr}
              note={notes[dateStr] ?? ''}
              onNoteChange={(text) => setNote(dateStr, text)}
              projects={projects}
            />
          )}
          {view === 'calendar' && (
            <CalendarView
              date={date}
              tasks={tasks}
              projects={projects}
              onSelectDay={handleSelectDay}
              onSelectProject={navigateToProject}
            />
          )}
          {view === 'project' && activeProject && (
            <ProjectView
              project={activeProject}
              onUpdate={updateProject}
              onDelete={handleDeleteProject}
            />
          )}
        </main>

      </div>

      <BottomNav
        view={view}
        activeProjectId={activeProjectId}
        setView={navigateToView}
        projects={projects}
        onSelectProject={navigateToProject}
      />

      {showAddProject && (
        <AddProjectModal
          onAdd={addProject}
          onClose={() => setShowAddProject(false)}
        />
      )}

    </div>
  )
}

export default function App() {
  const { user, login, logout } = useAuth()

  function handleLogout() {
    googleLogout()
    logout()
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      {user
        ? <MainApp onLogout={handleLogout} />
        : <WelcomePage onLogin={login} />
      }
    </GoogleOAuthProvider>
  )
}
