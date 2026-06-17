import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useEffect } from 'react'

const MyInfo = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    phone: '',
    friendContact: ''
  })
  const [editingField, setEditingField] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const updated = { ...formData, [e.target.name]: e.target.value }
    setFormData(updated)
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalData))
  }

  const [hasChanges, setHasChanges] = useState(false)
const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    phone: '',
    friendContact: ''
  })


  // Load user data on mount
useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/api/user/me')
        const user = response.data
        const loaded = {
          name: user.name || '',
          email: user.email || '',
          dob: user.dob || '',
          gender: user.gender || '',
          phone: user.phone || '',
          friendContact: user.friendEmail || ''
        }
        setFormData(loaded)
        setOriginalData(loaded)
      } catch (error) {
        console.error('Failed to load profile', error)
      }
    }
    loadProfile()
    const pic = localStorage.getItem('dayra_profile_pic')
    if (pic) setProfilePic(pic)
  }, [])

const handleSave = async () => {
    try {
      await api.put('/api/user/update', {
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        friendEmail: formData.friendContact
      })
      // Update localStorage with new name instantly!!
      const existingUser = JSON.parse(localStorage.getItem('dayra_user') || '{}')
      localStorage.setItem('dayra_user', JSON.stringify({
        ...existingUser,
        name: formData.name
      }))
      navigate('/home')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update profile!')
    }
  }

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setProfilePic(result)
        localStorage.setItem('dayra_profile_pic', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()).toISOString().split('T')[0]

  const isEditing = (field: string) => editingField === field

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl outline-none text-gray-700 text-sm sm:text-base transition-all ${
      isEditing(field) ? 'ring-2 ring-green-400' : 'cursor-default'
    }`

  const EditIcon = ({ field }: { field: string }) => (
    <button onClick={() => setEditingField(isEditing(field) ? null : field)}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4A9B6F" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.5 1.5-4.5L16.862 3.487z" />
      </svg>
    </button>
  )

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#90EE90' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-4"
        style={{ backgroundColor: '#D4F5D4' }}
      >

        {/* PROFILE PICTURE */}
        <div className="relative">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#3d3535' }}
          >
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 sm:w-14 sm:h-14" fill="#D4F5D4" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            )}
          </div>

          {/* PENCIL ICON */}
          {/* PENCIL ICON */}
<button
  onClick={() => fileInputRef.current?.click()}
  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
  style={{ backgroundColor: '#4A9B6F' }}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.5 1.5-4.5L16.862 3.487z" />
  </svg>
</button>

{/* REMOVE PIC BUTTON */}
{profilePic && (
  <button
    onClick={() => {
      setProfilePic(null)
      localStorage.removeItem('dayra_profile_pic')
    }}
    className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-md text-xs"
    style={{ backgroundColor: '#C0392B', color: 'white' }}
  >
    ✕
  </button>
)}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePicChange}
          />
        </div>

        {/* FORM */}
        <div className="w-full flex flex-col gap-3">

          {/* NAME */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Name:</label>
              <EditIcon field="name" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing('name')}
              className={inputClass('name')}
              style={{ backgroundColor: '#FAF7F2' }}
            />
          </div>

          {/* EMAIL */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Email:</label>
              <EditIcon field="email" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing('email')}
              className={inputClass('email')}
              style={{ backgroundColor: '#FAF7F2' }}
            />
          </div>

          {/* DOB + GENDER */}
          <div className="flex flex-row gap-3">

            {/* DOB */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium text-sm sm:text-base">Date of Birth:</label>
                <EditIcon field="dob" />
              </div>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                disabled={!isEditing('dob')}
                min={minDate}
                max={maxDate}
                className={inputClass('dob')}
                style={{ backgroundColor: '#FAF7F2' }}
              />
              {formData.dob && (
                <span className="text-xs text-gray-500 pl-2">
                  Age: {calculateAge(formData.dob)}
                </span>
              )}
            </div>

            {/* GENDER */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium text-sm sm:text-base">Gender:</label>
                <EditIcon field="gender" />
              </div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing('gender')}
                className={inputClass('gender')}
                style={{ backgroundColor: '#FAF7F2' }}
              >
                <option value="" disabled>Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="lgbtq">LGBTQ+</option>
                <option value="others">Others</option>
              </select>
            </div>

          </div>

          {/* PHONE */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Phone No:</label>
              <EditIcon field="phone" />
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing('phone')}
              className={inputClass('phone')}
              style={{ backgroundColor: '#FAF7F2' }}
            />
          </div>

          {/* FRIEND/PARENT CONTACT */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Friend's/Parent's contact:</label>
              <EditIcon field="friendContact" />
            </div>
            <input
              type="text"
              name="friendContact"
              value={formData.friendContact}
              onChange={handleChange}
              disabled={!isEditing('friendContact')}
              className={inputClass('friendContact')}
              style={{ backgroundColor: '#FAF7F2' }}
            />
          </div>

        </div>

        {/* BACK / SAVE BUTTON */}
{hasChanges ? (
  <button
    onClick={handleSave}
    className="w-48 sm:w-56 py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90 mt-2"
    style={{ backgroundColor: '#4A9B6F' }}
  >
    💾 Save Changes
  </button>
) : (
  <button
    onClick={() => navigate('/home')}
    className="w-48 sm:w-56 py-3 rounded-full text-white font-semibold text-base sm:text-lg transition-opacity hover:opacity-90 mt-2"
    style={{ backgroundColor: '#888' }}
  >
    ← Back
  </button>
)}

      </div>
    </div>
  )
}

export default MyInfo