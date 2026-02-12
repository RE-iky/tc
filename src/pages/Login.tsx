import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useAccessibilityStore } from '@/store/accessibility'
import { validateLoginForm } from '@/utils/validation'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore()
  const { preferences } = useAccessibilityStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // 如果已登录，根据用户角色和无障碍偏好进行导航
  useEffect(() => {
    if (isAuthenticated && user) {
      // 教师直接进入教师主页
      if (user.role === 'teacher') {
        navigate('/teacher-dashboard')
      } else {
        // 学生根据是否设置了无障碍偏好进行导航
        if (preferences.accessibilityType !== 'none') {
          navigate('/home')
        } else {
          navigate('/accessibility-selection')
        }
      }
    }
  }, [isAuthenticated, user, preferences.accessibilityType, navigate])

  // 清除错误信息
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    // 验证表单
    const validation = validateLoginForm({ email, password })
    setValidationErrors(validation.errors)

    if (!validation.isValid) {
      return
    }

    try {
      await login({ email, password })
      // 登录成功后，useEffect会处理重定向
    } catch (err) {
      // 错误已在store中处理
    }
  }

  return (
    <main id="main-content" className="login-page" role="main">
      <div className="login-container">
        <header>
          <h1 id="page-title">无障碍人工智能教学平台</h1>
          <p className="subtitle" id="page-description">
            为残障学习者提供可访问的人工智能学习体验
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="login-form"
          aria-labelledby="page-title"
          aria-describedby="page-description help-text"
          noValidate
        >
          <div className="form-group">
            <label htmlFor="email">
              邮箱 <abbr title="必填项" aria-label="必填项">*</abbr>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-invalid={!!(validationErrors.email || error)}
              aria-describedby={error ? 'error-message' : undefined}
              autoComplete="email"
              placeholder="请输入邮箱地址"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              密码 <abbr title="必填项" aria-label="必填项">*</abbr>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              aria-invalid={!!(validationErrors.password || error)}
              aria-describedby={error ? 'error-message' : undefined}
              autoComplete="current-password"
              placeholder="请输入密码"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div
              id="error-message"
              className="error-message"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <span aria-hidden="true">⚠️ </span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            aria-label={isLoading ? '正在登录...' : '提交登录表单'}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>

          <p className="help-text" id="help-text">
            还没有账户？{' '}
            <Link to="/register" className="link">
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}

export default Login
