import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAssignmentStore } from '@/store/assignment'
import { useAuthStore } from '@/store/auth'
import AssignmentList from '@/components/AssignmentList'
import AssignmentForm from '@/components/AssignmentForm'
import SmartReader from '@/components/SmartReader'
import { extractPageContent } from '@/utils/contentExtractor'
import type { AssignmentFormData, AssignmentFilter } from '@/types'
import './Assignment.css'

function Assignment() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const {
    assignments,
    currentFilter,
    isLoading,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getFilteredAssignments,
    setFilter,
    clearError,
  } = useAssignmentStore()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pageContent, setPageContent] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'submit'
    id: string
  } | null>(null)

  // 提取页面内容用于朗读
  useEffect(() => {
    const timer = setTimeout(() => {
      const content = extractPageContent('#main-content')
      setPageContent(content)
    }, 500)

    return () => clearTimeout(timer)
  }, [assignments, showForm])

  // 清除错误信息
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  useEffect(() => {
    if (!actionMessage) return

    const timer = setTimeout(() => {
      setActionMessage('')
    }, 2500)

    return () => clearTimeout(timer)
  }, [actionMessage])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAddNew = () => {
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleFormSubmit = async (data: AssignmentFormData) => {
    try {
      if (editingId) {
        await updateAssignment(editingId, data)
      } else {
        await addAssignment(data)
      }
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      // 错误已在 store 中处理
    }
  }

  const handleDelete = (id: string) => {
    setConfirmAction({ type: 'delete', id })
  }

  const handleSubmit = (id: string) => {
    setConfirmAction({ type: 'submit', id })
  }

  const handleConfirm = () => {
    if (!confirmAction) return

    if (confirmAction.type === 'delete') {
      deleteAssignment(confirmAction.id)
      setActionMessage('作业已删除')
    } else {
      submitAssignment(confirmAction.id)
      setActionMessage('作业已提交')
    }
    setConfirmAction(null)
  }

  const handleFilterChange = (filter: AssignmentFilter) => {
    setFilter(filter)
  }

  const filteredAssignments = getFilteredAssignments()

  return (
    <div className="assignment-page">
      <header className="assignment-header" role="banner">
        <h1 id="site-title">作业管理系统</h1>
        <div className="header-content">
          <nav aria-label="主导航" role="navigation">
            <ul role="list">
              <li>
                <Link to="/home" aria-label="返回首页">
                  首页
                </Link>
              </li>
              <li>
                <a href="#assignments" aria-label="跳转到作业列表" aria-current="page">
                  作业
                </a>
              </li>
            </ul>
          </nav>
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

      <main id="main-content" className="assignment-main" role="main">
        {/* 页面标题和操作区 */}
        <section className="page-header-section" aria-labelledby="page-heading">
          <h2 id="page-heading">我的作业</h2>
          <button
            onClick={handleAddNew}
            className="btn-primary"
            aria-label="创建新作业"
            disabled={showForm}
          >
            <span aria-hidden="true">+ </span>
            新建作业
          </button>
        </section>

        {/* 错误提示 */}
        {error && (
          <div className="error-message" role="alert" aria-live="assertive" aria-atomic="true">
            <span aria-hidden="true">⚠️ </span>
            {error}
          </div>
        )}

        {/* 作业表单 */}
        {showForm && (
          <AssignmentForm
            editingId={editingId}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
          />
        )}

        {/* 过滤器 */}
        <section className="filter-section" aria-labelledby="filter-heading">
          <h3 id="filter-heading" className="sr-only">作业筛选</h3>
          <div className="filter-buttons" role="group" aria-label="作业状态筛选">
            <button
              onClick={() => handleFilterChange('all')}
              className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
              aria-pressed={currentFilter === 'all'}
              aria-label="显示所有作业"
            >
              全部 ({assignments.length})
            </button>
            <button
              onClick={() => handleFilterChange('draft')}
              className={`filter-btn ${currentFilter === 'draft' ? 'active' : ''}`}
              aria-pressed={currentFilter === 'draft'}
              aria-label="显示草稿作业"
            >
              草稿 ({assignments.filter((a) => a.status === 'draft').length})
            </button>
            <button
              onClick={() => handleFilterChange('submitted')}
              className={`filter-btn ${currentFilter === 'submitted' ? 'active' : ''}`}
              aria-pressed={currentFilter === 'submitted'}
              aria-label="显示已提交作业"
            >
              已提交 ({assignments.filter((a) => a.status === 'submitted').length})
            </button>
            <button
              onClick={() => handleFilterChange('graded')}
              className={`filter-btn ${currentFilter === 'graded' ? 'active' : ''}`}
              aria-pressed={currentFilter === 'graded'}
              aria-label="显示已评分作业"
            >
              已评分 ({assignments.filter((a) => a.status === 'graded').length})
            </button>
          </div>
        </section>

        {/* 作业列表 */}
        <AssignmentList
          assignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
        />

        {/* 空状态 */}
        {filteredAssignments.length === 0 && (
          <div className="empty-state" role="status" aria-live="polite">
            <p>
              {currentFilter === 'all'
                ? '还没有作业，点击"新建作业"开始创建'
                : `没有${currentFilter === 'draft' ? '草稿' : currentFilter === 'submitted' ? '已提交' : '已评分'}的作业`}
            </p>
          </div>
        )}
      </main>

      {/* 智能朗读控制 */}
      <SmartReader content={pageContent} />

      {confirmAction && (
        <div className="confirm-overlay" role="presentation">
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
          >
            <h3 id="confirm-title">{confirmAction.type === 'delete' ? '删除作业' : '提交作业'}</h3>
            <p id="confirm-description">
              {confirmAction.type === 'delete'
                ? '确定要删除这个作业吗？'
                : '确定要提交这个作业吗？提交后将无法修改。'}
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmAction(null)}>
                取消
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirm}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className="action-toast" role="status" aria-live="polite">
          {actionMessage}
        </div>
      )}
    </div>
  )
}

export default Assignment
