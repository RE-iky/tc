import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAssignmentStore } from '@/store/assignment'
import { validateGradingForm } from '@/utils/validation'
import type { GradingFormData } from '@/types'
import './GradeAssignment.css'

function GradeAssignment() {
  const navigate = useNavigate()
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { getAssignmentById, gradeAssignment } = useAssignmentStore()

  const [formData, setFormData] = useState<GradingFormData>({
    grade: 0,
    feedback: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const assignment = assignmentId ? getAssignmentById(assignmentId) : undefined

  useEffect(() => {
    if (assignment && assignment.status === 'graded') {
      setFormData({
        grade: assignment.grade || 0,
        feedback: assignment.feedback || '',
      })
    }
  }, [assignment])

  if (!assignment) {
    return (
      <div className="grade-assignment-page">
        <main className="error-container">
          <h1>作业不存在</h1>
          <Link to="/teacher/submissions" className="btn-back">
            返回作业列表
          </Link>
        </main>
      </div>
    )
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateGradingForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      gradeAssignment(assignment.id, formData.grade, formData.feedback)
      navigate('/teacher/submissions')
    } catch (error) {
      setErrors({ submit: '评分失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setFormData({ ...formData, grade: isNaN(value) ? 0 : value })
    if (errors.grade) {
      setErrors({ ...errors, grade: '' })
    }
  }

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, feedback: e.target.value })
    if (errors.feedback) {
      setErrors({ ...errors, feedback: '' })
    }
  }

  const isGraded = assignment.status === 'graded'

  return (
    <div className="grade-assignment-page">
      <header className="grade-header" role="banner">
        <div className="header-content">
          <h1 id="page-title">{isGraded ? '查看评分' : '评分作业'}</h1>
          <Link
            to="/teacher/submissions"
            className="btn-back"
            aria-label="返回作业列表"
          >
            ← 返回列表
          </Link>
        </div>
      </header>

      <main id="main-content" className="grade-main" role="main">
        <section
          className="assignment-details"
          aria-labelledby="details-heading"
        >
          <h2 id="details-heading">作业详情</h2>

          <div className="details-card">
            <dl className="details-list">
              <div className="detail-item">
                <dt>作业标题：</dt>
                <dd>{assignment.title}</dd>
              </div>
              <div className="detail-item">
                <dt>学生ID：</dt>
                <dd>{assignment.userId}</dd>
              </div>
              <div className="detail-item">
                <dt>提交时间：</dt>
                <dd>{assignment.submittedAt ? formatDate(assignment.submittedAt) : '未提交'}</dd>
              </div>
            </dl>

            <div className="detail-section">
              <h3>作业描述</h3>
              <p>{assignment.description}</p>
            </div>

            <div className="detail-section">
              <h3>作业内容</h3>
              <p className="assignment-content">{assignment.content}</p>
            </div>

            {assignment.fileData && (
              <div className="detail-section">
                <h3>附件</h3>
                <div className="file-info">
                  <span className="file-icon" aria-hidden="true">📎</span>
                  <span className="file-name">{assignment.fileData.name}</span>
                  <span className="file-size">
                    ({(assignment.fileData.size / 1024).toFixed(2)} KB)
                  </span>
                  <a
                    href={assignment.fileData.dataUrl}
                    download={assignment.fileData.name}
                    className="btn-download"
                    aria-label={`下载附件：${assignment.fileData.name}`}
                  >
                    下载
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          className="grading-section"
          aria-labelledby="grading-heading"
        >
          <h2 id="grading-heading">{isGraded ? '评分信息' : '评分'}</h2>

          <form onSubmit={handleSubmit} className="grading-form" noValidate>
            <div className="form-group">
              <label htmlFor="grade" className="form-label">
                成绩（0-100分）
                <span className="required" aria-label="必填">*</span>
              </label>
              <input
                type="number"
                id="grade"
                name="grade"
                min="0"
                max="100"
                value={formData.grade}
                onChange={handleGradeChange}
                disabled={isGraded}
                className={`form-input ${errors.grade ? 'error' : ''}`}
                aria-invalid={!!errors.grade}
                aria-describedby={errors.grade ? 'grade-error' : undefined}
                required
              />
              {errors.grade && (
                <p id="grade-error" className="error-message" role="alert">
                  {errors.grade}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="feedback" className="form-label">
                评语反馈
                <span className="required" aria-label="必填">*</span>
              </label>
              <textarea
                id="feedback"
                name="feedback"
                rows={6}
                value={formData.feedback}
                onChange={handleFeedbackChange}
                disabled={isGraded}
                className={`form-textarea ${errors.feedback ? 'error' : ''}`}
                aria-invalid={!!errors.feedback}
                aria-describedby={errors.feedback ? 'feedback-error' : undefined}
                placeholder="请输入对学生作业的评语和建议（至少10个字符）"
                required
              />
              <p className="char-count" aria-live="polite">
                {formData.feedback.length} / 1000 字符
              </p>
              {errors.feedback && (
                <p id="feedback-error" className="error-message" role="alert">
                  {errors.feedback}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="error-message" role="alert">
                {errors.submit}
              </div>
            )}

            {!isGraded && (
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? '正在提交评分' : '提交评分'}
                >
                  {isSubmitting ? '提交中...' : '提交评分'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/teacher/submissions')}
                  disabled={isSubmitting}
                  aria-label="取消评分"
                >
                  取消
                </button>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  )
}

export default GradeAssignment
