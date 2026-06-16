import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import api from '../../api/axios'

const WORD_LIMIT = 600

interface DiaryEntry {
  date: string
  text: string
  mood: string
  wordCount: number
}

const formatDateKey = (date: Date) => date.toISOString().split('T')[0]

const formatDateDisplay = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const getTodayKey = () => formatDateKey(new Date())

const DailyEntry = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const dateParam = params.get('date')
  const readonlyParam = params.get('readonly')

  const todayKey = getTodayKey()

  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})
  const [selectedDate, setSelectedDate] = useState<Date>(
    dateParam ? new Date(dateParam + 'T12:00:00') : new Date()
  )
  const [showCalendar, setShowCalendar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('Entry saved!')
  const [selectedMood, setSelectedMood] = useState('😊')
  const [text, setText] = useState('')

  const selectedKey = formatDateKey(selectedDate)
  const isToday = selectedKey === todayKey
  const isFuture = selectedDate > new Date(new Date().setHours(23, 59, 59, 999))
  const isPast = !isToday && !isFuture
  const existingEntry = entries[selectedKey]
  const isReadOnly = isFuture || (isPast && readonlyParam === 'true')

  // Load all entries from backend
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

  // Load entry when date changes
  useEffect(() => {
    const entry = entries[selectedKey]
    setText(entry?.text || '')
    setSelectedMood(entry?.mood || '😊')
  }, [selectedKey, entries])

  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  const hasExistingEntry = !!existingEntry
  const hasChanges =
    text !== (existingEntry?.text || '') || selectedMood !== (existingEntry?.mood || '😊')
  const isSaveDisabled =
    text.trim() === '' || isReadOnly || (hasExistingEntry && !hasChanges)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReadOnly) return
    const val = e.target.value
    const wordCount = val.trim() === '' ? 0 : val.trim().split(/\s+/).length
    if (wordCount <= WORD_LIMIT) setText(val)
  }

  const handleSave = async () => {
    if (isSaveDisabled) return
    try {
      // First analyse emotion with NLP
      let moodToSave = selectedMood
      try {
        const emotionResponse = await api.post('/api/emotion/analyse', { text })
        const suggestedEmoji = emotionResponse.data.suggested_emoji
        if (suggestedEmoji) {
          moodToSave = suggestedEmoji
          setSelectedMood(suggestedEmoji)
        }
      } catch (emotionError) {
        console.log('Emotion analysis failed, using default mood')
      }

      // Save diary entry with AI detected mood
      await api.post('/api/diary/save', {
        date: selectedKey,
        text,
        mood: moodToSave,
        wordCount: words
      })

      const entry: DiaryEntry = {
        date: selectedKey,
        text,
        mood: moodToSave,
        wordCount: words
      }
      setEntries((prev) => ({ ...prev, [selectedKey]: entry }))
      setSaveMessage(hasExistingEntry ? 'Entry updated!' : 'Entry saved!')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save entry!')
    }
  }

  const handleDateChange = (val: unknown) => {
    const date = val as Date
    if (date > new Date(new Date().setHours(23, 59, 59, 999))) return
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const tileContent = ({ date }: { date: Date }) => {
    const key = formatDateKey(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date > today) return null
    if (entries[key]) {
      return (
        <div className="flex justify-center mt-0.5 leading-none">
          <span style={{ fontSize: '11px' }}>{entries[key].mood}</span>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >

      {/* SAVED TOAST */}
      <div
        className="fixed top-6 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all duration-700"
        style={{
          transform: `translateX(-50%) translateY(${saved ? '0px' : '-20px'})`,
          opacity: saved ? 1 : 0,
          pointerEvents: 'none',
          backgroundColor: '#FAF7F2',
          color: '#4A9B6F'
        }}
      >
        ✅ {saveMessage}
      </div>

      {/* TITLE */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-3">
        Daily Entry
      </h1>

      {/* MAIN CARD */}
      <div
        className="flex-1 rounded-3xl flex flex-col overflow-visible shadow-sm relative"
        style={{ backgroundColor: '#FAF7F2' }}
      >

        {/* TOOLBAR */}
        <div
          className="flex items-center border-b rounded-t-3xl"
          style={{ borderColor: '#e0e0e0' }}
        >
          {/* BACK */}
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

          {/* DATE — clickable */}
          <div className="relative flex-1 flex justify-center">
            <button
              onClick={() => !readonlyParam && setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 transition-colors py-3"
            >
              <span>📅</span>
              <span>{formatDateDisplay(selectedDate)}</span>
              {!readonlyParam && <span className="text-xs text-gray-400">▼</span>}
            </button>

            {/* MINI CALENDAR POPUP */}
            {showCalendar && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCalendar(false)}
                />
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded-2xl shadow-xl overflow-hidden"
                  style={{ border: '1px solid #C8E6C9' }}>
                  <style>{`
                    .diary-cal .react-calendar {
                      background-color: #FAF7F2 !important;
                      border: none !important;
                      color: #3d3535 !important;
                      width: 300px !important;
                      padding: 8px;
                      font-size: 13px;
                    }
                    .diary-cal .react-calendar__tile {
                      color: #3d3535 !important;
                      border-radius: 6px !important;
                      padding: 6px 4px !important;
                    }
                    .diary-cal .react-calendar__tile:hover {
                      background-color: #e8f5e9 !important;
                    }
                    .diary-cal .react-calendar__tile--active {
                      background-color: #4A9B6F !important;
                      color: white !important;
                    }
                    .diary-cal .react-calendar__tile--now {
                      border: 1px solid #4A9B6F !important;
                      background: transparent !important;
                    }
                    .diary-cal .react-calendar__tile:disabled {
                      background-color: #f0f0f0 !important;
                      color: #ccc !important;
                      cursor: not-allowed !important;
                    }
                    .diary-cal .react-calendar__navigation button {
                      color: #3d3535 !important;
                      background: transparent !important;
                    }
                    .diary-cal .react-calendar__navigation button:hover {
                      background-color: #e8f5e9 !important;
                      border-radius: 6px !important;
                    }
                    .diary-cal .react-calendar__month-view__weekdays {
                      color: #4A9B6F !important;
                      font-size: 11px !important;
                    }
                    .diary-cal .react-calendar__month-view__weekdays__weekday abbr {
                      text-decoration: none !important;
                    }
                  `}</style>
                  <div className="diary-cal">
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      maxDate={new Date()}
                      tileContent={tileContent}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SAVE / UPDATE */}
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="flex items-center gap-1 px-4 py-3 text-sm font-semibold border-l transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ borderColor: '#e0e0e0', color: '#4A9B6F' }}
          >
            {hasExistingEntry ? '🔄 Update' : '💾 Save'}
          </button>
        </div>

        {/* READ ONLY BANNER */}
        {isReadOnly && (
          <div
            className="px-4 py-2 text-center text-xs font-medium"
            style={{
              backgroundColor: isFuture ? '#FFE5E5' : '#FFF3CD',
              color: isFuture ? '#C0392B' : '#B7770D'
            }}
          >
            {isFuture
              ? '🚫 Future dates are not allowed'
              : '📖 Viewing past entry — read only'}
          </div>
        )}

        {/* MOOD DISPLAY — AI detected */}
        {!isFuture && (
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: '#e0e0e0' }}
          >
            <span className="text-sm text-gray-500 italic">
              {existingEntry ? 'AI detected mood:' : 'Mood will be detected on save 🤖'}
            </span>
            <span className="text-2xl">{selectedMood}</span>
          </div>
        )}

        {/* TEXTAREA */}
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={
            isFuture
              ? "You can't write entries for future dates 🚫"
              : isReadOnly
              ? 'Reading past entry...'
              : 'Write about your day...'
          }
          readOnly={isReadOnly}
          className="flex-1 w-full p-4 sm:p-6 outline-none resize-none text-gray-700 text-sm sm:text-base leading-relaxed rounded-b-3xl"
          style={{
            backgroundColor: isReadOnly ? '#f9f9f7' : '#FAF7F2',
            minHeight: '300px',
            cursor: isReadOnly ? 'default' : 'text'
          }}
        />

        {/* WORD COUNT */}
        {!isReadOnly && (
          <div
            className="flex items-center justify-between px-4 py-2 border-t text-xs"
            style={{ borderColor: '#e0e0e0' }}
          >
            <span className="text-gray-400 italic">
              {text.trim() === '' ? 'Start writing your thoughts...' : `${WORD_LIMIT - words} words remaining`}
            </span>
            <span
              className="font-semibold"
              style={{ color: words > WORD_LIMIT * 0.9 ? '#C0392B' : '#4A9B6F' }}
            >
              {words} / {WORD_LIMIT}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}

export default DailyEntry