import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../assets/Dayra_Main_Logo.png'
import api from '../../api/axios'
import diaryIcon from '../../assets/Dayra_diary_icon.png'
import plannerIcon from '../../assets/Dayra_planner_icon.png'
import pomoIcon from '../../assets/Dayra_pomo_icon.png'

const modules = [
  {
    id: 'diary',
    icon: diaryIcon,
    tagline: "Let's note down today's moments. 😊",
    route: '/diary'
  },
  
  {
    id: 'pomodoro',
    icon: pomoIcon,
    tagline: 'Start now, momentum will follow. 🔥',
    route: '/pomodoro'
  },
  {
    id: 'planner',
    icon: plannerIcon,
    tagline: 'A clear plan makes room for peace. 😮🔥',
    route: '/planner'
  },
]

const quotes = [
  'Peace often begins in quiet moments.',
  'Every day is a new page in your story.',
  'Small steps lead to big changes.',
  'Your thoughts matter. So do you.',
  'Breathe. Reflect. Grow.',
]

const Homepage = () => {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('User')
const [profilePic, setProfilePic] = useState<string | null>(null)

useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await api.get('/api/user/me')
        const user = response.data
        setUserName(user.name?.split(' ')[0] || 'User')
        if (user.profilePic) {
          setProfilePic(user.profilePic)
          localStorage.setItem('dayra_profile_pic', user.profilePic)
        }
        localStorage.setItem('dayra_user', JSON.stringify(user))
      } catch (error) {
        // Fallback to localStorage
        const saved = localStorage.getItem('dayra_user')
        if (saved) {
          const parsed = JSON.parse(saved)
          setUserName(parsed.name?.split(' ')[0] || 'User')
        }
        const pic = localStorage.getItem('dayra_profile_pic')
        if (pic) setProfilePic(pic)
      }
    }
    loadUserData()
  }, [])

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  const goNext = () => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % modules.length)
  }

  const goPrev = () => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + modules.length) % modules.length)
  }

  const activeModule = modules[current]

  const slideVariants: import('framer-motion').Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.85,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45, ease: 'easeOut' }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.85,
      transition: { duration: 0.35, ease: 'easeIn' }
    }),
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col p-4 sm:p-6 relative overflow-hidden"
      style={{ backgroundColor: '#90EE90' }}
    >

      {/* TOP NAV */}
      <div className="flex items-center justify-between w-full mb-auto">

        {/* LEFT — Logo + Greeting */}
        <div className="flex items-center gap-2 sm:gap-3">
        <img src={logo} alt="Dayra Logo" className="w-9 h-9 sm:w-16 sm:h-16 object-contain" />
        <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Good to see you, {userName} 👋</h1>
            <p className="text-xs sm:text-sm italic text-gray-600 hidden sm:block">{randomQuote}</p>
        </div>
        </div>

        {/* RIGHT — Profile Icon */}
        <div className="relative">
          <button
  onClick={() => setMenuOpen(!menuOpen)}
  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
  style={{ borderColor: '#4A9B6F' }}
>
  {profilePic ? (
    <img src={profilePic} alt="Profile" className="w-full h-full object-cover rounded-full" />
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="#4A9B6F" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )}
</button>

          {/* MINI MENU POPUP */}
          <AnimatePresence>
            {menuOpen && (
              <>
                {/* BACKDROP */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                {/* MENU CARD */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 z-50 w-48 sm:w-56 rounded-2xl shadow-xl overflow-hidden"
                  style={{ backgroundColor: '#D4F5D4' }}
                >
                  {/* PROFILE ICON */}
                  <div className="flex justify-center py-4"
                    style={{ backgroundColor: '#D4F5D4' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="#3d3535" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>

                  {/* DIVIDER */}
                  <div className="h-px w-full" style={{ backgroundColor: '#a8d5a2' }} />

                  {/* MY INFO */}
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/my-info') }}
                    className="w-full py-3 text-center text-gray-800 font-medium text-base hover:bg-green-200 transition-colors"
                  >
                    My Info
                  </button>

                  {/* DIVIDER */}
                  <div className="h-px w-full" style={{ backgroundColor: '#a8d5a2' }} />

                  {/* ABOUT */}
<button
  onClick={() => { setMenuOpen(false); navigate('/about') }}
  className="w-full py-3 text-center text-gray-800 font-medium text-base hover:bg-green-200 transition-colors"
>
  About
</button>

{/* DIVIDER */}
<div className="h-px w-full" style={{ backgroundColor: '#a8d5a2' }} />

{/* LOGOUT */}
<button
  onClick={() => {
    setMenuOpen(false)
    const profilePic = localStorage.getItem('dayra_profile_pic')
    localStorage.clear()
    if (profilePic) localStorage.setItem('dayra_profile_pic', profilePic)
    navigate('/login')
  }}
  className="w-full py-3 text-center font-medium text-base hover:bg-red-50 transition-colors"
  style={{ color: '#C0392B' }}
>
  Logout
</button>

                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CAROUSEL */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8">

        <div className="flex items-center justify-center gap-6 sm:gap-12 w-full">

          {/* LEFT ARROW */}
          <button
            onClick={goPrev}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="#3d3d3d" opacity={0.5}>
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          {/* CIRCLE CARD */}
            <div className="relative w-48 h-48 sm:w-72 sm:h-72 md:w-80 md:h-80 flex-shrink-0">
                <AnimatePresence custom={direction} mode="wait">
                <motion.div
                    key={activeModule.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, info) => {
                    if (info.offset.x < -60) goNext()
                    else if (info.offset.x > 60) goPrev()
                    }}
                    className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer shadow-md aspect-square"
                    style={{ backgroundColor: '#F5F0E8' }}
                    onClick={() => navigate(activeModule.route)}
                >
                    <img
                    src={activeModule.icon}
                    alt={activeModule.id}
                    className="w-32 h-32 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain rounded-full"
                    />
                </motion.div>
                </AnimatePresence>
            </div>

          {/* RIGHT ARROW */}
          <button
            onClick={goNext}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="#3d3d3d" opacity={0.5}>
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>

        </div>

        {/* TAGLINE */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.id + '-tagline'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-sm sm:text-lg italic text-gray-700 text-center px-6">
                {activeModule.tagline}
            </p>
            <div className="w-48 sm:w-64 h-px" style={{ backgroundColor: '#4A9B6F', opacity: 0.4 }}></div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* DOTS INDICATOR */}
      <div className="flex justify-center gap-2 pb-4">
        {modules.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ backgroundColor: i === current ? '#4A9B6F' : '#a8d5a2' }}
          />
        ))}
      </div>

    </div>
  )
}

export default Homepage