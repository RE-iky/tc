import { useState, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccessibilityStore } from '@/store/accessibility'
import type { AccessibilityType } from '@/types'
import './AccessibilitySelection.css'

type SelectionType = AccessibilityType

interface AccessibilityOption {
  type: SelectionType
  label: string
  description: string
  icon: string
}

const options: AccessibilityOption[] = [
  {
    type: 'visual',
    label: '视觉障碍',
    description: '全盲或低视力用户，将启用读屏优化、高对比度和大字体',
    icon: '👁️',
  },
  {
    type: 'hearing',
    label: '听觉障碍',
    description: '全聋或听力障碍用户，将启用字幕、文字版内容和视觉提示',
    icon: '👂',
  },
  {
    type: 'other',
    label: '其他障碍类型',
    description: '肢体障碍、认知障碍等，将提供简化操作和清晰导航',
    icon: '♿',
  },
  {
    type: 'none',
    label: '无障碍需求',
    description: '使用标准界面，仍保留基础无障碍支持',
    icon: '✓',
  },
]

function AccessibilitySelection() {
  const navigate = useNavigate()
  const { setAccessibilityType } = useAccessibilityStore()
  const [selectedType, setSelectedType] = useState<SelectionType | null>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  const handleSelect = (type: SelectionType) => {
    setSelectedType(type)
  }

  const handleConfirm = () => {
    if (selectedType) {
      // 仅保存无障碍偏好，角色入口在登录后按用户角色分流
      setAccessibilityType(selectedType)
      navigate('/home')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, type: SelectionType, index: number) => {
    const totalOptions = options.length
    let nextIndex = index

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = (index + 1) % totalOptions
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = (index - 1 + totalOptions) % totalOptions
        break
      case ' ':
      case 'Enter':
        e.preventDefault()
        handleSelect(type)
        return
      default:
        return
    }

    // 聚焦到下一个选项
    const buttons = optionsRef.current?.querySelectorAll('button')
    if (buttons && buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLButtonElement).focus()
    }
  }

  return (
    <main id="main-content" className="accessibility-selection-page" role="main">
      <div className="selection-container">
        <header>
          <h1 id="page-title">选择您的无障碍偏好</h1>
          <p className="subtitle" id="page-description">
            我们将根据您的选择自动适配界面，提供最佳的学习体验
          </p>
        </header>

        <section aria-labelledby="page-title" aria-describedby="page-description">
          <div
            ref={optionsRef}
            className="options-grid"
            role="radiogroup"
            aria-labelledby="page-title"
            aria-required="true"
          >
            {options.map((option, index) => (
              <button
                key={option.type}
                className={`option-card ${
                  selectedType === option.type ? 'selected' : ''
                }`}
                onClick={() => handleSelect(option.type)}
                onKeyDown={(e) => handleKeyDown(e, option.type, index)}
                role="radio"
                aria-checked={selectedType === option.type}
                aria-labelledby={`option-label-${option.type}`}
                aria-describedby={`option-desc-${option.type}`}
                tabIndex={selectedType === option.type || (selectedType === null && index === 0) ? 0 : -1}
              >
                <span className="option-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <h2 id={`option-label-${option.type}`} className="option-label">
                  {option.label}
                </h2>
                <p id={`option-desc-${option.type}`} className="option-description">
                  {option.description}
                </p>
              </button>
            ))}
          </div>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {selectedType && `已选择 ${options.find((o) => o.type === selectedType)?.label}`}
          </div>

          <button
            className="btn-primary btn-confirm"
            onClick={handleConfirm}
            disabled={!selectedType}
            aria-label={
              selectedType
                ? `确认选择 ${options.find((o) => o.type === selectedType)?.label}`
                : '请先选择一个选项'
            }
            aria-disabled={!selectedType}
          >
            确认并继续
          </button>

          <p className="help-text" id="help-text">
            您可以随时在设置中更改这些偏好
          </p>
        </section>
      </div>
    </main>
  )
}

export default AccessibilitySelection
