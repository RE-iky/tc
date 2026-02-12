import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAccessibilityStore } from '@/store/accessibility'
import { useAuthStore } from '@/store/auth'
import AccessibilityDemo from '@/components/AccessibilityDemo'
import SmartReader from '@/components/SmartReader'
import VideoImport from '@/components/VideoImport'
import VideoList from '@/components/VideoList'
import { extractPageContent } from '@/utils/contentExtractor'
import { VideoInfo } from '@/types'
import { videoApi } from '@/api/client'
import './Home.css'

// 初始示例视频数据
const initialVideos: VideoInfo[] = [
  {
    id: 'demo-1',
    title: 'AI人工智能入门教程',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=aircAruvnKk',
    embedUrl: 'https://www.youtube.com/embed/aircAruvnKk',
    duration: 600,
    hasSubtitles: true,
    subtitleUrl: 'https://youtubesubtitles.com/watch?v=aircAruvnKk',
    uploadedBy: 'teacher',
    uploaderId: 'teacher-1',
    uploadedAt: new Date().toISOString(),
    summary: '本视频介绍神经网络的基本概念，包括神经元、权重、偏置和激活函数。',
    fullDescription: `本视频是AI人工智能的入门教程，详细讲解了以下内容：

1. 什么是神经网络
   - 神经网络是受人脑启发的计算系统
   - 由大量神经元通过突触连接组成
   - 每个神经元接收输入，进行计算，输出结果

2. 神经网络的基本结构
   - 输入层：接收外部数据
   - 隐藏层：进行中间计算
   - 输出层：产生最终结果

3. 关键概念解释
   - 权重(Weight)：决定输入重要程度的参数
   - 偏置(Bias)：调整神经元激活阈值的参数
   - 激活函数(Activation Function)：决定神经元是否激活的函数

4. 实际应用场景
   - 图像识别
   - 自然语言处理
   - 语音识别

5. 学习建议
   - 推荐从简单例子开始
   - 多动手实践
   - 理解数学原理
     - 矩阵运算
     - 导数计算
     - 梯度下降
`,
    glossary: [
      { term: '神经网络', definition: '受人脑结构启发的机器学习模型，由多层神经元组成' },
      { term: '神经元', definition: '神经网络的基本计算单元，接收输入并产生输出' },
      { term: '权重', definition: '连接神经元的参数，决定输入的重要性' }
    ]
  },
  {
    id: 'demo-2',
    title: '机器学习基础概念',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
    embedUrl: 'https://www.youtube.com/embed/ukzFI9rgwfU',
    duration: 480,
    hasSubtitles: false,
    uploadedBy: 'teacher',
    uploaderId: 'teacher-1',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    summary: '介绍机器学习的三种主要类型：监督学习、无监督学习和强化学习。',
    fullDescription: `本视频详细讲解机器学习的基础概念，包括三大类型：

【监督学习】
- 用标记好的数据训练模型
- 分类问题：预测离散类别
- 回归问题：预测连续数值
- 示例：房价预测、图片分类

【无监督学习】
- 使用无标记数据发现模式
- 聚类：将相似数据分组
- 降维：减少特征数量
- 示例：客户分群、异常检测

【强化学习】
- 通过与环境交互学习
- 奖励机制指导学习方向
- 适用于序列决策问题
- 示例：游戏AI、机器人控制

【学习路径建议】
1. 先掌握监督学习基础
2. 理解特征工程重要性
3. 逐步学习无监督学习
4. 最后尝试强化学习
`
  }
]

