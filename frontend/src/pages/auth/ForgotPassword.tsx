import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/Dayra_Main_Logo.png'
import api from '../../api/axios'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      alert('Please enter your email!')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/verify-email', { email })
      setStep('reset')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Email not found!')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in all fields!')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters!')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', {
        email,
        new_password: newPassword
      })
      navigate('/login', { state: { passwordReset: true } })
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to reset password!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >
      <div
        className="w-full max-w-xl rounded-3xl shadow-lg p-6 sm:p-10 flex flex-col items-center gap-6"
        style={{ backgroundColor: '#FAF7F2' }}
      >

        {/* LOGO */}
        <img src={logo} alt="Dayra Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: '#4A9B6F' }}
          >
            1
          </div>
          <div
            className="w-16 h-1 rounded-full"
            style={{ backgroundColor: step === 'reset' ? '#4A9B6F' : '#C8E6C9' }}
          />
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: step === 'reset' ? '#4A9B6F' : '#C8E6C9',
              color: step === 'reset' ? 'white' : '#888'
            }}
          >
            2
          </div>
        </div>

        {step === 'email' ? (
          <>
            {/* STEP 1 — EMAIL */}
            <h1 className="text-2xl sm:text-3xl font-bold text-center" style={{ color: '#1B5E20' }}>
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 italic text-center">
              Enter your registered email address
            </p>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium text-sm sm:text-base">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
                  style={{ backgroundColor: '#D4F5D4' }}
                />
              </div>

              <button
                onClick={handleVerifyEmail}
                disabled={loading}
                className="w-full py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#4A9B6F' }}
              >
                {loading ? 'Verifying...' : 'Continue →'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Remembered your password?{' '}
                <span
                  onClick={() => navigate('/login')}
                  className="underline cursor-pointer font-medium text-gray-700 hover:text-green-700"
                >
                  Back to Login
                </span>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* STEP 2 — RESET PASSWORD */}
            <h1 className="text-2xl sm:text-3xl font-bold text-center" style={{ color: '#1B5E20' }}>
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 italic text-center">
              Setting new password for <strong>{email}</strong>
            </p>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium text-sm sm:text-base">New password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
                  style={{ backgroundColor: '#D4F5D4' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium text-sm sm:text-base">Confirm password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
                  style={{ backgroundColor: '#D4F5D4' }}
                />
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#4A9B6F' }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <p
                onClick={() => setStep('email')}
                className="text-center text-sm text-gray-600 underline cursor-pointer hover:text-green-700"
              >
                ← Back
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword