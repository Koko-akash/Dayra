import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

interface DiaryEntry {
  date: string
  text: string
  mood: string
  wordCount: number
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const ViewMonth = () => {
  const navigate = useNavigate()
  const today = new Date()

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [entryEmotion, setEntryEmotion] = useState<any>(null)
  const [loadingEmotion, setLoadingEmotion] = useState(false)
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const response = await api.get('/api/diary/entries')
        const entriesMap: Record<string, DiaryEntry> = {}
        response.data.entries.forEach((entry: any) => {
          entriesMap[entry.date] = {
            date: entry.date,
            text: entry.text,
            mood: entry.mood,
            wordCount: entry.wordCount
          }
        })
        setEntries(entriesMap)
      } catch (error) {
        console.error('Failed to load entries', error)
      }
    }
    loadEntries()
  }, [])

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length < totalCells) cells.push(null)

  const getKey = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${viewYear}-${m}-${d}`
  }

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    )
  }

  const isFuture = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    date.setHours(23, 59, 59, 999)
    return date > today
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedEntry(null)
    setEntryEmotion(null)
  }

  const handleNextMonth = () => {
    const nextDate = new Date(viewYear, viewMonth + 1, 1)
    if (nextDate > today) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedEntry(null)
    setEntryEmotion(null)
  }

  const handleDayClick = async (entry: DiaryEntry) => {
    setSelectedEntry(entry)
    setEntryEmotion(null)
    setLoadingEmotion(true)
    try {
      const response = await api.post('/api/emotion/analyse', { text: entry.text })
      setEntryEmotion(response.data)
    } catch (error) {
      console.error('Failed to analyse emotion', error)
    } finally {
      setLoadingEmotion(false)
    }
  }

  // Fix timezone issue for date display
  const formatEntryDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const isNextDisabled = new Date(viewYear, viewMonth + 1, 1) > today

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >
      {/* TITLE */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-3">
        View Month
      </h1>

      {/* MAIN CARD */}
      <div
        className="flex-1 rounded-3xl flex flex-col overflow-hidden shadow-sm"
        style={{ backgroundColor: '#FAF7F2' }}
      >

        {/* TOOLBAR */}
        <div
          className="flex items-center border-b"
          style={{ borderColor: '#e0e0e0' }}
        >
          <button
            onClick={() => navigate('/diary')}
            className="flex items-center gap-1 px-4 py-3 text-sm font-semibold border-r transition-opacity hover:opacity-70"
            style={{ borderColor: '#e0e0e0', color: '#4A9B6F' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 py-3">
            <span>📅</span>
            <span>{MONTHS[viewMonth]} {viewYear}</span>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">

          {/* MONTH NAVIGATION */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#D4F5D4', color: '#2D6A4F' }}
            >
              ← Prev
            </button>
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={handleNextMonth}
              disabled={isNextDisabled}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-30"
              style={{ backgroundColor: '#D4F5D4', color: '#2D6A4F' }}
            >
              Next →
            </button>
          </div>

          {/* CALENDAR GRID */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: '#e0e0e0' }}
          >
            {/* WEEKDAY HEADERS */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e0e0e0' }}>
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold"
                  style={{ color: '#4A9B6F' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* DATE CELLS */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return (
                  <div key={`empty-${i}`} className="h-14 sm:h-16 border-b border-r" style={{ borderColor: '#f0f0f0' }} />
                )

                const key = getKey(day)
                const entry = entries[key]
                const future = isFuture(day)
                const todayCell = isToday(day)

                return (
                  <div
                    key={key}
                    onClick={() => !future && entry && handleDayClick(entry)}
                    className={`h-14 sm:h-16 border-b border-r flex flex-col items-center justify-start pt-1 transition-colors ${
                      entry && !future ? 'cursor-pointer hover:bg-green-50' : ''
                    }`}
                    style={{
                      borderColor: '#f0f0f0',
                      backgroundColor: todayCell ? '#E8F5E9' : 'transparent',
                    }}
                  >
                    {/* DAY NUMBER */}
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        todayCell ? 'text-white' : future ? 'text-gray-300' : 'text-gray-600'
                      }`}
                      style={{ backgroundColor: todayCell ? '#4A9B6F' : 'transparent' }}
                    >
                      {day}
                    </span>

                    {/* MOOD EMOJI */}
                    {entry && !future && (
                      <span className="text-base sm:text-lg mt-0.5">{entry.mood}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* LEGEND */}
          <div className="flex items-center gap-4 justify-center flex-wrap text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4A9B6F' }} />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1">
              <span>😊</span>
              <span>Entry written</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-300">15</span>
              <span>Future date</span>
            </div>
          </div>

          {/* SELECTED ENTRY PREVIEW */}
          {selectedEntry && (
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ backgroundColor: '#F0FFF4', border: '1px solid #C8E6C9' }}
            >
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedEntry.mood}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {formatEntryDate(selectedEntry.date)}
                    </p>
                    <p className="text-xs text-gray-500">{selectedEntry.wordCount} words</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedEntry(null); setEntryEmotion(null) }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* ENTRY PREVIEW */}
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                {selectedEntry.text}
              </p>

              {/* EMOTION SUMMARY */}
              {loadingEmotion && (
                <p className="text-xs text-gray-400 italic animate-pulse">
                  🤖 Analysing emotions...
                </p>
              )}
              {entryEmotion && !loadingEmotion && (
                <div
                  className="flex flex-wrap gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: '#E8F5E9' }}
                >
                  <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white flex-1">
                    <span className="text-lg">{selectedEntry.mood}</span>
                    <span className="text-xs text-gray-500">Mood</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white flex-1">
                    <span className="text-sm font-bold" style={{ color: '#2D6A4F' }}>
                      {entryEmotion.wellness_score}/10
                    </span>
                    <span className="text-xs text-gray-500">Wellness</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white flex-1">
                    <span className="text-sm font-bold capitalize" style={{ color: '#4A9B6F' }}>
                      {entryEmotion.dominant_emotion}
                    </span>
                    <span className="text-xs text-gray-500">Emotion</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white flex-1">
                    <span className="text-sm font-bold" style={{ color: '#4A9B6F' }}>
                      {entryEmotion.emotions?.[0]?.label || '—'}
                    </span>
                    <span className="text-xs text-gray-500">Top Feeling</span>
                  </div>
                </div>
              )}

              {/* READ FULL ENTRY */}
              <button
                onClick={() => navigate(`/diary/daily?date=${selectedEntry.date}&readonly=true`)}
                className="self-start px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#4A9B6F' }}
              >
                Read Full Entry →
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ViewMonth