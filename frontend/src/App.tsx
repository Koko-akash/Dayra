import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import Homepage from './pages/home/Homepage'
import MyInfo from './pages/profile/MyInfo'
import About from './pages/profile/About'
import Pomodoro from './pages/pomodoro/Pomodoro'

import Planner from './pages/planner/Planner'
import DiaryMenu from './pages/diary/DiaryMenu'
import DailyEntry from './pages/diary/DailyEntry'
import Analyse from './pages/diary/Analyse'
import ViewMonth from './pages/diary/ViewMonth'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/my-info" element={<MyInfo />} />
        <Route path="/about" element={<About />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        
        <Route path="/planner" element={<Planner />} />
        <Route path="/diary" element={<DiaryMenu />} />
        <Route path="/diary/daily" element={<DailyEntry />} />
        <Route path="/diary/analyse" element={<Analyse />} />
        <Route path="/diary/month" element={<ViewMonth />} />
      </Routes>
    </Router>
  )
}

export default App