function Home() {
  const navigate = useNavigate()
  const { preferences } = useAccessibilityStore()
  const { user, logout } = useAuthStore()
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [pageContent, setPageContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // 从服务器获取视频列表
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await videoApi.getList()
        const data = response.data

        if (data && data.length > 0) {
          setVideos(data as VideoInfo[])
        } else {
          setVideos(initialVideos)
          for (const video of initialVideos) {
            await videoApi.create(video)
          }
        }
      } catch (error) {
        console.error('获取视频列表失败:', error)
        setVideos(initialVideos)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // 添加视频到服务器
  const handleVideoAdd = async (video: VideoInfo) => {
    try {
      const response = await videoApi.create(video)

      if (response.success && response.data) {
        setVideos(prev => [...prev, response.data as VideoInfo])
      } else {
        setVideos(prev => [...prev, video])
      }
    } catch (error) {
      console.error('保存视频失败:', error)
      setVideos(prev => [...prev, video])
    }
  }

  // 从服务器删除视频
  const handleVideoRemove = async (videoId: string) => {
    try {
      await videoApi.delete(videoId)
    } catch (error) {
      console.error('删除视频失败:', error)
    } finally {
      setVideos(prev => prev.filter(v => v.id !== videoId))
    }
  }

  // 处理登出
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 提取页面内容用于朗读
  useEffect(() => {
    const timer = setTimeout(() => {
      const content = extractPageContent('#main-content')
      setPageContent(content)
    }, 500)

    return () => clearTimeout(timer)
  }, [preferences])

  const getWelcomeMessage = () => {
    switch (preferences.accessibilityType) {
      case 'visual':
        return '欢迎回来，视障优化模式已启用'
      case 'hearing':
        return '欢迎回来，听障优化模式已启用'
      case 'other':
        return '欢迎回来，无障碍优化模式已启用'
      default:
        return '欢迎使用 AI 教学平台'
    }
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="home-page">
      <a href="#main-content" className="skip-link">
        跳转到主要内容
      </a>

      {/* Hero Section */}
      <section className="hero-section" role="banner">
        <div className="hero-content">
          <span className="hero-badge">
            <span className="welcome-badge-dot"></span>
            人工智能驱动的无障碍学习体验
          </span>
          <h1 className="hero-title">
            {getWelcomeMessage()}
          </h1>
          <p className="hero-subtitle">
            为视障和听障学习者提供可访问的人工智能教学内容，
            让每个人都能平等地获取知识。
          </p>
          <div className="hero-cta">
            <Link to="/accessibility-selection" className="btn btn-primary btn-large">
              个性化设置
            </Link>
            <Link to="/assignments" className="btn btn-secondary btn-large">
              浏览课程
            </Link>
          </div>
        </div>
      </section>

      {/* Header */}
      <header className="home-header">
        <div className="header-inner">
          <Link to="/" className="header-logo">
            <span className="header-logo-icon">智</span>
            <span>人工智能教学平台</span>
          </Link>

          <nav className="header-nav" aria-label="主导航">
            <Link to="/assignments" className="header-nav-link">
              课程
            </Link>
            <Link to="/image-selection" className="header-nav-link">
              图片对比
            </Link>
            <Link to="/accessibility-selection" className="header-nav-link">
              无障碍设置
            </Link>
          </nav>

          <div className="header-user">
            <div className="user-avatar">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <span className="user-name">{user?.name || '用户'}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="home-main" role="main">
        {/* Welcome Card */}
        <section className="welcome-card animate-fade-in-up" aria-labelledby="welcome-heading">
          <div className="welcome-header">
            <div>
              <h2 id="welcome-heading" className="welcome-title">
                您好，{user?.name || '用户'}
              </h2>
              <p className="welcome-subtitle">
                您的个性化学习空间已准备就绪
              </p>
            </div>
            <div className="welcome-badge">
              <span className="welcome-badge-dot"></span>
              系统正常
            </div>
          </div>

          <div className="preferences-grid" role="list" aria-label="当前设置">
            <div className="preference-item" role="listitem">
              <div className="preference-icon">
                <span aria-hidden="true">👁</span>
              </div>
              <div className="preference-info">
                <p className="preference-label">无障碍模式</p>
                <p className="preference-value">
                  {preferences.accessibilityType === 'visual' ? '视障优化' :
                   preferences.accessibilityType === 'hearing' ? '听障优化' :
                   preferences.accessibilityType === 'other' ? '其他优化' : '标准模式'}
                </p>
              </div>
            </div>
            <div className="preference-item" role="listitem">
              <div className="preference-icon">
                <span aria-hidden="true">◐</span>
              </div>
              <div className="preference-info">
                <p className="preference-label">主题</p>
                <p className="preference-value">{preferences.themeMode}</p>
              </div>
            </div>
            <div className="preference-item" role="listitem">
              <div className="preference-icon">
                <span aria-hidden="true">A</span>
              </div>
              <div className="preference-info">
                <p className="preference-label">字体大小</p>
                <p className="preference-value">{preferences.fontSize}</p>
              </div>
            </div>
            <div className="preference-item" role="listitem">
              <div className="preference-icon">
                <span aria-hidden="true">◑</span>
              </div>
              <div className="preference-info">
                <p className="preference-label">高对比度</p>
                <p className="preference-value">{preferences.highContrast ? '已启用' : '未启用'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <div className="stats-bar animate-fade-in-up stagger-1">
          <div className="stat-item">
            <div className="stat-value">{videos.length}</div>
            <div className="stat-label">课程视频</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{videos.filter(v => v.hasSubtitles).length}</div>
            <div className="stat-label">含字幕</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{videos.reduce((acc, v) => acc + (v.glossary?.length || 0), 0)}</div>
            <div className="stat-label">术语词条</div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="section-header animate-fade-in-up stagger-2">
          <div>
            <h2 className="section-title">快速开始</h2>
            <p className="section-subtitle">选择您想要进行的操作</p>
          </div>
        </section>

        <div className="quick-actions animate-fade-in-up stagger-3" role="list">
          <Link to="/assignments" className="action-card" role="listitem">
            <div className="action-icon">
              <span aria-hidden="true">📚</span>
            </div>
            <div className="action-content">
              <h3 className="action-title">浏览课程</h3>
              <p className="action-description">探索人工智能相关课程内容</p>
            </div>
            <span className="action-arrow" aria-hidden="true">›</span>
          </Link>

          <Link to="/image-selection" className="action-card" role="listitem">
            <div className="action-icon">
              <span aria-hidden="true">🖼</span>
            </div>
            <div className="action-content">
              <h3 className="action-title">图片对比</h3>
              <p className="action-description">AI 生成图片的文字描述对比</p>
            </div>
            <span className="action-arrow" aria-hidden="true">›</span>
          </Link>

          <Link to="/accessibility-selection" className="action-card" role="listitem">
            <div className="action-icon">
              <span aria-hidden="true">⚙</span>
            </div>
            <div className="action-content">
              <h3 className="action-title">无障碍设置</h3>
              <p className="action-description">自定义您的学习体验</p>
            </div>
            <span className="action-arrow" aria-hidden="true">›</span>
          </Link>
        </div>

        {/* Features Grid */}
        <section className="section-header animate-fade-in-up stagger-4">
          <div>
            <h2 className="section-title">平台功能</h2>
            <p className="section-subtitle">为无障碍学习而设计</p>
          </div>
        </section>

        <div className="features-grid" role="list">
          <article className="feature-card" role="listitem">
            <div className="feature-icon">
              <span aria-hidden="true">📝</span>
            </div>
            <h3 className="feature-title">智能字幕</h3>
            <p className="feature-description">
              自动生成视频字幕，支持多种语言，并为听障用户优化显示效果。
            </p>
            <Link to="/accessibility-selection" className="feature-link">
              了解更多 <span aria-hidden="true">›</span>
            </Link>
          </article>

          <article className="feature-card" role="listitem">
            <div className="feature-icon">
              <span aria-hidden="true">🔊</span>
            </div>
            <h3 className="feature-title">语音朗读</h3>
            <p className="feature-description">
              将文字内容转换为自然语音，支持语速和音调调节。
            </p>
            <Link to="/accessibility-selection" className="feature-link">
              了解更多 <span aria-hidden="true">›</span>
            </Link>
          </article>

          <article className="feature-card" role="listitem">
            <div className="feature-icon">
              <span aria-hidden="true">🖼</span>
            </div>
            <h3 className="feature-title">图像描述</h3>
            <p className="feature-description">
              AI 自动识别图片内容，为视障用户提供详细的文字描述。
            </p>
            <Link to="/image-selection" className="feature-link">
              立即体验 <span aria-hidden="true">›</span>
            </Link>
          </article>

          <article className="feature-card" role="listitem">
            <div className="feature-icon">
              <span aria-hidden="true">📖</span>
            </div>
            <h3 className="feature-title">术语解释</h3>
            <p className="feature-description">
              自动提取课程中的专业术语，提供通俗易懂的解释。
            </p>
            <Link to="/assignments" className="feature-link">
              浏览术语 <span aria-hidden="true">›</span>
            </Link>
          </article>
        </div>

        {/* Video Management */}
        <section className="video-section animate-fade-in-up stagger-4" aria-labelledby="video-heading">
          <div className="video-section-header">
            <div>
              <h2 id="video-heading" className="section-title">课程视频</h2>
              <p className="section-subtitle">
                {isLoading ? '加载中...' : `${videos.length} 个课程视频`}
              </p>
            </div>
          </div>

          <VideoImport onVideoAdd={handleVideoAdd} />
          <VideoList videos={videos} onVideoRemove={handleVideoRemove} />
        </section>

        {/* Accessibility Demo */}
        <AccessibilityDemo />
      </main>

      {/* Smart Reader */}
      <SmartReader content={pageContent} />
    </div>
  )
}

export default Home
