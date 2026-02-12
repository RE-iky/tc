/**
 * 视频播放器组件
 *
 * 功能：
 * - 支持本地视频和在线视频播放
 * - 调用后端服务进行AI分析（bili_text + bilibili-subtitle）
 * - 渲染自定义字幕覆盖层（支持高对比度、大字体）
 * - 显示分析结果（转录、总结、术语）
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { VideoInfo, VideoAnalysisResult } from '@/types'
import { useAccessibilityStore } from '@/store/accessibility'
import GlossaryPanel from './GlossaryPanel'
import VideoSummary from './VideoSummary'
import OverlaySubtitle, { SubtitleDisplay } from './OverlaySubtitle'
import { analyzeVideo, AnalysisProgress } from '@/services/videoAnalysis'
import './VideoPlayer.css'

interface VideoPlayerProps {
  video: VideoInfo
  onClose?: () => void
}

type AnalysisTab = 'transcript' | 'summary' | 'glossary' | 'visual'

// 进度阶段配置
const STAGE_CONFIG: Record<string, { label: string; icon: string }> = {
  idle: { label: '准备中', icon: '⏳' },
  subtitle: { label: '提取字幕', icon: '📝' },
  subtitleRetry: { label: 'FunASR转录', icon: '🎙️' },
  visual: { label: '视觉分析', icon: '🔍' },
  merging: { label: '整理结果', icon: '📊' },
  complete: { label: '完成', icon: '✅' },
  error: { label: '错误', icon: '❌' }
}

function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const { preferences } = useAccessibilityStore()

  // 状态
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress>({ stage: 'idle', percent: 0, message: '' })
  const [activeTab, setActiveTab] = useState<AnalysisTab>('transcript')

  // 保存视频状态
  const [savingVideo, setSavingVideo] = useState(false)
  const [savedVideoPath, setSavedVideoPath] = useState<string | null>(null)

  // 视频播放状态
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [_isPlaying, setIsPlaying] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 初始化
  useEffect(() => {
    // 听障模式默认显示分析面板
    if (preferences.accessibilityType === 'hearing') {
      setShowAnalysis(true)
      setActiveTab('transcript')
    }

    // 如果视频已有分析结果，直接使用
    if (video.analysisResult) {
      setAnalysisResult(video.analysisResult)
    }
  }, [video, preferences.accessibilityType])

  // 视频时间更新
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  // 视频播放状态变化
  const handlePlayPause = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsPlaying(e.currentTarget.paused)
  }, [])

  // 视频加载完成
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [])

  // 分析视频
  const handleAnalyzeVideo = async () => {
    setGeneratingAnalysis(true)
    setProgress({ stage: 'subtitle', percent: 0, message: '正在连接字幕服务...' })

    try {
      // 调用统一分析服务
      const result = await analyzeVideo(video.url, video.id, {
        includeVisualAnalysis: true,
        visualMode: 'all',
        frameInterval: 2.0,
        language: 'zh',
        onProgress: (stage, percent, message) => {
          setProgress({ stage: stage as AnalysisProgress['stage'], percent, message })
        }
      })

      // 更新分析结果
      setAnalysisResult(result)
      setProgress({ stage: 'complete', percent: 100, message: '分析完成！' })

      // 自动显示分析面板
      setShowAnalysis(true)
      setActiveTab('transcript')

    } catch (error) {
      console.error('分析失败:', error)
      setProgress({ stage: 'error', percent: 0, message: '分析失败，请稍后重试' })
      setTimeout(() => {
        setProgress({ stage: 'idle', percent: 0, message: '' })
      }, 3000)
    } finally {
      setGeneratingAnalysis(false)
    }
  }

  // 保存视频到本地
  const handleSaveVideo = async () => {
    if (video.isLocal) {
      alert('本地视频无需保存')
      return
    }

    if (!video.url.includes('bilibili.com') && !video.url.includes('b23.tv')) {
      alert('当前仅支持保存B站视频')
      return
    }

    setSavingVideo(true)
    setProgress({ stage: 'idle', percent: 0, message: '正在保存视频...' })

    try {
      // 调用后端保存接口
      const response = await fetch('/api/gateway/bilibili/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setSavedVideoPath(data.data.localPath)
        setProgress({ stage: 'complete', percent: 100, message: '视频保存成功！' })

        // 更新分析结果中的视频URL
        setAnalysisResult(prev => prev ? {
          ...prev,
          videoInfo: {
            ...prev.videoInfo,
            url: `/api/videos/file/${data.data.filename}`
          }
        } : prev)
      } else {
        setProgress({ stage: 'error', percent: 0, message: data.message || '保存失败' })
      }
    } catch (error) {
      console.error('保存视频失败:', error)
      setProgress({ stage: 'error', percent: 0, message: '保存失败，请稍后重试' })
    } finally {
      setSavingVideo(false)
      setTimeout(() => {
        setProgress(prev => prev.stage === 'error' ? { ...prev, message: '' } : prev)
      }, 3000)
    }
  }

  // 渲染播放器
  const renderPlayer = () => {
    // 本地视频（优先）
    if (video.isLocal && video.localPath) {
      return (
        <div className="video-wrapper">
          <video
            ref={videoRef}
            controls
            className="video-element"
            aria-label={`播放视频: ${video.title}`}
            src={video.localPath}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlayPause}
            onPause={handlePlayPause}
            onLoadedMetadata={handleLoadedMetadata}
          >
            您的浏览器不支持视频播放
          </video>

          {/* 字幕覆盖层（仅本地视频） */}
          {analysisResult?.subtitles && (
            <OverlaySubtitle
              subtitles={analysisResult.subtitles}
              currentTime={currentTime}
              isPlaying={!videoRef.current?.paused}
              videoDuration={duration}
            />
          )}
        </div>
      )
    }

    // 自定义视频文件
    if (video.platform === 'custom' && video.embedUrl) {
      return (
        <video
          ref={videoRef}
          controls
          className="video-element"
          aria-label={`播放视频: ${video.title}`}
          src={video.embedUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlayPause}
          onPause={handlePlayPause}
          onLoadedMetadata={handleLoadedMetadata}
        >
          您的浏览器不支持视频播放
        </video>
      )
    }

    // 在线视频（iframe）
    return (
      <iframe
        ref={iframeRef}
        src={video.embedUrl}
        title={video.title}
        className="video-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        aria-label={`嵌入视频播放器: ${video.title}`}
      />
    )
  }

  // 渲染进度条
  const renderProgressBar = () => {
    const stageInfo = STAGE_CONFIG[progress.stage] || STAGE_CONFIG.idle

    return (
      <div className="analysis-progress" role="status" aria-live="polite">
        <div className="progress-header">
          <span className="progress-icon">{stageInfo.icon}</span>
          <span className="progress-label">{stageInfo.label}</span>
          <span className="progress-percent">{progress.percent}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress.percent}%` }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <p className="progress-message">{progress.message || '处理中...'}</p>

        {/* 进度阶段指示器 */}
        <div className="progress-stages">
          {Object.entries(STAGE_CONFIG).filter(([key]) => key !== 'error').map(([key, config]) => (
            <div
              key={key}
              className={`progress-stage ${
                progress.stage === key ? 'active' :
                ['idle', 'error'].includes(key) ? '' :
                (() => {
                  const stages = ['subtitle', 'subtitleRetry', 'visual', 'merging', 'complete']
                  const currentIndex = stages.indexOf(progress.stage)
                  const stageIndex = stages.indexOf(key)
                  return stageIndex < currentIndex ? 'completed' : ''
                })()
              }`}
            >
              <span className="stage-icon">{config.icon}</span>
              <span className="stage-label">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <article
      className="video-player"
      aria-labelledby="video-title"
    >
      <header className="video-header">
        <h3 id="video-title">{video.title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="close-button"
            aria-label="关闭视频播放器"
          >
            ×
          </button>
        )}
      </header>

      <div className="video-container">
        {renderPlayer()}
      </div>

      {/* 分析/保存进度显示 */}
      {(generatingAnalysis || savingVideo || progress.stage === 'complete') && (
        renderProgressBar()
      )}

      <div className="video-controls">
        {/* B站视频保存按钮 */}
        {!video.isLocal && (video.url.includes('bilibili.com') || video.url.includes('b23.tv')) && (
          <button
            onClick={handleSaveVideo}
            className="save-button"
            disabled={savingVideo}
            aria-label="保存视频到本地"
          >
            {savingVideo ? '保存中...' : '💾 保存到本地'}
          </button>
        )}

        {/* 已保存标识 */}
        {savedVideoPath && (
          <span className="saved-badge" aria-label="已保存到本地">
            ✓ 已本地保存
          </span>
        )}

        {/* 分析按钮 */}
        {!analysisResult && (
          <button
            onClick={handleAnalyzeVideo}
            className="analyze-button"
            disabled={generatingAnalysis}
            aria-label="AI 分析视频"
          >
            {generatingAnalysis
              ? `✨ 分析中 ${progress.percent}%...`
              : '✨ AI 分析视频'}
          </button>
        )}

        {/* 显示/隐藏分析面板按钮 */}
        {(analysisResult || video.transcript) && (
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="transcript-toggle"
            aria-expanded={showAnalysis}
          >
            {showAnalysis ? '隐藏 AI 分析' : '显示 AI 分析'}
          </button>
        )}

        {/* 本地视频显示字幕开关 */}
        {video.isLocal && analysisResult?.subtitles && (
          <button
            onClick={() => {
              const newPref = { ...preferences, enableCaptions: !preferences.enableCaptions }
              useAccessibilityStore.setState({ preferences: newPref })
            }}
            className="caption-toggle"
            aria-pressed={preferences.enableCaptions}
          >
            {preferences.enableCaptions ? '隐藏字幕' : '显示字幕'}
          </button>
        )}
      </div>

      {/* AI 分析面板 */}
      {showAnalysis && analysisResult && (
        <section
          id="video-analysis"
          className="video-analysis"
          aria-label="视频AI分析"
        >
          {/* Tab 导航 */}
          <div className="analysis-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'transcript'}
              className={`analysis-tab ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              字幕 ({analysisResult.subtitles.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'visual'}
              className={`analysis-tab ${activeTab === 'visual' ? 'active' : ''}`}
              onClick={() => setActiveTab('visual')}
            >
              画面分析
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'summary'}
              className={`analysis-tab ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              内容总结
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'glossary'}
              className={`analysis-tab ${activeTab === 'glossary' ? 'active' : ''}`}
              onClick={() => setActiveTab('glossary')}
            >
              术语 {analysisResult.glossary && analysisResult.glossary.length > 0 ? `(${analysisResult.glossary.length})` : ''}
            </button>
          </div>

          {/* Tab 内容 */}
          <div className="analysis-content" role="tabpanel">
            {/* 字幕 Tab */}
            {activeTab === 'transcript' && (
              <div className="transcript-panel">
                {/* 字幕来源信息 */}
                <div className="subtitle-source-info">
                  <span className="source-badge" data-source={analysisResult.subtitleSource}>
                    {analysisResult.subtitleSource === 'bilibili' ? '📥 B站官方字幕' : '🎙️ FunASR转录'}
                  </span>
                </div>

                {/* 字幕列表（可点击跳转） */}
                <SubtitleDisplay
                  subtitles={analysisResult.subtitles}
                  currentTime={currentTime}
                  onSeek={(time) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = time
                    }
                  }}
                />
              </div>
            )}

            {/* 画面分析 Tab */}
            {activeTab === 'visual' && (
              <div className="visual-panel">
                {/* 画面文字 */}
                {analysisResult.visualContent.length > 0 && (
                  <>
                    <h4>画面文字</h4>
                    <div className="visual-content">
                      {analysisResult.visualContent.map((item, index) => (
                        <p key={index}>
                          <span className="timestamp">[{item.timestamp.toFixed(1)}s]</span>
                          {item.texts.join(' | ')}
                        </p>
                      ))}
                    </div>
                  </>
                )}

                {/* 场景描述 */}
                {analysisResult.sceneDescriptions.length > 0 && (
                  <>
                    <h4>场景描述</h4>
                    <div className="visual-content">
                      {analysisResult.sceneDescriptions.map((item, index) => (
                        <p key={index}>
                          <span className="timestamp">[{item.timestamp.toFixed(1)}s]</span>
                          {item.description}
                        </p>
                      ))}
                    </div>
                  </>
                )}

                {analysisResult.visualContent.length === 0 &&
                 analysisResult.sceneDescriptions.length === 0 && (
                  <p className="no-visual">暂无画面分析结果</p>
                )}
              </div>
            )}

            {/* 总结 Tab */}
            {activeTab === 'summary' && (
              <div className="summary-panel">
                <h4>视频总结</h4>
                <div className="summary-content">
                  {analysisResult.summary || '暂无总结'}
                </div>

                <h4>字幕原文</h4>
                <div className="full-description-content">
                  {analysisResult.fullDescription || '暂无内容'}
                </div>
              </div>
            )}

            {/* 术语 Tab */}
            {activeTab === 'glossary' && (
              <div className="glossary-panel">
                {analysisResult.glossary && analysisResult.glossary.length > 0 ? (
                  <GlossaryPanel terms={analysisResult.glossary} />
                ) : (
                  <p className="no-glossary">未检测到相关术语</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 视频描述（已有数据） */}
      {video.description && (
        <section className="video-description" aria-label="视频描述">
          <h4>视频描述</h4>
          <p>{video.description}</p>
        </section>
      )}

      {/* 视频总结（已有数据） */}
      {video.summary && (
        <VideoSummary summary={video.summary} />
      )}
    </article>
  )
}

export default VideoPlayer
