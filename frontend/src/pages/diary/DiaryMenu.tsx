import { useNavigate } from 'react-router-dom'
import logo from '../../assets/Dayra_Main_Logo.png'

const DiaryMenu = () => {
  const navigate = useNavigate()

  const options = [
    {
      id: 'daily',
      icon: '📓',
      label: 'Daily\nEntry',
      route: '/diary/daily'
    },
    {
  id: 'analyse',
  icon: '📊',
  label: 'Analyse\nData',
  route: '/diary/analyse'
},
    {
      id: 'month',
      icon: '📅',
      label: 'View\nMonth',
      route: '/diary/month'
    },
  ]

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >

      {/* TOP NAV */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
  <button
    onClick={() => navigate('/home')}
    className="text-gray-700 hover:text-gray-900 transition-colors p-1"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  </button>
  <img src={logo} alt="Dayra Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Diary</h1>
    <p className="text-sm italic text-gray-600">Menu</p>
  </div>
</div>

        
      </div>

      {/* OPTIONS */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mt-8 sm:mt-0">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => navigate(opt.route)}
            className="flex flex-col items-center justify-center gap-4 w-44 h-44 sm:w-52 sm:h-52 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#FAF7F2' }}
          >
            <span className="text-5xl sm:text-6xl">{opt.icon}</span>
            <span className="text-base sm:text-lg font-semibold text-gray-800 text-center whitespace-pre-line leading-snug">
              {opt.label}
            </span>
          </button>
        ))}
      </div>

    </div>
  )
}

export default DiaryMenu