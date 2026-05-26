import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import MainHeader from './components/MainHeader'
import AddProjectModal from './components/AddProjectModal'
import SearchModal from './components/SearchModal'
import DailyView from './views/DailyView'
import CalendarView from './views/CalendarView'
import ProjectView from './views/ProjectView'
import WelcomePage from './pages/WelcomePage'
import { useTasks } from './hooks/useTasks'
import { useNotes } from './hooks/useNotes'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import { addDays, addMonths, toDateString } from './utils/dateUtils'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
    </div>
  )
}

function MainApp({ user, onLogout }) {
  const [view, setView]                       = useState('daily')
  const [date, setDate]                       = useState(() => new Date())
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showAddProject, setShowAddProject]   = useState(false)
  const [showSearch, setShowSearch]           = useState(false)

  const { tasks, addTask, updateTask, deleteTask, copyTasks, reorderTasks } = useTasks(user.id)
  const { notes, setNote }                                                   = useNotes(user.id)
  const { projects, addProject, updateProject, deleteProject }               = useProjects(user.id)
  const { events: calendarEvents, isConnected: isCalendarConnected, isLoading: isCalendarLoading, connectCalendar, disconnectCalendar } = useGoogleCalendar({ userId: user.id, date })

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

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

  function handleArchiveProject(id) {
    updateProject(id, { archived: true })
    if (activeProjectId === id) navigateToView('daily')
  }

  function handleToday() {
    setDate(new Date())
    if (view === 'project') navigateToView('daily')
  }

  function handleSearchNavigate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    setDate(new Date(y, m - 1, d))
    navigateToView('daily')
    setShowSearch(false)
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
        onOpenSearch={() => setShowSearch(true)}
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
          onToday={handleToday}
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
              reorderTasks={reorderTasks}
              dateStr={dateStr}
              note={notes[dateStr] ?? ''}
              onNoteChange={(text) => setNote(dateStr, text)}
              projects={projects}
              userEmail={user.email}
            />
          )}
          {view === 'calendar' && (
            <CalendarView
              date={date}
              tasks={tasks}
              projects={projects}
              onSelectDay={handleSelectDay}
              onSelectProject={navigateToProject}
              calendarEvents={calendarEvents}
              isCalendarConnected={isCalendarConnected}
              isCalendarLoading={isCalendarLoading}
              connectCalendar={connectCalendar}
              disconnectCalendar={disconnectCalendar}
            />
          )}
          {view === 'project' && activeProject && (
            <ProjectView
              project={activeProject}
              onUpdate={updateProject}
              onDelete={handleDeleteProject}
              onArchive={handleArchiveProject}
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

      {showSearch && (
        <SearchModal
          tasks={tasks}
          projects={projects}
          onNavigate={handleSearchNavigate}
          onClose={() => setShowSearch(false)}
        />
      )}

    </div>
  )
}

export default function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      {user
        ? <MainApp user={user} onLogout={logout} />
        : <WelcomePage onLogin={login} />
      }
    </GoogleOAuthProvider>
  )
}
