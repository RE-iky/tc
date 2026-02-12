import { useState } from 'react'
import { VideoInfo, UserRole } from '@/types'
import { getPlatformName } from '@/utils/videoParser'
import VideoPlayer from './VideoPlayer'
import './VideoList.css'

interface VideoListProps {
  videos: VideoInfo[]
  onVideoRemove: (videoId: string) => void
}

type FilterType = 'all' | 'teacher' | 'student'

interface DeleteConfirmState {
  show: boolean
  video: VideoInfo | null
}

function VideoList({ videos, onVideoRemove }: VideoListProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ show: false, video: null })
  const [isDeleting, setIsDeleting] = useState(false)

  const getFilteredVideos = () => {
    if (filter === 'all') return videos
    return videos.filter((v) => v.uploadedBy === filter)
  }

  const filteredVideos = getFilteredVideos()

  const getRoleLabel = (role: UserRole) => {
    return role === 'teacher' ? '教师' : '学生'
  }

  // 显示删除确认对话框
  const showDeleteConfirm = (e: React.MouseEvent, video: VideoInfo) => {
    e.stopPropagation()
    setDeleteConfirm({ show: true, video })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteConfirm.video) return

    setIsDeleting(true)
    try {
      await onVideoRemove(deleteConfirm.video.id)
      setDeleteConfirm({ show: false, video: null })
    } finally {
      setIsDeleting(false)
    }
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, video: null })
  }

  if (videos.length === 0) {
    return (
      <section className="video-list-empty" aria-label="视频列表">
        <p>暂无视频，请先导入视频</p>
      </section>
    )
  }

  return (
    <section className="video-list" aria-labelledby="video-list-heading">
      <h3 id="video-list-heading">课程视频列表</h3>

      <div className="filter-section" role="group" aria-label="视频筛选">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          全部
        </button>
        <button
          className={`filter-btn ${filter === 'teacher' ? 'active' : ''}`}
          onClick={() => setFilter('teacher')}
          aria-pressed={filter === 'teacher'}
        >
          教师视频
        </button>
        <button
          className={`filter-btn ${filter === 'student' ? 'active' : ''}`}
          onClick={() => setFilter('student')}
          aria-pressed={filter === 'student'}
        >
          学生视频
        </button>
      </div>

      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm.show && deleteConfirm.video && (
        <div
          className="delete-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelDelete()
          }}
        >
          <div className="delete-confirm-dialog">
            <h4 id="delete-title">确认删除</h4>
            <p>确定要删除视频 <strong>{deleteConfirm.video.title}</strong> 吗？</p>
            {deleteConfirm.video.isLocal && (
              <p className="delete-warning">注意：此操作将同时删除本地视频文件，且无法恢复。</p>
            )}
            <div className="delete-confirm-actions">
              <button
                className="btn-cancel"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                className="btn-confirm-delete"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <p className="no-results">没有符合条件的视频</p>
      ) : (
        <ul className="video-items" role="list">
          {filteredVideos.map((video) => (
            <li
              key={video.id}
              className={`video-item ${video.uploadedBy === 'teacher' ? 'teacher-video' : ''}`}
              role="listitem"
            >
              <div className="video-info">
                <h4 className="video-title">{video.title}</h4>
                <div className="video-meta">
                  <span className="video-platform">
                    平台: {getPlatformName(video.platform)}
                  </span>
                  <span
                    className={`uploader-badge ${video.uploadedBy === 'teacher' ? 'teacher' : 'student'}`}
                    aria-label={`上传者: ${getRoleLabel(video.uploadedBy)}`}
                  >
                    {video.uploadedBy === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {getRoleLabel(video.uploadedBy)}
                  </span>
                  {video.hasSubtitles && (
                    <span className="video-badge" aria-label="包含字幕">
                      📝 字幕
                    </span>
                  )}
                  {video.isLocal && (
                    <span className="video-badge local" aria-label="本地视频">
                      💾 本地
                    </span>
                  )}
                </div>
              </div>

              <div className="video-actions">
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="play-button"
                  aria-label={`播放视频: ${video.title}`}
                >
                  播放
                </button>
                <button
                  onClick={(e) => showDeleteConfirm(e, video)}
                  className="remove-button"
                  aria-label={`删除视频: ${video.title}`}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default VideoList
