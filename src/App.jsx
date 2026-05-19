import { useState } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import MainHeader from './components/MainHeader'
import DailyView from './views/DailyView'
import CalendarView from './views/CalendarView'
import { useTasks } from './hooks/useTasks'
import { useNotes } from './hooks/useNotes'
import { addDays, addMonths, toDateString } from './utils/dateUtils'

const USER_NAME = 'Brooke'

export default function App() {
  const [view, setView] = useState('daily')
  const [date, setDate] = useState(() => new Date())

  const { tasks, addTask, updateTask, deleteTask } = useTasks()
  const { notes, setNote } = useNotes()

  function handlePrev() {
    setDate((d) => (view === 'daily' ? addDays(d, -1) : addMonths(d, -1)))
  }

  function handleNext() {
    setDate((d) => (view === 'daily' ? addDays(d, 1) : addMonths(d, 1)))
  }

  function handleSelectDay(newDate) {
    setDate(newDate)
    setView('daily')
  }

  const dateStr = toDateString(date)

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* Sidebar — desktop only */}
      <Sidebar view={view} setView={setView} />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile-only top bar */}
        <div className="md:hidden h-12 flex items-center px-4 border-b border-gray-100 shrink-0">
          <span className="font-bold text-indigo-600 tracking-tight">ZealHub</span>
          <span className="ml-auto text-sm text-gray-400">{USER_NAME}</span>
        </div>

        {/* Main header — always visible */}
        <MainHeader view={view} date={date} onPrev={handlePrev} onNext={handleNext} />

        {/* View content */}
        <main className="flex-1 overflow-y-auto md:overflow-hidden pb-14 md:pb-0">
          {view === 'daily' ? (
            <DailyView
              tasks={tasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              dateStr={dateStr}
              note={notes[dateStr] ?? ''}
              onNoteChange={(text) => setNote(dateStr, text)}
            />
          ) : (
            <CalendarView
              date={date}
              tasks={tasks}
              onSelectDay={handleSelectDay}
            />
          )}
        </main>

      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav view={view} setView={setView} />

    </div>
  )
}
