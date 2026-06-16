import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/Dayra_Main_Logo.png'

const DEFAULT_WORK_MINUTES = 25

const motivationalQuotes = [
  "You got this! One session at a time. 💪",
  "Focus is a superpower. Use it wisely. 🧠",
  "Small steps every day = big results. 🌱",
  "Stay locked in. The world can wait. 🔒",
  "Progress over perfection. Always. ✨",
  "Your future self will thank you. 🙌",
  "Deep work = deep results. 🚀",
]

interface Session {
  id: number
  name: string
  duration: string
}

const Pomodoro = () => {
  const navigate = useNavigate()
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES)
  const WORK_TIME = workMinutes * 60
  const [timeLeft, setTimeLeft] = useState(WORK_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [editingSession, setEditingSession] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showEditTimer, setShowEditTimer] = useState(false)
  const [editMinutes, setEditMinutes] = useState(String(DEFAULT_WORK_MINUTES))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionCount = useRef(0)

  // TIMER
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [isRunning])

  // SESSION COMPLETION — runs once when timeLeft actually reaches 0 while running
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      setIsRunning(false)
      handleSessionComplete()
    }
  }, [timeLeft, isRunning])

  // ROTATE QUOTES every 10 seconds
  useEffect(() => {
    const q = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length)
    }, 10000)
    return () => clearInterval(q)
  }, [])

  const handleSessionComplete = () => {
    sessionCount.current += 1
    setSessions((prev) => [
      ...prev,
      {
        id: sessionCount.current,
        name: sessionName.trim() || `Session ${sessionCount.current}`,
        duration: `${String(workMinutes).padStart(2, '0')}:00`
      }
    ])
    setSessionName('')
    setTimeLeft(WORK_TIME)
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(WORK_TIME)
  }

  const handleApplyTimer = () => {
    const parsed = parseInt(editMinutes, 10)
    const mins = Math.min(180, Math.max(1, isNaN(parsed) ? workMinutes : parsed))
    setWorkMinutes(mins)
    setTimeLeft(mins * 60)
    setIsRunning(false)
    setEditMinutes(String(mins))
    setShowEditTimer(false)
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  // CIRCULAR PROGRESS
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / WORK_TIME
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >

      {/* TOP NAV */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => navigate('/home')}
          className="text-gray-700 hover:text-gray-900 transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pomodoro</h1>
        <img src={logo} alt="Dayra" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
      </div>

      {/* MOTIVATIONAL QUOTE */}
      <div className="flex flex-col items-center mt-3 gap-1">
        <p
          key={quoteIndex}
          className="text-sm sm:text-base italic text-gray-700 text-center transition-all duration-700"
        >
          {motivationalQuotes[quoteIndex]}
        </p>
        <div className="w-48 sm:w-64 h-px" style={{ backgroundColor: '#4A9B6F', opacity: 0.4 }} />
      </div>

      {/* TIMER CIRCLE */}
      <div className="flex items-center justify-center mt-4 sm:mt-6">
        <div className="relative flex items-center justify-center">
          <svg
            className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 -rotate-90"
            viewBox="0 0 280 280"
          >
            {/* BG CIRCLE */}
            <circle cx="140" cy="140" r={radius} fill="#F5F0E8" stroke="#c8e6c9" strokeWidth="12" />
            {/* PROGRESS RING */}
            <circle
              cx="140" cy="140" r={radius}
              fill="transparent"
              stroke="#2D6A4F"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          {/* TIME */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-wider">
              {minutes}:{seconds}
            </span>
            {isRunning && (
              <span className="text-xs text-gray-500 mt-1 italic">focusing...</span>
            )}
          </div>
        </div>
      </div>

      {/* SESSION NAME INPUT + EDIT TIMER */}
      <div className="flex justify-center items-center gap-2 mt-4 px-4">
        <div className="relative flex items-center gap-2 w-full max-w-sm">
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Name this session... (e.g. Studying, Reading)"
            className="flex-1 px-4 py-2 rounded-full outline-none text-gray-700 text-sm text-center"
            style={{ backgroundColor: '#F5F0E8' }}
          />

          {/* EDIT TIMER BUTTON */}
          <button
            onClick={() => {
              setEditMinutes(String(workMinutes))
              setShowEditTimer(!showEditTimer)
            }}
            disabled={isRunning}
            className="px-4 py-2 rounded-full text-white font-semibold text-xs sm:text-sm whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: '#4A9B6F' }}
          >
            ⏱ Edit Timer
          </button>

          {/* EDIT TIMER POPUP */}
          {showEditTimer && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowEditTimer(false)} />
              <div
                className="absolute right-0 top-12 z-50 p-4 rounded-2xl shadow-xl flex flex-col gap-3 w-56"
                style={{ backgroundColor: '#FAF7F2', border: '1px solid #C8E6C9' }}
              >
                <label className="text-sm text-gray-700 font-medium text-center">
                  Set focus duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-4 py-2 rounded-full outline-none text-gray-700 text-sm text-center"
                  style={{ backgroundColor: '#D4F5D4' }}
                />
                <button
                  onClick={handleApplyTimer}
                  className="w-full py-2 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#4A9B6F' }}
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex justify-center gap-3 sm:gap-6 mt-4 sm:mt-6">
        <button
          onClick={handlePause}
          disabled={!isRunning}
          className="px-5 sm:px-8 py-3 rounded-full text-white font-bold text-sm sm:text-base tracking-widest transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#4A9B6F' }}
        >
          PAUSE
        </button>
        <button
          onClick={handleStart}
          disabled={isRunning || timeLeft === 0}
          className="px-5 sm:px-8 py-3 rounded-full text-white font-bold text-sm sm:text-base tracking-widest transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#4A9B6F' }}
        >
          START
        </button>
        <button
          onClick={handleReset}
          className="px-5 sm:px-8 py-3 rounded-full text-white font-bold text-sm sm:text-base tracking-widest transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#4A9B6F' }}
        >
          RESET
        </button>
      </div>

      {/* SESSION HISTORY */}
      {sessions.length > 0 && (
        <div className="mt-6 px-2 sm:px-6 pb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2 className="text-center text-sm sm:text-base font-semibold text-gray-700">
              🏆 Sessions Completed
            </h2>
            <button
              onClick={() => setSessions([])}
              className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C0392B' }}
            >
              Clear Sessions
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
            {[...sessions].reverse().map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-2 rounded-full text-sm"
                style={{ backgroundColor: '#F5F0E8' }}
              >
                {/* SESSION NAME — click to edit */}
                {editingSession === s.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      setSessions((prev) =>
                        prev.map((x) =>
                          x.id === s.id ? { ...x, name: editingName.trim() || x.name } : x
                        )
                      )
                      setEditingSession(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSessions((prev) =>
                          prev.map((x) =>
                            x.id === s.id ? { ...x, name: editingName.trim() || x.name } : x
                          )
                        )
                        setEditingSession(null)
                      }
                    }}
                    className="outline-none bg-transparent text-gray-700 font-medium w-full"
                  />
                ) : (
                  <span
                    className="text-gray-700 font-medium cursor-pointer hover:text-green-700"
                    onClick={() => { setEditingSession(s.id); setEditingName(s.name) }}
                  >
                    {s.id}. {s.name}
                  </span>
                )}
                <span className="text-gray-500 text-xs ml-4">⏱ {s.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default Pomodoro