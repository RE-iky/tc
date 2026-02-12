import React from 'react'
import { ImageInfo } from '@/types'

interface ImageGalleryProps {
  images: ImageInfo[]
  onSelectImage: (imageId: string) => void
  selectedImageId?: string | null
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onSelectImage, selectedImageId }) => {
  return (
    <div className="image-gallery">
      {images.map((image) => {
        const isSelected = selectedImageId === image.id
        return (
          <div
            key={image.id}
            className={`image-item ${isSelected ? 'selected' : ''}`}
          >
            <img src={image.src} alt={image.alt} />
            <p>
              <strong>{image.title}:</strong> {image.description}
            </p>
            <button
              onClick={() => onSelectImage(image.id)}
              aria-label={isSelected ? `取消选择${image.title}` : `选择${image.title}`}
            >
              {isSelected ? '✓ 已选择' : '选择此图片'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ImageGallery
