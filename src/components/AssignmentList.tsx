import type { Assignment } from '@/types'
import './AssignmentList.css'

interface AssignmentListProps {
  assignments: Assignment[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSubmit: (id: string) => void
}

function AssignmentList({
  assignments,
  onEdit,
  onDelete,
  onSubmit,
}: AssignmentListProps) {
  const getStatusLabel = (status: Assignment['status']) => {
    const labels = {
      draft: '草稿',
      submitted: '已提交',
      graded: '已评分',
    }
    return labels[status]
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

  return (
    <section className="assignment-list" aria-labelledby="list-heading">
      <h3 id="list-heading" className="sr-only">作业列表</h3>
      <div className="assignments-grid" role="list">
        {assignments.map((assignment) => (
          <article
            key={assignment.id}
            className={`assignment-card status-${assignment.status}`}
            role="listitem"
          >
            {/* 状态标签 */}
            <div className="assignment-status">
              <span className={`status-badge status-${assignment.status}`}>
                {getStatusLabel(assignment.status)}
              </span>
            </div>

            {/* 作业信息 */}
            <div className="assignment-info">
              <h4 className="assignment-title">{assignment.title}</h4>
              <p className="assignment-description">{assignment.description}</p>
              <div className="assignment-meta">
                <span className="meta-item">
                  创建时间: {formatDate(assignment.createdAt)}
                </span>
                {assignment.submittedAt && (
                  <span className="meta-item">
                    提交时间: {formatDate(assignment.submittedAt)}
                  </span>
                )}
                {assignment.fileData && (
                  <span className="meta-item">
                    附件: {assignment.fileData.name}
                  </span>
                )}
              </div>

              {/* 评分信息 */}
              {assignment.status === 'graded' && assignment.grade !== undefined && (
                <div className="grading-info">
                  <div className="grade-display">
                    <span className="grade-label">成绩：</span>
                    <span className="grade-value" aria-label={`成绩${assignment.grade}分`}>
                      {assignment.grade}分
                    </span>
                  </div>
                  {assignment.feedback && (
                    <div className="feedback-display">
                      <span className="feedback-label">教师反馈：</span>
                      <p className="feedback-content">{assignment.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="assignment-actions">
              {assignment.status === 'draft' && (
                <>
                  <button
                    onClick={() => onEdit(assignment.id)}
                    className="btn-action btn-edit"
                    aria-label={`编辑作业: ${assignment.title}`}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => onSubmit(assignment.id)}
                    className="btn-action btn-submit"
                    aria-label={`提交作业: ${assignment.title}`}
                  >
                    提交
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(assignment.id)}
                className="btn-action btn-delete"
                aria-label={`删除作业: ${assignment.title}`}
                disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AssignmentList
