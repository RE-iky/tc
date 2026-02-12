import { useState, useRef, useEffect } from 'react'
import { VideoInfo } from '@/types'
import { useAccessibilityStore } from '@/store/accessibility'
import GlossaryPanel from './GlossaryPanel'
import VideoSummary from './VideoSummary'
import './VideoPlayer.css'

interface VideoPlayerProps {
  video: VideoInfo
  onClose?: () => void
}

interface AnalysisResult {
  video_info: {
    title: string
    duration: number
    uploader: string
    description: string
    url: string
  }
  audio_transcript: Array<{
    start: number
    end: number
    text: string
  }>
  visual_content: Array<{
    timestamp: number
    texts: string[]
  }>
  scene_descriptions?: Array<{
    timestamp: number
    description: string
  }>
}

function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const { preferences } = useAccessibilityStore()
  const [showTranscript, setShowTranscript] = useState(false)
  const [generatingSubtitle, setGeneratingSubtitle] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // 听障模式默认显示文字稿
    if (preferences.accessibilityType === 'hearing') {
      setShowTranscript(true)
    }
  }, [preferences.accessibilityType])

  // 清理 blob URL
  useEffect(() => {
    return () => {
      if (subtitleBlobUrl) {
        URL.revokeObjectURL(subtitleBlobUrl)
      }
    }
  }, [subtitleBlobUrl])

  // 创建字幕 Blob URL (从 audio_transcript 生成 SRT 格式)
  const createSubtitleBlobUrl = (transcript: AnalysisResult['audio_transcript']): string => {
    // 清理旧的 blob URL
    if (subtitleBlobUrl) {
      URL.revokeObjectURL(subtitleBlobUrl)
    }

    // 生成 SRT 格式
    let srtContent = ''
    transcript.forEach((item, index) => {
      const startTime = formatTimestamp(item.start)
      const endTime = formatTimestamp(item.end)
      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${item.text}\n\n`
    })

    const blob = new Blob([srtContent], { type: 'text/vtt' })
    return URL.createObjectURL(blob)
  }

  // 格式化时间戳为 SRT 格式
  const formatTimestamp = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  // 格式化转录文本用于显示
  const formatTranscriptForDisplay = (transcript: AnalysisResult['audio_transcript']): string => {
    return transcript.map(item => {
      const time = `${Math.floor(item.start / 60)}:${Math.floor(item.start % 60).toString().padStart(2, '0')}`
      return `[${time}] ${item.text}`
    }).join('\n')
  }

  // 生成字幕和内容分析（使用 bili_text API）
  const handleGenerateSubtitle = async () => {
    setGeneratingSubtitle(true)
    setProgress(0)

    try {
      // Step 1: 创建任务
      const createResponse = await fetch('/api/bilibili/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: video.url,
          options: {
            audio_transcription: true,
            visual_analysis: 'ocr',
            frame_interval: 2.0,
            language: 'zh'
          }
        })
      })

      const createResult = await createResponse.json()

      if (!createResult.success) {
        alert('创建分析任务失败: ' + createResult.message)
        setGeneratingSubtitle(false)
        return
      }

      const taskId = createResult.data.taskId

      // Step 2: 轮询任务状态
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/bilibili/tasks/${taskId}/status`)
          const statusResult = await statusResponse.json()

          if (statusResult.success) {
            const { status, progress: currProgress, message } = statusResult.data
            setProgress(currProgress)

            if (status === 'completed') {
              clearInterval(pollInterval)

              // Step 3: 获取分析结果
              const resultResponse = await fetch(`/api/bilibili/tasks/${taskId}/result?format=json`)
              const resultData = await resultResponse.json()

              if (resultData.success) {
                const analysis = resultData.data as AnalysisResult
                setAnalysisResult(analysis)

                // 生成字幕文件
                if (analysis.audio_transcript && analysis.audio_transcript.length > 0) {
                  const blobUrl = createSubtitleBlobUrl(analysis.audio_transcript)
                  setSubtitleBlobUrl(blobUrl)

                  // 如果是自定义视频，动态添加字幕轨道
                  if (video.platform === 'custom' && videoRef.current) {
                    const tracks = videoRef.current.querySelectorAll('track')
                    tracks.forEach(track => track.remove())

                    const track = document.createElement('track')
                    track.kind = 'subtitles'
                    track.src = blobUrl
                    track.srclang = 'zh'
                    track.label = '中文字幕'
                    track.default = true
                    videoRef.current.appendChild(track)

                    track.addEventListener('load', () => {
                      if (videoRef.current?.textTracks.length) {
                        videoRef.current.textTracks[0].mode = 'showing'
                      }
                    })
                  }
                }

                setShowTranscript(true)
              } else {
                alert('获取分析结果失败')
              }

              setGeneratingSubtitle(false)
            } else if (status === 'failed') {
              clearInterval(pollInterval)
              alert('分析失败: ' + message)
              setGeneratingSubtitle(false)
            }
          }
        } catch (error) {
          console.error('轮询任务状态失败:', error)
        }
      }, 2000)

      // 设置超时保护（10分钟）
      setTimeout(() => {
        clearInterval(pollInterval)
        if (generatingSubtitle) {
          setGeneratingSubtitle(false)
          alert('分析超时，请稍后重试')
        }
      }, 600000)

    } catch (error) {
      console.error('分析失败:', error)
      alert('分析失败，请稍后重试')
      setGeneratingSubtitle(false)
    }
  }

  const renderPlayer = () => {
    if (video.platform === 'custom') {
      return (
        <video
          ref={videoRef}
          controls
          className="video-element"
          aria-label={`播放视频: ${video.title}`}
        >
          <source src={video.embedUrl} type="video/mp4" />
          {(video.subtitleUrl || subtitleBlobUrl) && (
            <track
              kind="subtitles"
              src={video.subtitleUrl || subtitleBlobUrl}
              srcLang="zh"
              label="中文字幕"
              default
            />
          )}
          您的浏览器不支持视频播放
        </video>
      )
    }

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
            ✕
          </button>
        )}
      </header>

      <div className="video-container">
        {renderPlayer()}
      </div>

      <div className="video-controls">
        {!video.transcript && !analysisResult && (
          <button
            onClick={handleGenerateSubtitle}
            className="transcript-toggle"
            disabled={generatingSubtitle}
            aria-label="生成视频字幕和内容分析"
          >
            {generatingSubtitle ? `分析中 ${progress}%...` : 'AI 分析视频'}
          </button>
        )}
        {(video.transcript || analysisResult) && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="transcript-toggle"
            aria-expanded={showTranscript}
            aria-controls="video-transcript"
          >
            {showTranscript ? '隐藏' : '显示'}文字稿
          </button>
        )}
      </div>

      {showTranscript && analysisResult && (
        <section
          id="video-transcript"
          className="video-transcript"
          aria-label="视频文字稿"
        >
          <h4>语音转录</h4>
          <div className="transcript-content">
            {formatTranscriptForDisplay(analysisResult.audio_transcript)}
          </div>

          {analysisResult.visual_content && analysisResult.visual_content.length > 0 && (
            <>
              <h4>画面文字</h4>
              <div className="transcript-content">
                {analysisResult.visual_content.map((item, index) => (
                  <p key={index}>
                    [{item.timestamp.toFixed(1)}s] {item.texts.join(' | ')}
                  </p>
                ))}
              </div>
            </>
          )}

          {analysisResult.scene_descriptions && analysisResult.scene_descriptions.length > 0 && (
            <>
              <h4>场景描述</h4>
              <div className="transcript-content">
                {analysisResult.scene_descriptions.map((item, index) => (
                  <p key={index}>
                    [{item.timestamp.toFixed(1)}s] {item.description}
                  </p>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {video.description && (
        <section className="video-description" aria-label="视频描述">
          <h4>视频描述</h4>
          <p>{video.description}</p>
        </section>
      )}

      {video.summary && (
        <VideoSummary summary={video.summary} />
      )}

      {video.fullDescription && (
        <section
          className="video-full-description"
          role="region"
          aria-labelledby="full-description-heading"
        >
          <h4 id="full-description-heading" className="full-description-title">
            完整文字描述
          </h4>
          <div className="full-description-content">
            <p>{video.fullDescription}</p>
          </div>
        </section>
      )}

      {video.glossary && video.glossary.length > 0 && (
        <GlossaryPanel terms={video.glossary} />
      )}
    </article>
  )
}

export default VideoPlayer
