import { useState, useEffect, FormEvent, useRef } from 'react'
import { useAssignmentStore } from '@/store/assignment'
import { validateAssignmentForm } from '@/utils/validation'
import type { AssignmentFormData } from '@/types'
import './AssignmentForm.css'

interface AssignmentFormProps {
  editingId: string | null
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

function AssignmentForm({
  editingId,
  onSubmit,
  onCancel,
  isLoading,
}: AssignmentFormProps) {
  const { getAssignmentById } = useAssignmentStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | undefined>(undefined)
  const [fileName, setFileName] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 编辑模式：加载现有数据
  useEffect(() => {
    if (editingId) {
      const assignment = getAssignmentById(editingId)
      if (assignment) {
        setTitle(assignment.title)
        setDescription(assignment.description)
        setContent(assignment.content)
        setFileName(assignment.fileData?.name || '')
      }
    }
  }, [editingId, getAssignmentById])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setValidationErrors((prev) => {
        const { file, ...rest } = prev
        return rest
      })
    }
  }

  const handleRemoveFile = () => {
    setFile(undefined)
    setFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const formData: AssignmentFormData = {
      title,
      description,
      content,
      file,
    }

    const validation = validateAssignmentForm(formData)
    setValidationErrors(validation.errors)

    if (!validation.isValid) {
      const firstErrorField = Object.keys(validation.errors)[0]
      document.getElementById(`assignment-${firstErrorField}`)?.focus()
      return
    }

    await onSubmit(formData)
  }

  return (
    <section className="assignment-form" aria-labelledby="form-heading">
      <h3 id="form-heading">{editingId ? '编辑作业' : '新建作业'}</h3>

      <form onSubmit={handleSubmit} noValidate>
        {/* 标题 */}
        <div className="form-group">
          <label htmlFor="assignment-title">
            作业标题
            <abbr title="必填项" aria-label="必填项">*</abbr>
          </label>
          <input
            id="assignment-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入作业标题"
            aria-required="true"
            aria-invalid={!!validationErrors.title}
            aria-describedby={validationErrors.title ? 'title-error' : 'title-help'}
            disabled={isLoading}
            maxLength={100}
          />
          <span id="title-help" className="help-text">2-100个字符</span>
          {validationErrors.title && (
            <div id="title-error" className="error-message" role="alert" aria-live="polite">
              {validationErrors.title}
            </div>
          )}
        </div>

        {/* 描述 */}
        <div className="form-group">
          <label htmlFor="assignment-description">
            作业描述
            <abbr title="必填项" aria-label="必填项">*</abbr>
          </label>
          <textarea
            id="assignment-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入作业描述"
            aria-required="true"
            aria-invalid={!!validationErrors.description}
            aria-describedby={validationErrors.description ? 'description-error' : 'description-help'}
            disabled={isLoading}
            maxLength={500}
            rows={3}
          />
          <span id="description-help" className="help-text">10-500个字符</span>
          {validationErrors.description && (
            <div id="description-error" className="error-message" role="alert" aria-live="polite">
              {validationErrors.description}
            </div>
          )}
        </div>

        {/* 内容 */}
        <div className="form-group">
          <label htmlFor="assignment-content">
            作业内容
            <abbr title="必填项" aria-label="必填项">*</abbr>
          </label>
          <textarea
            id="assignment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请输入作业内容"
            aria-required="true"
            aria-invalid={!!validationErrors.content}
            aria-describedby={validationErrors.content ? 'content-error' : 'content-help'}
            disabled={isLoading}
            maxLength={5000}
            rows={8}
          />
          <span id="content-help" className="help-text">20-5000个字符</span>
          {validationErrors.content && (
            <div id="content-error" className="error-message" role="alert" aria-live="polite">
              {validationErrors.content}
            </div>
          )}
        </div>

        {/* 文件上传 */}
        <div className="form-group">
          <label htmlFor="assignment-file">附件上传（可选）</label>
          <input
            ref={fileInputRef}
            id="assignment-file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            aria-describedby={validationErrors.file ? 'file-error' : 'file-help'}
            aria-invalid={!!validationErrors.file}
            disabled={isLoading}
          />
          <span id="file-help" className="help-text">
            支持 PDF、Word、文本、图片，最大 5MB
          </span>
          {fileName && (
            <div className="file-preview">
              <span>已选择: {fileName}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="btn-remove-file"
                aria-label="删除文件"
                disabled={isLoading}
              >
                删除
              </button>
            </div>
          )}
          {validationErrors.file && (
            <div id="file-error" className="error-message" role="alert" aria-live="polite">
              {validationErrors.file}
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            aria-label={editingId ? '保存作业' : '创建作业'}
          >
            {isLoading ? '保存中...' : editingId ? '保存' : '创建'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
            aria-label="取消"
          >
            取消
          </button>
        </div>
      </form>
    </section>
  )
}

export default AssignmentForm
