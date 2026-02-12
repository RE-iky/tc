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

function VideoList({ videos, onVideoRemove }: VideoListProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  const getFilteredVideos = () => {
    if (filter === 'all') return videos
    return videos.filter((v) => v.uploadedBy === filter)
  }

  const filteredVideos = getFilteredVideos()

  const getRoleLabel = (role: UserRole) => {
    return role === 'teacher' ? '教师' : '学生'
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
                  onClick={() => onVideoRemove(video.id)}
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
