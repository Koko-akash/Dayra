import axios from 'axios'

// Base axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayra_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Automatically handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dayra_token')
      localStorage.removeItem('dayra_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api