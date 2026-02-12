import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageGallery from '@/components/ImageGallery'
import ImageComparison from '@/components/ImageComparison'
import '@/components/ImageComponents.css'
import { ImageInfo } from '@/types'

const ImageSelection: React.FC = () => {
  const navigate = useNavigate()
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [images, setImages] = useState<ImageInfo[]>([
    {
      id: '1',
      src: 'https://via.placeholder.com/400x300/87CEEB/000000?text=Winter+Scene',
      alt: '冬季场景图片',
      title: '图片 A',
      description: '一个宁静的冬季场景，有雪和蓝色调。',
    },
    {
      id: '2',
      src: 'https://via.placeholder.com/400x300/FFA500/000000?text=City+Night',
      alt: '城市夜景图片',
      title: '图片 B',
      description: '夜晚充满活力的城市景观，带有橙色和黄色调。',
    },
    {
      id: '3',
      src: 'https://via.placeholder.com/400x300/90EE90/000000?text=Spring+Garden',
      alt: '春季花园图片',
      title: '图片 C',
      description: '春天的花园，充满绿色植物和鲜花。',
    },
  ])

  // 调用 API 获取图片描述
  const getImageDescription = async (imageData: string, fileName: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:3001/api/images/describe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          fileName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        return data.description
      } else {
        console.error('获取图片描述失败:', data.message)
        return `上传的图片: ${fileName}`
      }
    } catch (error) {
      console.error('调用图片描述 API 失败:', error)
      return `上传的图片: ${fileName}`
    }
  }

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageData = e.target?.result as string
        const fileName = file.name

        // 获取 AI 生成的描述
        const description = await getImageDescription(imageData, fileName)

        const newImage: ImageInfo = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          src: imageData,
          alt: file.name,
          title: file.name.split('.')[0],
          description: description,
        }
        setImages((prev) => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSelectImage = (imageId: string) => {
    // 如果点击的是已选择的图片，则取消选择
    if (selectedImageId === imageId) {
      setSelectedImageId(null)
      alert('已取消选择')
      return
    }

    // 否则选择新图片
    setSelectedImageId(imageId)
    const selectedImage = images.find((img) => img.id === imageId)
    if (selectedImage) {
      alert(`您选择了: ${selectedImage.title}`)
    }
  }

  const handleCancelSelection = () => {
    setSelectedImageId(null)
  }

  const handleCompare = (imageAId: string, imageBId: string) => {
    alert(`正在对比图片 ${imageAId} 和 ${imageBId}`)
  }

  return (
    <div className="image-selection-page">
      <header style={{ padding: '2rem', background: '#f8f9fa', textAlign: 'center' }}>
        <h1>图片选择与对比功能</h1>
        <p>展示无障碍图片选择和对比组件</p>

        {/* 图片上传区域 */}
        <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <label
            htmlFor="image-upload"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-block',
            }}
          >
            📁 选择图片上传
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            aria-label="上传图片文件"
          />
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            已有 {images.length} 张图片
          </span>
        </div>

        <button
          onClick={() => navigate('/home')}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </header>

      <main id="main-content">
        {/* 图片画廊 */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ padding: '2rem 2rem 0', color: '#333' }}>图片画廊</h2>
          <ImageGallery images={images} onSelectImage={handleSelectImage} selectedImageId={selectedImageId} />
        </section>

        {/* 图片对比 */}
        {images.length >= 2 && (
          <section style={{ marginBottom: '3rem', background: '#f8f9fa', paddingTop: '2rem' }}>
            <h2 style={{ padding: '0 2rem 1rem', color: '#333' }}>图片对比</h2>
            <ImageComparison
              imageA={images[0]}
              imageB={images[1]}
              onCompare={handleCompare}
            />
          </section>
        )}
      </main>

      {selectedImageId && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: '#28a745',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span>已选择图片 ID: {selectedImageId}</span>
          <button
            onClick={handleCancelSelection}
            style={{
              background: 'white',
              color: '#28a745',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            aria-label="取消选择图片"
          >
            取消选择
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageSelection
