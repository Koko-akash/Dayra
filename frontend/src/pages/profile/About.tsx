import { useNavigate } from 'react-router-dom'
import logo from '../../assets/Dayra_Main_Logo.png'

const About = () => {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-8 sm:p-12 flex flex-col items-center gap-6"
        style={{ backgroundColor: '#D4F5D4' }}
      >

        {/* LOGO */}
        <img
          src={logo}
          alt="Dayra Logo"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
        />

        {/* TITLE */}
        <h1
          className="text-3xl sm:text-4xl font-bold"
          style={{ color: '#2D6A4F' }}
        >
          About
        </h1>

        {/* DESCRIPTION */}
        <p className="text-center text-gray-700 text-sm sm:text-base italic leading-relaxed">
          Dayra is a calm, AI-powered space designed to help you understand your day and yourself a little better.
          It brings together journaling, task management, and focused work into one simple, thoughtful experience.
          Whether you're writing your thoughts, organizing your goals, or taking a moment to breathe, Dayra is built
          to support you without pressure. Private, minimal, and made for real life — Dayra grows with you, one day at a time.
        </p>

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate('/home')}
          className="w-48 sm:w-56 py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90 mt-2"
          style={{ backgroundColor: '#4A9B6F' }}
        >
          Back
        </button>

      </div>
    </div>
  )
}

export default About