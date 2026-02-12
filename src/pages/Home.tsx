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

// 初始示例视频数据（仅在服务器无数据时使用）
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

  // 从服务器获取视频列表
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await videoApi.getList()
        const data = response.data

        if (data && data.length > 0) {
          // 使用服务器数据
          setVideos(data as VideoInfo[])
        } else {
          // 服务器没有数据，使用示例数据并同步到服务器
          setVideos(initialVideos)

          // 同步示例数据到服务器
          for (const video of initialVideos) {
            await videoApi.create(video)
          }
        }
      } catch (error) {
        console.error('获取视频列表失败:', error)
        // 如果服务器不可用，使用本地示例数据
        setVideos(initialVideos)
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
        // 如果服务器失败，仍添加到本地状态
        setVideos(prev => [...prev, video])
      }
    } catch (error) {
      console.error('保存视频失败:', error)
      // 如果服务器不可用，仍添加到本地状态
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
        return '欢迎使用视障优化模式'
      case 'hearing':
        return '欢迎使用听障优化模式'
      case 'other':
        return '欢迎使用无障碍优化模式'
      default:
        return '欢迎使用AI教学平台'
    }
  }

  return (
    <div className="home-page">
      <header className="home-header" role="banner">
        <h1 id="site-title">无障碍AI教学平台</h1>
        <div className="header-content">
          <nav aria-label="主导航" role="navigation">
            <ul role="list">
              <li><a href="#courses" aria-label="跳转到课程区域">课程</a></li>
              <li><Link to="/assignments" aria-label="跳转到作业页面">作业</Link></li>
              <li><Link to="/image-selection" aria-label="跳转到图片选择页面">图片选择</Link></li>
              <li><Link to="/accessibility-selection" aria-label="无障碍设置">设置</Link></li>
            </ul>
          </nav>
          <div className="user-section">
            <span className="user-name" aria-label={`当前用户：${user?.name}`}>
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn-logout"
              aria-label="退出登录"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="home-main" role="main">
        <section
          className="welcome-section"
          aria-labelledby="welcome-heading"
          aria-describedby="user-preferences"
        >
          <h2 id="welcome-heading">{getWelcomeMessage()}</h2>
          <div id="user-preferences" className="preferences-info">
            <dl>
              <dt>当前模式：</dt>
              <dd>{preferences.themeMode}</dd>
              <dt>字体大小：</dt>
              <dd>{preferences.fontSize}</dd>
              <dt>高对比度：</dt>
              <dd>{preferences.highContrast ? '已启用' : '未启用'}</dd>
            </dl>
          </div>
        </section>

        <section
          id="courses"
          className="features-section"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading">平台功能</h2>
          <div className="features-grid" role="list">
            <article className="feature-card" role="listitem">
              <h3>
                <span aria-hidden="true">📚 </span>
                AI课程
              </h3>
              <p>提供视频和文字双版本的AI教学内容</p>
            </article>
            <article className="feature-card" role="listitem">
              <h3>
                <span aria-hidden="true">📝 </span>
                作业系统
              </h3>
              <p>简单易用的作业提交和反馈功能</p>
              <Link to="/assignments" className="feature-link" aria-label="进入作业管理">
                进入作业管理 →
              </Link>
            </article>
            <article className="feature-card" role="listitem">
              <h3>
                <span aria-hidden="true">♿ </span>
                无障碍支持
              </h3>
              <p>完整的读屏、字幕和键盘导航支持</p>
            </article>
          </div>
        </section>

        {/* 视频管理区域 */}
        <section
          id="video-management"
          className="video-management-section"
          aria-labelledby="video-management-heading"
        >
          <h2 id="video-management-heading">课程视频管理</h2>
          <VideoImport onVideoAdd={handleVideoAdd} />
          <VideoList videos={videos} onVideoRemove={handleVideoRemove} />
        </section>

        {/* 无障碍功能演示 */}
        <AccessibilityDemo />
      </main>

      {/* 智能朗读控制 */}
      <SmartReader content={pageContent} />
    </div>
  )
}

export default Home
