import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAssignmentStore } from '@/store/assignment'
import type { AssignmentStatus } from '@/types'
import './StudentSubmissions.css'

type FilterType = 'all' | 'submitted' | 'graded'

function StudentSubmissions() {
  const navigate = useNavigate()
  const { getAllStudentAssignments, getAssignmentsByStatus } = useAssignmentStore()
  const [filter, setFilter] = useState<FilterType>('all')

  const getFilteredAssignments = () => {
    if (filter === 'all') {
      return getAllStudentAssignments().filter(
        (a) => a.status === 'submitted' || a.status === 'graded'
      )
    }
    return getAssignmentsByStatus(filter as AssignmentStatus)
  }

  const assignments = getFilteredAssignments()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: AssignmentStatus) => {
    switch (status) {
      case 'submitted':
        return '已提交'
      case 'graded':
        return '已评分'
      default:
        return '草稿'
    }
  }

  const getStatusClass = (status: AssignmentStatus) => {
    switch (status) {
      case 'submitted':
        return 'status-submitted'
      case 'graded':
        return 'status-graded'
      default:
        return 'status-draft'
    }
  }

  return (
    <div className="student-submissions-page">
      <header className="submissions-header" role="banner">
        <div className="header-content">
          <h1 id="page-title">学生作业管理</h1>
          <div className="header-actions">
            <Link
              to="/teacher-dashboard"
              className="btn-back"
              aria-label="返回教师主页"
            >
              ← 返回主页
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="submissions-main" role="main">
        <section
          className="filter-section"
          aria-labelledby="filter-heading"
        >
          <h2 id="filter-heading" className="sr-only">筛选作业</h2>
          <div className="filter-buttons" role="group" aria-label="作业状态筛选">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              aria-label="显示全部作业"
            >
              全部
            </button>
            <button
              className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
              onClick={() => setFilter('submitted')}
              aria-pressed={filter === 'submitted'}
              aria-label="显示待评分作业"
            >
              待评分
            </button>
            <button
              className={`filter-btn ${filter === 'graded' ? 'active' : ''}`}
              onClick={() => setFilter('graded')}
              aria-pressed={filter === 'graded'}
              aria-label="显示已评分作业"
            >
              已评分
            </button>
          </div>
        </section>

        <section
          className="assignments-section"
          aria-labelledby="assignments-heading"
        >
          <h2 id="assignments-heading" className="sr-only">作业列表</h2>

          {assignments.length === 0 ? (
            <div className="empty-state" role="status">
              <p>暂无{filter === 'all' ? '' : getStatusLabel(filter as AssignmentStatus)}作业</p>
            </div>
          ) : (
            <div className="assignments-list" role="list">
              {assignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="assignment-card"
                  role="listitem"
                >
                  <div className="card-header">
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <span
                      className={`status-badge ${getStatusClass(assignment.status)}`}
                      aria-label={`状态：${getStatusLabel(assignment.status)}`}
                    >
                      {getStatusLabel(assignment.status)}
                    </span>
                  </div>

                  <div className="card-body">
                    <p className="assignment-description">{assignment.description}</p>

                    <dl className="assignment-meta">
                      <div className="meta-item">
                        <dt>学生ID：</dt>
                        <dd>{assignment.userId}</dd>
                      </div>
                      <div className="meta-item">
                        <dt>提交时间：</dt>
                        <dd>{assignment.submittedAt ? formatDate(assignment.submittedAt) : '未提交'}</dd>
                      </div>
                      {assignment.status === 'graded' && assignment.grade !== undefined && (
                        <div className="meta-item">
                          <dt>成绩：</dt>
                          <dd className="grade-value">{assignment.grade}分</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="card-actions">
                    {assignment.status === 'submitted' && (
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/teacher/grade/${assignment.id}`)}
                        aria-label={`评分作业：${assignment.title}`}
                      >
                        评分
                      </button>
                    )}
                    {assignment.status === 'graded' && (
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/teacher/grade/${assignment.id}`)}
                        aria-label={`查看评分：${assignment.title}`}
                      >
                        查看详情
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default StudentSubmissions
