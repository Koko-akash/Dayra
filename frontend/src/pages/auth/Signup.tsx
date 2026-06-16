import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/Dayra_Main_Logo.png'
import api from '../../api/axios'

const Signup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    phone: '',
    friendEmail: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Calculate age from a YYYY-MM-DD date string
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Format YYYY-MM-DD -> DD/MM/YYYY
  const formatDate = (dob: string) => {
    const [year, month, day] = dob.split('-')
    return `${day}/${month}/${year}`
  }

  // Date limits: must be at least 1 year old, and no more than 120 years old
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0]
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0]

  const handleSignup = async () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address!')
      return
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(formData.phone)) {
      alert('Phone number must be exactly 10 digits!')
      return
    }

    // Friend email validation
    if (formData.friendEmail && !emailRegex.test(formData.friendEmail)) {
      alert('Please enter a valid Friend/Parent email address!')
      return
    }

    try {
      await api.post('/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        friendEmail: formData.friendEmail
      })
      navigate('/login', { state: { signupSuccess: true } })
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Signup failed! Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}>
      <div className="w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-10 flex flex-col md:flex-row gap-6 sm:gap-10"
        style={{ backgroundColor: '#FAF7F2' }}>

        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-4 sm:gap-6">
          <img src={logo} alt="Dayra Logo" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Begin Your Journey with Dayra</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Create a private space where your thoughts can breathe and your goals can grow.
            Let AI help you reflect, stay organized, and move forward with clarity.
            Your next chapter starts here.
          </p>
        </div>

        {/* DIVIDER */}
        <div className="h-px w-full md:h-auto md:w-px md:self-stretch" style={{ backgroundColor: '#C8E6C9' }}></div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Date of birth:</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                min={minDate}
                max={maxDate}
                className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
                style={{ backgroundColor: '#D4F5D4' }}
              />
              {formData.dob && (
                <span className="text-xs sm:text-sm text-gray-600 pl-2">
                  {formatDate(formData.dob)} (age: {calculateAge(formData.dob)})
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Gender:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
                style={{ backgroundColor: '#D4F5D4' }}
              >
                <option value="" disabled>Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="lgbtq">LGBTQ+</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Phone no:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Friend's/Parent's email:</label>
            <input
              type="email"
              name="friendEmail"
              value={formData.friendEmail}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 font-medium text-sm sm:text-base">Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 rounded-full outline-none text-gray-700 text-sm sm:text-base"
              style={{ backgroundColor: '#D4F5D4' }}
            />
          </div>

          <button
            onClick={handleSignup}
            className="w-full py-2.5 sm:py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90 mt-2"
            style={{ backgroundColor: '#4A9B6F' }}>
            Signup
          </button>

          <p className="text-gray-600 text-xs sm:text-sm text-center">
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              className="underline cursor-pointer font-medium text-gray-700 hover:text-green-700">
              Login
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Signup