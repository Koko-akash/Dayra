import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'

interface DiaryEntry {
  date: string
  text: string
  mood: string
  wordCount: number
}

const moodScoreMap: Record<string, number> = {
  '😊': 7, '😄': 8, '😁': 9, '🥰': 9, '😎': 8,
  '😐': 5, '😑': 4, '🙂': 6, '😶': 4, '😌': 6,
  '😔': 3, '😢': 2, '😭': 1, '😞': 2, '😟': 3,
  '😠': 2, '😤': 3, '😡': 1, '🤬': 1, '😣': 2,
  '😰': 2, '😨': 2, '😱': 1, '😧': 2, '😦': 3,
  '🥳': 10, '😴': 4, '🤒': 2, '😷': 2, '🤧': 3,
  '🥺': 3, '😩': 2, '😫': 2, '😓': 3, '😥': 3,
  '🤯': 5, '😮': 5, '😲': 5, '🤩': 10, '😇': 8,
}

const getSummary = (avg: number, total: number, days: number): string => {
  const coverage = Math.round((total / days) * 100)
  if (avg >= 8) return `Wow — an incredible period!! 🌟 You wrote ${total} out of ${days} days (${coverage}% consistency) and your mood was consistently high and positive. Keep this energy going!!`
  if (avg >= 6) return `A solid and positive period! 😊 You wrote ${total} out of ${days} days (${coverage}% consistency). Your emotional state has been generally good with natural ups and downs.`
  if (avg >= 4) return `A mixed emotional period. 🌤️ You wrote ${total} out of ${days} days (${coverage}% consistency). There were tough moments but also brighter days — that's real life and you handled it!`
  return `A challenging period emotionally. 💙 You wrote ${total} out of ${days} days (${coverage}% consistency). The fact that you kept journaling through the tough times shows real strength and self-awareness.`
}

const getDateRangeData = (
  entries: Record<string, DiaryEntry>,
  startDate: Date,
  endDate: Date
) => {
  const data = []
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0]
    const entry = entries[key]
    const label = current.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    data.push({
      date: label,
      score: entry ? (moodScoreMap[entry.mood] ?? 5) : null,
      mood: entry?.mood ?? null,
    })
    current.setDate(current.getDate() + 1)
  }
  return data
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  if (!payload.mood || payload.score === null) return null
  return (
    <text x={cx} y={cy - 10} textAnchor="middle" fontSize={16}>
      {payload.mood}
    </text>
  )
}

const todayStr = new Date().toISOString().split('T')[0]
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

const Analyse = () => {
  const navigate = useNavigate()

  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})
  const [aiSummary, setAiSummary] = useState('')
  const [startDate, setStartDate] = useState(sevenDaysAgoStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [analysed, setAnalysed] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [stats, setStats] = useState({ avg: 0, total: 0, days: 0 })
  const [loadingAI, setLoadingAI] = useState(false)
  const [wellnessStatus, setWellnessStatus] = useState<any>(null)
  const [trend, setTrend] = useState<any>(null)

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

  const runAnalysis = async (startStr: string, endStr: string, start: Date, end: Date) => {
    const data = getDateRangeData(entries, start, end)
    const validScores = data
      .filter((d) => d.score !== null)
      .map((d) => d.score as number)
    const avg = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0

    setChartData(data)
    setStats({ avg, total: validScores.length, days: data.length })
    setAnalysed(true)
    setAiSummary('')
    setWellnessStatus(null)
    setTrend(null)

    if (validScores.length > 0) {
      setLoadingAI(true)
      try {
        const response = await api.post('/api/emotion/report', {
          start_date: startStr,
          end_date: endStr
        })
        setAiSummary(response.data.ai_summary)
        setWellnessStatus(response.data.wellness_status)
        setTrend(response.data.trend)
      } catch (error) {
        console.error('Failed to get AI summary', error)
      } finally {
        setLoadingAI(false)
      }
    }
  }

  const handleAnalyse = async () => {
    if (!startDate || !endDate) return
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) {
      alert('Start date cannot be after end date!')
      return
    }
    await runAnalysis(startDate, endDate, start, end)
  }

  const overallMoodEmoji = stats.avg >= 8 ? '🤩'
    : stats.avg >= 6 ? '😊'
    : stats.avg >= 4 ? '😐'
    : stats.avg > 0 ? '😔' : '—'

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >
      {/* TITLE */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-3">
        Mood Analysis
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
            <span>📈</span>
            <span>Mood Report</span>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto">

          {/* DATE RANGE PICKER */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl"
            style={{ backgroundColor: '#E8F5E9' }}
          >
            <div className="flex flex-col gap-1 flex-1 w-full">
              <label className="text-xs font-semibold text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                max={endDate || todayStr}
                onChange={(e) => { setStartDate(e.target.value); setAnalysed(false) }}
                className="w-full px-4 py-2 rounded-full outline-none text-gray-700 text-sm"
                style={{ backgroundColor: '#FAF7F2' }}
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 w-full">
              <label className="text-xs font-semibold text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={todayStr}
                onChange={(e) => { setEndDate(e.target.value); setAnalysed(false) }}
                className="w-full px-4 py-2 rounded-full outline-none text-gray-700 text-sm"
                style={{ backgroundColor: '#FAF7F2' }}
              />
            </div>

            <button
              onClick={handleAnalyse}
              className="px-6 py-2 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90 mt-3 sm:mt-5 whitespace-nowrap"
              style={{ backgroundColor: '#4A9B6F' }}
            >
              🔍 Analyse
            </button>
          </div>

          {/* QUICK RANGE BUTTONS */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Last 7 days', days: 7 },
              { label: 'Last 14 days', days: 14 },
              { label: 'Last 30 days', days: 30 },
            ].map((r) => (
              <button
                key={r.days}
                onClick={async () => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(end.getDate() - (r.days - 1))
                  const endStr = end.toISOString().split('T')[0]
                  const startStr = start.toISOString().split('T')[0]
                  setStartDate(startStr)
                  setEndDate(endStr)
                  setAnalysed(false)
                  await runAnalysis(startStr, endStr, start, end)
                }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#D4F5D4', color: '#2D6A4F' }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* RESULTS */}
          {analysed && (
            <>
              {/* STATS ROW */}
              <div className="flex gap-3 justify-center flex-wrap">
                <div
                  className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ backgroundColor: '#E8F5E9' }}
                >
                  <span className="text-xl font-bold" style={{ color: '#2D6A4F' }}>
                    {stats.total}/{stats.days}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Entries Written</span>
                </div>
                <div
                  className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ backgroundColor: '#E8F5E9' }}
                >
                  <span className="text-xl font-bold" style={{ color: '#2D6A4F' }}>
                    {stats.avg > 0 ? stats.avg.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Avg Mood Score</span>
                </div>
                <div
                  className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ backgroundColor: '#E8F5E9' }}
                >
                  <span className="text-xl">{overallMoodEmoji}</span>
                  <span className="text-xs text-gray-500 mt-1">Overall Mood</span>
                </div>
              </div>

              {/* CHART */}
              {stats.total > 0 ? (
                <div className="w-full h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: stats.days > 14 ? 9 : 11, fill: '#666' }}
                        interval={stats.days > 14 ? Math.floor(stats.days / 7) : 0}
                      />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#666' }} width={25} />
                      <Tooltip
                        formatter={(value, _, props) => [
                          `Score: ${value} ${props.payload.mood || ''}`,
                          'Mood'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2D6A4F"
                        strokeWidth={2.5}
                        connectNulls={false}
                        dot={<CustomDot />}
                        activeDot={{ r: 6, fill: '#4A9B6F' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <span className="text-5xl">📓</span>
                  <p className="text-gray-400 italic text-sm text-center">
                    No entries found in this date range.<br />Start writing to see your mood trends!
                  </p>
                </div>
              )}

              {/* SUMMARY */}
              {stats.total > 0 && (
                <div
                  className="rounded-2xl p-4 sm:p-5 flex flex-col gap-4"
                  style={{ backgroundColor: '#F0FFF4' }}
                >
                  <div>
                    <h2 className="text-base sm:text-lg font-bold mb-2" style={{ color: '#2D6A4F' }}>
                      Summary:
                    </h2>
                    {loadingAI ? (
                      <p className="text-sm text-gray-500 italic animate-pulse">
                        🤖 Generating AI summary...
                      </p>
                    ) : (
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        {aiSummary || getSummary(stats.avg, stats.total, stats.days)}
                      </p>
                    )}
                  </div>

                  {/* WELLNESS STATUS CARDS */}
                  {!loadingAI && wellnessStatus && trend && (
                    <div className="flex flex-wrap gap-3">

                      {/* WELLNESS STATUS */}
                      <div
                        className="flex-1 min-w-32 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
                        style={{ backgroundColor: 'white', border: `2px solid ${wellnessStatus.color}` }}
                      >
                        <span className="text-2xl">{wellnessStatus.emoji}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Wellness</span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: wellnessStatus.color }}
                        >
                          {wellnessStatus.label}
                        </span>
                      </div>

                      {/* TREND */}
                      <div
                        className="flex-1 min-w-32 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
                        style={{ backgroundColor: 'white', border: `2px solid ${trend.color}` }}
                      >
                        <span className="text-2xl">{trend.emoji}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: trend.color }}
                        >
                          {trend.label}
                        </span>
                      </div>

                      {/* AVG SCORE */}
                      <div
                        className="flex-1 min-w-32 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
                        style={{ backgroundColor: 'white', border: '2px solid #4A9B6F' }}
                      >
                        <span className="text-2xl font-bold" style={{ color: '#2D6A4F' }}>
                          {stats.avg.toFixed(1)}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Score</span>
                        <span className="text-sm font-bold" style={{ color: '#4A9B6F' }}>
                          out of 10
                        </span>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </>
          )}

          {/* INITIAL HINT */}
          {!analysed && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <span className="text-5xl">🔍</span>
              <p className="text-gray-400 italic text-sm text-center">
                Select a date range and click Analyse<br />to see your mood trends!
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Analyse