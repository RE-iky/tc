import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useAssignmentStore } from '@/store/assignment'
import './TeacherDashboard.css'

function TeacherDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { getPendingGradingCount, getAssignmentsByStatus } = useAssignmentStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const pendingCount = getPendingGradingCount()
  const gradedCount = getAssignmentsByStatus('graded').length
  const totalAssignments = getAssignmentsByStatus('submitted').length + gradedCount

  return (
    <div className="teacher-dashboard-page">
      <header className="dashboard-header" role="banner">
        <h1 id="site-title">教师管理平台</h1>
        <div className="header-content">
          <div className="user-section">
            <span className="user-name" aria-label={`当前用户：${user?.name}`}>
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn-logout"
              aria-label="退出登录"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="dashboard-main" role="main">
        <section
          className="welcome-section"
          aria-labelledby="welcome-heading"
        >
          <h2 id="welcome-heading">欢迎，{user?.name}老师</h2>
          <p className="subtitle">管理学生作业和教学视频</p>
        </section>

        <section
          className="stats-section"
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading">统计概览</h2>
          <div className="stats-grid" role="list">
            <article className="stat-card" role="listitem">
              <div className="stat-icon" aria-hidden="true">📝</div>
              <div className="stat-content">
                <dt className="stat-label">待评分作业</dt>
                <dd className="stat-value">{pendingCount}</dd>
              </div>
            </article>
            <article className="stat-card" role="listitem">
              <div className="stat-icon" aria-hidden="true">✅</div>
              <div className="stat-content">
                <dt className="stat-label">已评分作业</dt>
                <dd className="stat-value">{gradedCount}</dd>
              </div>
            </article>
            <article className="stat-card" role="listitem">
              <div className="stat-icon" aria-hidden="true">📊</div>
              <div className="stat-content">
                <dt className="stat-label">作业总数</dt>
                <dd className="stat-value">{totalAssignments}</dd>
              </div>
            </article>
          </div>
        </section>

        <section
          className="actions-section"
          aria-labelledby="actions-heading"
        >
          <h2 id="actions-heading">快速操作</h2>
          <div className="actions-grid" role="list">
            <Link
              to="/teacher/submissions"
              className="action-card"
              role="listitem"
              aria-label="查看学生作业提交"
            >
              <span className="action-icon" aria-hidden="true">📋</span>
              <h3>学生作业</h3>
              <p>查看和评分学生提交的作业</p>
              {pendingCount > 0 && (
                <span className="badge" aria-label={`${pendingCount}个待评分`}>
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link
              to="/home"
              className="action-card"
              role="listitem"
              aria-label="管理教学视频"
            >
              <span className="action-icon" aria-hidden="true">🎥</span>
              <h3>视频管理</h3>
              <p>上传和管理教学视频</p>
            </Link>
            <Link
              to="/accessibility-selection"
              className="action-card"
              role="listitem"
              aria-label="无障碍设置"
            >
              <span className="action-icon" aria-hidden="true">⚙️</span>
              <h3>设置</h3>
              <p>调整无障碍偏好和系统设置</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default TeacherDashboard
