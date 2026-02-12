import { useState } from 'react'
import { VideoInfo, GlossaryTerm } from '@/types'
import { parseVideoUrl, getPlatformName } from '@/utils/videoParser'
import { useAuthStore } from '@/store/auth'
import './VideoImport.css'

interface VideoImportProps {
  onVideoAdd: (video: VideoInfo) => void
}

function VideoImport({ onVideoAdd }: VideoImportProps) {
  const { user } = useAuthStore()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<VideoInfo | null>(null)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setError('')

    // 自动解析URL
    if (newUrl.trim()) {
      const parsed = parseVideoUrl(newUrl)
      if (parsed) {
        setPreview({
          id: Date.now().toString(),
          title: title || '未命名视频',
          platform: parsed.platform,
          url: newUrl,
          embedUrl: parsed.embedUrl,
          duration: 0,
          hasSubtitles: false,
          uploadedBy: user?.role || 'student',
          uploaderId: user?.id || '',
          uploadedAt: new Date().toISOString()
        })
      } else {
        setPreview(null)
        setError('无法识别的视频URL，请检查链接格式')
      }
    } else {
      setPreview(null)
    }
  }

  const handleAddTerm = () => {
    setGlossaryTerms([...glossaryTerms, { term: '', definition: '', context: '' }])
  }

  const handleRemoveTerm = (index: number) => {
    setGlossaryTerms(glossaryTerms.filter((_, i) => i !== index))
  }

  const handleTermChange = (index: number, field: keyof GlossaryTerm, value: string) => {
    const newTerms = [...glossaryTerms]
    newTerms[index] = { ...newTerms[index], [field]: value }
    setGlossaryTerms(newTerms)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('请输入视频URL')
      return
    }

    if (!title.trim()) {
      setError('请输入视频标题')
      return
    }

    if (!preview) {
      setError('无法解析视频URL')
      return
    }

    // 过滤掉空的术语
    const validGlossary = glossaryTerms.filter(
      (term) => term.term.trim() && term.definition.trim()
    )

    const video: VideoInfo = {
      ...preview,
      title,
      summary: summary.trim() || undefined,
      fullDescription: fullDescription.trim() || undefined,
      glossary: validGlossary.length > 0 ? validGlossary : undefined,
      uploadedBy: user?.role || 'student',
      uploaderId: user?.id || '',
      uploadedAt: new Date().toISOString()
    }

    onVideoAdd(video)

    // 重置表单
    setUrl('')
    setTitle('')
    setSummary('')
    setFullDescription('')
    setGlossaryTerms([])
    setPreview(null)
    setError('')
  }

  return (
    <section
      className="video-import"
      aria-labelledby="video-import-heading"
    >
      <h3 id="video-import-heading">导入视频</h3>

      <form onSubmit={handleSubmit} aria-describedby="video-import-description">
        <p id="video-import-description" className="form-description">
          支持YouTube、Bilibili、Vimeo等平台视频链接
        </p>

        <div className="form-group">
          <label htmlFor="video-url">
            视频链接
            <abbr title="必填项" aria-label="必填项">*</abbr>
          </label>
          <input
            id="video-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="粘贴视频链接，如：https://www.youtube.com/watch?v=..."
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
          />
        </div>

        <div className="form-group">
          <label htmlFor="video-title">
            视频标题
            <abbr title="必填项" aria-label="必填项">*</abbr>
          </label>
          <input
            id="video-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入视频标题"
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="video-summary">
            视频内容总结
            <span className="optional-label">（可选）</span>
          </label>
          <textarea
            id="video-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="输入视频内容的简洁总结，概括核心内容和学习要点..."
            rows={4}
            aria-describedby="summary-hint"
          />
          <small id="summary-hint" className="field-hint">
            帮助学生快速了解视频的主要内容
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="video-full-description">
            完整文字描述
            <span className="optional-label">（可选）</span>
          </label>
          <textarea
            id="video-full-description"
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            placeholder="输入视频的完整文字描述，包括所有讲解内容、步骤说明等..."
            rows={6}
            aria-describedby="full-description-hint"
          />
          <small id="full-description-hint" className="field-hint">
            特别适用于听障用户，提供视频内容的完整文字版本
          </small>
        </div>

        <div className="form-group glossary-section">
          <div className="glossary-header">
            <label>AI术语解释 <span className="optional-label">（可选）</span></label>
            <button
              type="button"
              onClick={handleAddTerm}
              className="btn-add-term"
              aria-label="添加新术语"
            >
              + 添加术语
            </button>
          </div>
          {glossaryTerms.map((term, index) => (
            <div key={index} className="term-input-group">
              <div className="term-row">
                <input
                  type="text"
                  value={term.term}
                  onChange={(e) => handleTermChange(index, 'term', e.target.value)}
                  placeholder="术语名称"
                  aria-label={`术语${index + 1}名称`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTerm(index)}
                  className="btn-remove-term"
                  aria-label={`删除术语${index + 1}`}
                >
                  ×
                </button>
              </div>
              <textarea
                value={term.definition}
                onChange={(e) => handleTermChange(index, 'definition', e.target.value)}
                placeholder="术语定义"
                rows={2}
                aria-label={`术语${index + 1}定义`}
              />
              <input
                type="text"
                value={term.context || ''}
                onChange={(e) => handleTermChange(index, 'context', e.target.value)}
                placeholder="使用场景（可选）"
                aria-label={`术语${index + 1}使用场景`}
              />
            </div>
          ))}
        </div>

        {error && (
          <div
            id="url-error"
            className="error-message"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {preview && (
          <div className="video-preview" aria-label="视频预览">
            <p>
              <strong>平台：</strong>
              {getPlatformName(preview.platform)}
            </p>
            <p>
              <strong>链接：</strong>
              {preview.url}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={!preview || !title.trim()}
          aria-label="添加视频到课程"
        >
          添加视频
        </button>
      </form>
    </section>
  )
}

export default VideoImport
