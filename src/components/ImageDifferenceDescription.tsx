import React from 'react'
import { ImageInfo } from '@/types'

interface ImageDifferenceDescriptionProps {
  imageA: ImageInfo
  imageB: ImageInfo
  onSelectImage?: (imageId: string) => void
}

const ImageDifferenceDescription: React.FC<ImageDifferenceDescriptionProps> = ({
  imageA,
  imageB,
  onSelectImage,
}) => {
  return (
    <div className="image-difference">
      <div className="image-item">
        <img src={imageA.src} alt={imageA.alt} />
        <p>
          <strong>{imageA.title}:</strong> {imageA.description}
        </p>
        {onSelectImage && (
          <button
            onClick={() => onSelectImage(imageA.id)}
            aria-label={`选择${imageA.title}`}
          >
            选择此图片
          </button>
        )}
      </div>
      <div className="image-item">
        <img src={imageB.src} alt={imageB.alt} />
        <p>
          <strong>{imageB.title}:</strong> {imageB.description}
        </p>
        {onSelectImage && (
          <button
            onClick={() => onSelectImage(imageB.id)}
            aria-label={`选择${imageB.title}`}
          >
            选择此图片
          </button>
        )}
      </div>
    </div>
  )
}

export default ImageDifferenceDescription
