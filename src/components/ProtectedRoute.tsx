import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  requireRole?: UserRole
}

function ProtectedRoute({ children, redirectTo = '/login', requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  // 显示加载状态
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <p>加载中...</p>
      </div>
    )
  }

  // 未认证则重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // 检查用户角色
  if (requireRole && user && user.role !== requireRole) {
    // 重定向到对应的首页
    const homePath = user.role === 'teacher' ? '/teacher-dashboard' : '/home'
    return <Navigate to={homePath} replace />
  }

  // 已认证且角色匹配则渲染子组件
  return <>{children}</>
}

export default ProtectedRoute
