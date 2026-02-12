import { useAccessibilityStore } from '@/store/accessibility'
import './AccessibilityDemo.css'

interface AccessibilityFeature {
  name: string
  status: 'enabled' | 'disabled'
  description: string
  icon: string
}

function AccessibilityDemo() {
  const { preferences } = useAccessibilityStore()

  const features: AccessibilityFeature[] = [
    {
      name: 'ARIA标签',
      status: 'enabled',
      description: '所有交互元素都有完整的ARIA标签，支持读屏软件',
      icon: '🏷️',
    },
    {
      name: '语义化HTML',
      status: 'enabled',
      description: '使用header、nav、main、section等语义化标签',
      icon: '📝',
    },
    {
      name: '键盘导航',
      status: 'enabled',
      description: 'Tab键切换焦点，方向键导航选项，Enter/Space选择',
      icon: '⌨️',
    },
    {
      name: '焦点管理',
      status: 'enabled',
      description: '清晰的焦点顺序和视觉提示',
      icon: '🎯',
    },
    {
      name: '实时反馈',
      status: 'enabled',
      description: 'aria-live区域提供即时状态更新',
      icon: '📢',
    },
    {
      name: '高对比度',
      status: preferences.highContrast ? 'enabled' : 'disabled',
      description: '增强文字与背景的对比度',
      icon: '🌓',
    },
  ]

  return (
    <section
      className="accessibility-demo"
      aria-labelledby="demo-heading"
    >
      <h2 id="demo-heading">无障碍功能状态</h2>
      <p className="demo-description">
        当前页面已启用以下无障碍功能，确保所有用户都能顺畅使用
      </p>

      <div className="features-list" role="list">
        {features.map((feature) => (
          <div
            key={feature.name}
            className={`feature-item ${feature.status}`}
            role="listitem"
          >
            <span className="feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <div className="feature-content">
              <h3 className="feature-name">
                {feature.name}
                <span
                  className={`status-badge ${feature.status}`}
                  aria-label={feature.status === 'enabled' ? '已启用' : '未启用'}
                >
                  {feature.status === 'enabled' ? '✓' : '✗'}
                </span>
              </h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="keyboard-shortcuts">
        <h3>键盘快捷键</h3>
        <dl>
          <dt><kbd>Tab</kbd></dt>
          <dd>切换到下一个可交互元素</dd>

          <dt><kbd>Shift</kbd> + <kbd>Tab</kbd></dt>
          <dd>切换到上一个可交互元素</dd>

          <dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt>
          <dd>激活按钮或选择选项</dd>

          <dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></dt>
          <dd>在选项组中导航</dd>

          <dt><kbd>Esc</kbd></dt>
          <dd>关闭对话框或取消操作</dd>
        </dl>
      </div>
    </section>
  )
}

export default AccessibilityDemo
