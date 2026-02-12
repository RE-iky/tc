import React from 'react'
import { ImageInfo } from '@/types'

interface ImageComparisonProps {
  imageA: ImageInfo
  imageB: ImageInfo
  onCompare?: (imageAId: string, imageBId: string) => void
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  imageA,
  imageB,
  onCompare,
}) => {
  return (
    <div className="image-comparison">
      <div className="image">
        <img src={imageA.src} alt={imageA.alt} />
        <p>
          <strong>{imageA.title}:</strong> {imageA.description}
        </p>
        {onCompare && (
          <button
            onClick={() => onCompare(imageA.id, imageB.id)}
            aria-label={`对比${imageA.title}和${imageB.title}`}
          >
            对比此图片
          </button>
        )}
      </div>
      <div className="image">
        <img src={imageB.src} alt={imageB.alt} />
        <p>
          <strong>{imageB.title}:</strong> {imageB.description}
        </p>
      </div>
    </div>
  )
}

export default ImageComparison
