import { calendarGrid, toDateString, isSameDay } from '../utils/dateUtils'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarView({ date, tasks, onSelectDay }) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const weeks = calendarGrid(year, month)
  const today = new Date()

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-lg mx-auto md:mx-0">

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2 select-none">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={`e-${wi}-${di}`} className="aspect-square" />
              }

              const cellDate = new Date(year, month, day)
              const dateStr = toDateString(cellDate)
              const taskCount = tasks.filter((t) => t.date === dateStr).length
              const isToday = isSameDay(cellDate, today)
              const isSelected = isSameDay(cellDate, date)

              return (
                <button
                  key={day}
                  onClick={() => onSelectDay(cellDate)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl m-0.5 transition-colors relative
                    ${isSelected ? 'bg-indigo-600 text-white' : ''}
                    ${isToday && !isSelected ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}
                    ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
                  `}
                >
                  <span className="text-sm leading-none">{day}</span>
                  {taskCount > 0 && (
                    <span
                      className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white/70' : 'bg-indigo-400'}`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}

      </div>
    </div>
  )
}
