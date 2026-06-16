import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import logo from '../../assets/Dayra_Main_Logo.png'
import api from '../../api/axios'

interface Task {
  id: number
  name: string
  priority: 'High' | 'Medium' | 'Low'
  completed: boolean
  selected: boolean
}

type TaskMap = Record<string, Task[]>

const priorityColors = {
  High: { bg: '#FFE5E5', text: '#C0392B' },
  Medium: { bg: '#FFF3CD', text: '#B7770D' },
  Low: { bg: '#E5F5E5', text: '#2D6A4F' },
}

const priorityOrder = { High: 0, Medium: 1, Low: 2 }

let taskIdCounter = 1

const formatDate = (date: Date) => date.toISOString().split('T')[0]

const Planner = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [taskMap, setTaskMap] = useState<TaskMap>({})
  const [taskIds, setTaskIds] = useState<Record<number, string>>({})
  const [removeMode, setRemoveMode] = useState(false)
  const [datesWithTasks, setDatesWithTasks] = useState<string[]>([])

  const dateKey = formatDate(selectedDate)
  const rawTasks = taskMap[dateKey] || []

  const activeTasks = rawTasks
    .filter((t) => !t.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const completedTasks = rawTasks.filter((t) => t.completed)

  const updateTasks = (newTasks: Task[]) => {
    setTaskMap((prev) => ({ ...prev, [dateKey]: newTasks }))
    // Update datesWithTasks
    if (newTasks.length > 0) {
      setDatesWithTasks((prev) => [...new Set([...prev, dateKey])])
    } else {
      setDatesWithTasks((prev) => prev.filter((d) => d !== dateKey))
    }
  }

  // Load ALL task dates on mount for calendar highlighting
  useEffect(() => {
    const loadAllTaskDates = async () => {
      try {
        const response = await api.get('/api/tasks/all-dates')
        setDatesWithTasks(response.data.dates)
      } catch (error) {
        console.error('Failed to load task dates', error)
      }
    }
    loadAllTaskDates()
  }, [])

  // Load tasks for selected date
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await api.get(`/api/tasks/${dateKey}`)
        const loaded: Task[] = response.data.tasks.map((t: any) => ({
          id: taskIdCounter++,
          name: t.name,
          priority: t.priority,
          completed: t.completed,
          selected: false
        }))
        const ids: Record<number, string> = {}
        response.data.tasks.forEach((t: any, i: number) => {
          ids[loaded[i].id] = t.id
        })
        setTaskIds((prev) => ({ ...prev, ...ids }))
        setTaskMap((prev) => ({ ...prev, [dateKey]: loaded }))
      } catch (error) {
        console.error('Failed to load tasks', error)
      }
    }
    loadTasks()
  }, [dateKey])

  const handleAddTask = async () => {
    const newTask: Task = {
      id: taskIdCounter++,
      name: '',
      priority: 'Medium',
      completed: false,
      selected: false,
    }
    updateTasks([...rawTasks, newTask])
    try {
      const response = await api.post('/api/tasks/add', {
        date: dateKey,
        name: '',
        priority: 'Medium',
        completed: false
      })
      setTaskIds((prev) => ({ ...prev, [newTask.id]: response.data.task_id }))
    } catch (error) {
      console.error('Failed to add task', error)
    }
  }

  const handleTaskNameChange = (id: number, value: string) => {
    updateTasks(rawTasks.map((t) => (t.id === id ? { ...t, name: value } : t)))
  }

  const handleTaskNameBlur = async (id: number, value: string) => {
    try {
      const mongoId = taskIds[id]
      if (mongoId) {
        await api.put(`/api/tasks/update/${mongoId}`, { name: value })
      }
    } catch (error) {
      console.error('Failed to update task name', error)
    }
  }

  const handlePriorityChange = async (id: number, value: 'High' | 'Medium' | 'Low') => {
    updateTasks(rawTasks.map((t) => (t.id === id ? { ...t, priority: value } : t)))
    try {
      const mongoId = taskIds[id]
      if (mongoId) {
        await api.put(`/api/tasks/update/${mongoId}`, { priority: value })
      }
    } catch (error) {
      console.error('Failed to update priority', error)
    }
  }

  const handleToggleComplete = async (id: number) => {
    const task = rawTasks.find((t) => t.id === id)
    updateTasks(rawTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
    try {
      const mongoId = taskIds[id]
      if (mongoId) {
        await api.put(`/api/tasks/update/${mongoId}`, { completed: !task?.completed })
      }
    } catch (error) {
      console.error('Failed to toggle complete', error)
    }
  }

  const handleToggleSelect = (id: number) => {
    updateTasks(rawTasks.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)))
  }

  const handleRemoveTasks = async () => {
    if (removeMode) {
      const toRemove = rawTasks.filter((t) => t.selected)
      for (const task of toRemove) {
        try {
          const mongoId = taskIds[task.id]
          if (mongoId) {
            await api.delete(`/api/tasks/delete/${mongoId}`)
          }
        } catch (error) {
          console.error('Failed to delete task', error)
        }
      }
      const remaining = rawTasks.filter((t) => !t.selected)
      updateTasks(remaining)
      setRemoveMode(false)
    } else {
      setRemoveMode(true)
    }
  }

  const handleClearCompleted = async () => {
    try {
      await api.delete(`/api/tasks/clear-completed/${dateKey}`)
      const remaining = rawTasks.filter((t) => !t.completed)
      updateTasks(remaining)
    } catch (error) {
      console.error('Failed to clear completed', error)
    }
  }

  const tileClassName = ({ date }: { date: Date }) => {
    const key = formatDate(date)
    if (datesWithTasks.includes(key)) return 'has-tasks'
    return null
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >

      <style>{`
        .has-tasks {
          background-color: #FFD700 !important;
          color: #333 !important;
          border-radius: 6px;
          font-weight: bold;
        }
        .react-calendar {
          background-color: #FAF7F2 !important;
          border: none !important;
          color: #3d3535 !important;
          border-radius: 0 0 16px 16px;
          width: 100% !important;
          padding: 12px;
        }
        .react-calendar__tile {
          color: #3d3535 !important;
          border-radius: 6px !important;
          padding: 10px 6px !important;
        }
        .react-calendar__tile:hover {
          background-color: #e8f5e9 !important;
        }
        .react-calendar__tile--active {
          background-color: #4A9B6F !important;
          color: white !important;
          border-radius: 6px !important;
          border: 2px solid #4A9B6F !important;
        }
        .react-calendar__tile--now {
          background-color: #e8f5e9 !important;
          border: 1px solid #4A9B6F !important;
        }
        .react-calendar__navigation button {
          color: #3d3535 !important;
          font-size: 14px !important;
          background: transparent !important;
        }
        .react-calendar__navigation button:hover {
          background-color: #e8f5e9 !important;
          border-radius: 6px !important;
        }
        .react-calendar__month-view__weekdays {
          color: #4A9B6F !important;
          font-size: 12px !important;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none !important;
        }
      `}</style>

      {/* TOP NAV */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          onClick={() => navigate('/home')}
          className="text-gray-700 hover:text-gray-900 transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Task Manager</h1>
        <img src={logo} alt="Dayra" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col md:flex-row gap-4 flex-1">

        {/* LEFT — CALENDAR */}
        <div className="flex flex-col w-full md:w-auto">
          <div
            className="px-5 py-3 rounded-t-2xl w-fit"
            style={{ backgroundColor: '#FAF7F2' }}
          >
            <h2 className="text-xl font-bold text-gray-800">Calendar</h2>
          </div>
          <div className="rounded-b-2xl rounded-tr-2xl overflow-hidden shadow-md">
            <Calendar
              onChange={(val) => setSelectedDate(val as Date)}
              value={selectedDate}
              tileClassName={tileClassName}
            />
          </div>
          <div className="flex items-center gap-2 mt-2 px-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFD700' }} />
            <span className="text-xs text-gray-700">Has tasks</span>
          </div>
        </div>

        {/* RIGHT — TASKS */}
        <div className="flex-1 flex flex-col">
          <div
            className="px-5 py-3 rounded-t-2xl w-fit"
            style={{ backgroundColor: '#FAF7F2' }}
          >
            <h2 className="text-xl font-bold text-gray-800">
              Tasks —{' '}
              <span className="text-base font-medium text-gray-500">
                {selectedDate.toDateString()}
              </span>
            </h2>
          </div>
          <div
            className="flex-1 rounded-b-2xl rounded-tr-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-md"
            style={{ backgroundColor: '#FAF7F2' }}
          >

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddTask}
                className="px-4 py-2 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#4A9B6F' }}
              >
                + Add Task
              </button>
              <button
                onClick={handleRemoveTasks}
                className="px-4 py-2 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: removeMode ? '#C0392B' : '#4A9B6F' }}
              >
                {removeMode ? '🗑️ Confirm Remove' : '- Remove Task'}
              </button>
              {removeMode && (
                <button
                  onClick={() => {
                    setRemoveMode(false)
                    updateTasks(rawTasks.map((t) => ({ ...t, selected: false })))
                  }}
                  className="px-4 py-2 rounded-full text-gray-700 font-semibold text-sm"
                  style={{ backgroundColor: '#e0e0e0' }}
                >
                  Cancel
                </button>
              )}
              {completedTasks.length > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="px-4 py-2 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#888' }}
                >
                  🧹 Clear Completed
                </button>
              )}
            </div>

            {/* REMOVE MODE HINT */}
            {removeMode && (
              <p className="text-sm text-gray-500 italic flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-800 inline-block" />
                Select the tasks to be removed
              </p>
            )}

            {/* ACTIVE TASKS */}
            <div className="flex flex-col gap-3 overflow-y-auto max-h-64">
              {activeTasks.length === 0 && (
                <p className="text-gray-400 italic text-sm text-center mt-4">
                  No tasks for {selectedDate.toDateString()} 🌱
                </p>
              )}
              {activeTasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: removeMode && task.selected ? '#3d3535' : 'transparent',
                      border: '2px solid #4A9B6F',
                      color: removeMode && task.selected ? 'white' : '#4A9B6F'
                    }}
                  >
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => handleTaskNameChange(task.id, e.target.value)}
                    onBlur={(e) => handleTaskNameBlur(task.id, e.target.value)}
                    placeholder="Task name..."
                    className="flex-1 bg-transparent outline-none border-b text-gray-700 text-sm sm:text-base py-1"
                    style={{ borderColor: '#4A9B6F' }}
                  />
                  <select
                    value={task.priority}
                    onChange={(e) => handlePriorityChange(task.id, e.target.value as 'High' | 'Medium' | 'Low')}
                    className="text-xs px-2 py-1 rounded-full outline-none font-semibold"
                    style={{
                      backgroundColor: priorityColors[task.priority].bg,
                      color: priorityColors[task.priority].text,
                    }}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                  {removeMode ? (
                    <input
                      type="checkbox"
                      checked={task.selected}
                      onChange={() => handleToggleSelect(task.id)}
                      className="w-4 h-4 accent-green-600 flex-shrink-0"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task.id)}
                      className="w-4 h-4 accent-green-600 flex-shrink-0"
                      title="Mark as complete"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* COMPLETED TASKS */}
            {completedTasks.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">✅ Completed</p>
                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                  {completedTasks.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-3 opacity-50">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ border: '2px solid #4A9B6F', color: '#4A9B6F' }}
                      >
                        {index + 1}
                      </div>
                      <span className="flex-1 text-gray-500 text-sm line-through">
                        {task.name || 'Unnamed task'}
                      </span>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggleComplete(task.id)}
                        className="w-4 h-4 accent-green-600 flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default Planner