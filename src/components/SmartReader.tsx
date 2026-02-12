import { useEffect } from 'react'
import { useSmartReader } from '@/hooks/useSmartReader'
import './SmartReader.css'

interface SmartReaderProps {
  content: string // 要朗读的内容
  autoStart?: boolean // 是否自动开始朗读
}

function SmartReader({ content, autoStart = false }: SmartReaderProps) {
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported, hasScreenReader } = useSmartReader()

  useEffect(() => {
    if (autoStart && content && !hasScreenReader) {
      speak(content)
    }
  }, [autoStart, content, speak, hasScreenReader])

  // 如果检测到屏幕阅读器，不显示控制按钮
  if (hasScreenReader) {
    return null
  }

  // 如果浏览器不支持语音合成，显示提示
  if (!isSupported) {
    return (
      <div className="smart-reader-unsupported" role="status">
        <p>您的浏览器不支持语音朗读功能</p>
      </div>
    )
  }

  const handleSpeak = () => {
    if (content) {
      speak(content)
    }
  }

  return (
    <div className="smart-reader" role="region" aria-label="朗读控制">
      <div className="reader-controls">
        {!isSpeaking && !isPaused && (
          <button
            onClick={handleSpeak}
            className="reader-btn reader-btn-play"
            aria-label="开始朗读页面内容"
          >
            🔊 开始朗读
          </button>
        )}

        {isSpeaking && !isPaused && (
          <button
            onClick={pause}
            className="reader-btn reader-btn-pause"
            aria-label="暂停朗读"
          >
            ⏸️ 暂停
          </button>
        )}

        {isPaused && (
          <button
            onClick={resume}
            className="reader-btn reader-btn-resume"
            aria-label="继续朗读"
          >
            ▶️ 继续
          </button>
        )}

        {(isSpeaking || isPaused) && (
          <button
            onClick={stop}
            className="reader-btn reader-btn-stop"
            aria-label="停止朗读"
          >
            ⏹️ 停止
          </button>
        )}
      </div>

      {isSpeaking && (
        <div className="reader-status" role="status" aria-live="polite">
          正在朗读...
        </div>
      )}
    </div>
  )
}

export default SmartReader
