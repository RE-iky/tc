import React from 'react'
import { ImageInfo } from '@/types'

interface AccessibleImageSelectionProps {
  images: ImageInfo[]
  onSelectImage: (imageId: string) => void
  selectedImageId?: string | null
}

const AccessibleImageSelection: React.FC<AccessibleImageSelectionProps> = ({
  images,
  onSelectImage,
  selectedImageId,
}) => {
  // 语音朗读功能
  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      // 停止当前正在播放的语音
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN' // 设置为中文
      utterance.rate = 0.9 // 语速
      utterance.pitch = 1 // 音调

      window.speechSynthesis.speak(utterance)
    } else {
      alert('您的浏览器不支持语音朗读功能')
    }
  }

  return (
    <div className="accessible-image-selection">
      {images.map((image) => {
        const isSelected = selectedImageId === image.id
        return (
          <div key={image.id} className={`image-item ${isSelected ? 'selected' : ''}`}>
            <img src={image.src} alt={image.alt} />
            <div className="description">
              <p>
                {image.title}: {image.description}
              </p>
              <div className="button-group">
                <button
                  onClick={() => readAloud(`${image.title}: ${image.description}`)}
                  aria-label={`朗读${image.title}的描述`}
                  className="read-aloud-btn"
                >
                  朗读描述
                </button>
                <button
                  onClick={() => onSelectImage(image.id)}
                  aria-label={isSelected ? `取消选择${image.title}` : `选择${image.title}`}
                  className="select-btn"
                >
                  {isSelected ? '✓ 已选择' : '选择此图片'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AccessibleImageSelection
