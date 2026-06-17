import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/Dayra_Main_Logo.png'
import api from '../../api/axios'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (location.state?.signupSuccess) {
      setToastMessage('✅ Account created successfully!')
      setShowSuccessToast(true)
      const timer = setTimeout(() => setShowSuccessToast(false), 3000)
      navigate(location.pathname, { replace: true, state: {} })
      return () => clearTimeout(timer)
    }
    if (location.state?.passwordReset) {
      setToastMessage('✅ Password updated successfully!')
      setShowSuccessToast(true)
      const timer = setTimeout(() => setShowSuccessToast(false), 3000)
      navigate(location.pathname, { replace: true, state: {} })
      return () => clearTimeout(timer)
    }
  }, [])

  const handleLogin = async () => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
        rememberMe
      })
      localStorage.setItem('dayra_token', response.data.token)
      localStorage.setItem('dayra_user', JSON.stringify(response.data.user))
      navigate('/home')
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Login failed! Please try again.')
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >

      {/* SUCCESS TOAST */}
      <div
        className="fixed top-6 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm sm:text-base font-semibold transition-all duration-700"
        style={{
          transform: `translateX(-50%) translateY(${showSuccessToast ? '0px' : '-20px'})`,
          opacity: showSuccessToast ? 1 : 0,
          pointerEvents: 'none',
          backgroundColor: '#FAF7F2',
          color: '#4A9B6F'
        }}
      >
        {toastMessage}
      </div>

      <div
        className="w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-10 flex flex-col md:flex-row gap-6 sm:gap-10"
        style={{ backgroundColor: '#FAF7F2' }}
      >

{/* ERROR TOAST */}
<div
  className="fixed top-6 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm sm:text-base font-semibold transition-all duration-700"
  style={{
    transform: `translateX(-50%) translateY(${showError ? '0px' : '-20px'})`,
    opacity: showError ? 1 : 0,
    pointerEvents: 'none',
    backgroundColor: '#FFE5E5',
    color: '#C0392B'
  }}
>
  ❌ {errorMessage}
</div>

        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-4 sm:gap-6">
          <img src={logo} alt="Dayra Logo" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome to Dayra</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Your personal AI - powered space for clarity, growth, and peace.
            Journal your thoughts, manage your tasks, and focus on what truly matters.
            A safe and calming place designed to support your daily journey.
          </p>
        </div>

        {/* DIVIDER */}
        <div className="h-px w-full md:h-auto md:w-px md:self-stretch" style={{ backgroundColor: '#C8E6C9' }}></div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col justify-center gap-4 sm:gap-5">

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <div className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-gray-600 text-xs sm:text-sm">Remember me</span>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-2.5 sm:py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#4A9B6F' }}
          >
            Login
          </button>

          <div className="flex flex-col gap-1 mt-2 text-center md:text-left">
            <p className="text-gray-600 text-xs sm:text-sm">
              Haven't created an account?{' '}
              <span
                onClick={() => navigate('/signup')}
                className="underline cursor-pointer font-medium text-gray-700 hover:text-green-700"
              >
                Signup
              </span>
            </p>
            <p
              onClick={() => navigate('/forgot-password')}
              className="text-gray-600 text-xs sm:text-sm underline cursor-pointer hover:text-green-700"
            >
              Forgot password?
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login