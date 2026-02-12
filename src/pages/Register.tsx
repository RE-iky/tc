import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { validateRegisterForm } from '@/utils/validation'
import type { RegisterData } from '@/types'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // 如果已登录，重定向到无障碍选择页面
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/accessibility-selection')
    }
  }, [isAuthenticated, navigate])

  // 清除错误信息
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // 如果字段已被触摸过，实时验证
    if (touched[field]) {
      const validation = validateRegisterForm({ ...formData, [field]: value })
      setValidationErrors(validation.errors)
    }
  }

  const handleBlur = (field: keyof RegisterData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))

    // 验证当前表单
    const validation = validateRegisterForm(formData)
    setValidationErrors(validation.errors)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    // 标记所有字段为已触摸
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    // 验证表单
    const validation = validateRegisterForm(formData)
    setValidationErrors(validation.errors)

    if (!validation.isValid) {
      return
    }

    try {
      await register(formData)
      // 注册成功后会自动登录，useEffect会处理重定向
    } catch (err) {
      // 错误已在store中处理
    }
  }

  const getFieldError = (field: keyof RegisterData): string | undefined => {
    return touched[field] ? validationErrors[field] : undefined
  }

  return (
    <main id="main-content" className="register-page" role="main">
      <div className="register-container">
        <header>
          <h1 id="page-title">创建账户</h1>
          <p className="subtitle" id="page-description">
            加入无障碍AI教学平台
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="register-form"
          aria-labelledby="page-title"
          aria-describedby="page-description"
          noValidate
        >
          {/* 姓名字段 */}
          <div className="form-group">
            <label htmlFor="name">
              姓名 <abbr title="必填项" aria-label="必填项">*</abbr>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              aria-required="true"
              aria-invalid={!!getFieldError('name')}
              aria-describedby={getFieldError('name') ? 'name-error' : undefined}
              autoComplete="name"
              placeholder="请输入您的姓名"
              disabled={isLoading}
            />
            {getFieldError('name') && (
              <div
                id="name-error"
                className="field-error"
                role="alert"
                aria-live="polite"
              >
                {getFieldError('name')}
              </div>
            )}
          </div>

          {/* 邮箱字段 */}
          <div className="form-group">
            <label htmlFor="email">
              邮箱 <abbr title="必填项" aria-label="必填项">*</abbr>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={!!getFieldError('email')}
              aria-describedby={getFieldError('email') ? 'email-error' : undefined}
              autoComplete="email"
              placeholder="请输入邮箱地址"
              disabled={isLoading}
            />
            {getFieldError('email') && (
              <div
                id="email-error"
                className="field-error"
                role="alert"
                aria-live="polite"
              >
                {getFieldError('email')}
              </div>
            )}
          </div>

          {/* 密码字段 */}
          <div className="form-group">
            <label htmlFor="password">
              密码 <abbr title="必填项" aria-label="必填项">*</abbr>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-required="true"
              aria-invalid={!!getFieldError('password')}
              aria-describedby={getFieldError('password') ? 'password-error' : 'password-hint'}
              autoComplete="new-password"
              placeholder="请输入密码"
              disabled={isLoading}
            />
            <div id="password-hint" className="field-hint">
              密码长度至少为6个字符
            </div>
            {getFieldError('password') && (
              <div
                id="password-error"
                className="field-error"
                role="alert"
                aria-live="polite"
              >
                {getFieldError('password')}
              </div>
            )}
          </div>

          {/* 确认密码字段 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              确认密码 <abbr title="必填项" aria-label="必填项">*</abbr>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              aria-required="true"
              aria-invalid={!!getFieldError('confirmPassword')}
              aria-describedby={getFieldError('confirmPassword') ? 'confirmPassword-error' : undefined}
              autoComplete="new-password"
              placeholder="请再次输入密码"
              disabled={isLoading}
            />
            {getFieldError('confirmPassword') && (
              <div
                id="confirmPassword-error"
                className="field-error"
                role="alert"
                aria-live="polite"
              >
                {getFieldError('confirmPassword')}
              </div>
            )}
          </div>

          {/* 全局错误信息 */}
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

          {/* 提交按钮 */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            aria-label={isLoading ? '正在注册...' : '提交注册表单'}
          >
            {isLoading ? '注册中...' : '注册'}
          </button>

          {/* 登录链接 */}
          <p className="help-text">
            已有账户？{' '}
            <Link to="/login" className="link">
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}

export default Register
