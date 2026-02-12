/**
 * 字幕覆盖组件
 * 在视频上方渲染自定义字幕，支持高对比度和大字体
 */

import { useEffect, useState, useMemo } from 'react'
import { SubtitleItem } from '@/types'
import { getCurrentSubtitle } from '@/services/videoAnalysis'
import { useAccessibilityStore } from '@/store/accessibility'
import './OverlaySubtitle.css'

interface OverlaySubtitleProps {
  subtitles: SubtitleItem[]
  currentTime: number
  isPlaying?: boolean
  videoDuration?: number
}

interface SubtitleDisplayProps {
  subtitles: SubtitleItem[]
  currentTime: number
  onSeek?: (time: number) => void
}

/**
 * 字幕覆盖组件
 */
function OverlaySubtitle({
  subtitles,
  currentTime,
  isPlaying: _isPlaying,
  videoDuration: _videoDuration
}: OverlaySubtitleProps) {
  const { preferences } = useAccessibilityStore()
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  const currentSubtitle = useMemo(
    () => getCurrentSubtitle(subtitles, currentTime),
    [subtitles, currentTime]
  )

  useEffect(() => {
    if (currentSubtitle && !visible && !fadeOut) {
      setVisible(true)
    } else if (!currentSubtitle && visible) {
      setFadeOut(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setFadeOut(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentSubtitle, visible, fadeOut])

  if (!visible || !currentSubtitle) {
    return null
  }

  return (
    <div
      className={`
        overlay-subtitle
        ${fadeOut ? 'fade-out' : 'fade-in'}
        ${preferences.highContrast ? 'high-contrast' : ''}
        ${preferences.accessibilityType === 'visual' ? 'visual-mode' : ''}
        font-${preferences.fontSize}
        position-bottom
      `}
      role="region"
      aria-label="视频字幕"
      aria-live="polite"
    >
      <div className="subtitle-content">
        {currentSubtitle.text}
      </div>
    </div>
  )
}

/**
 * 字幕显示面板组件
 */
export function SubtitleDisplay({
  subtitles,
  currentTime,
  onSeek
}: SubtitleDisplayProps) {
  const { preferences } = useAccessibilityStore()
  const isHighContrast = preferences.highContrast

  const currentIndex = subtitles.findIndex(
    s => currentTime >= s.start && currentTime <= s.end
  )

  const displaySubtitles = useMemo(() => {
    const centerIndex = currentIndex >= 0 ? currentIndex : Math.floor(subtitles.length / 2)
    const start = Math.max(0, centerIndex - 2)
    const end = Math.min(subtitles.length, centerIndex + 3)
    return subtitles.slice(start, end)
  }, [subtitles, currentIndex])

  if (subtitles.length === 0) {
    return (
      <div className="subtitle-display empty">
        <p>暂无字幕</p>
      </div>
    )
  }

  return (
    <div
      className={`
        subtitle-display
        ${isHighContrast ? 'high-contrast' : ''}
        font-${preferences.fontSize}
      `}
      role="log"
      aria-label="字幕列表"
      aria-live="polite"
    >
      {displaySubtitles.map((sub, index) => {
        const isCurrent = currentTime >= sub.start && currentTime <= sub.end

        return (
          <div
            key={`${sub.start}-${index}`}
            className={`
              subtitle-line
              ${isCurrent ? 'current' : ''}
              ${isCurrent && isHighContrast ? 'current-high-contrast' : ''}
            `}
            onClick={() => onSeek?.(sub.start)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSeek?.(sub.start)
              }
            }}
            aria-current={isCurrent ? 'true' : undefined}
          >
            <span className="subtitle-time">
              {formatTime(sub.start)}
            </span>
            <span className="subtitle-text">{sub.text}</span>
          </div>
        )
      })}
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default OverlaySubtitle
