import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAccessibilityStore } from '@/store/accessibility'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import AccessibilitySelection from '@/pages/AccessibilitySelection'
import Home from '@/pages/Home'
import Assignment from '@/pages/Assignment'
import ImageSelection from '@/pages/ImageSelection'
import TeacherDashboard from '@/pages/TeacherDashboard'
import StudentSubmissions from '@/pages/StudentSubmissions'
import GradeAssignment from '@/pages/GradeAssignment'
import ProtectedRoute from '@/components/ProtectedRoute'
import '@/styles/themes.css'

function App() {
  const { applyTheme } = useAccessibilityStore()

  // 初始化时应用主题
  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  return (
    <BrowserRouter>
      {/* 无障碍 - 跳转链接 */}
      <a href="#main-content" className="skip-link">
        跳转到主内容
      </a>

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/accessibility-selection"
          element={
            <ProtectedRoute>
              <AccessibilitySelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Assignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/image-selection"
          element={
            <ProtectedRoute>
              <ImageSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute requireRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/submissions"
          element={
            <ProtectedRoute requireRole="teacher">
              <StudentSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/grade/:assignmentId"
          element={
            <ProtectedRoute requireRole="teacher">
              <GradeAssignment />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
