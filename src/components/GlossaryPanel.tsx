import { useState } from 'react'
import type { GlossaryTerm } from '@/types'
import './GlossaryPanel.css'

interface GlossaryPanelProps {
  terms: GlossaryTerm[]
}

function GlossaryPanel({ terms }: GlossaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null)

  if (!terms || terms.length === 0) {
    return null
  }

  const handleTermClick = (term: GlossaryTerm) => {
    setSelectedTerm(term)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedTerm(null)
  }

  return (
    <>
      <div className="glossary-panel" role="complementary" aria-label="术语解释">
        <h4 className="glossary-title">AI术语解释</h4>
        <ul className="glossary-list" role="list">
          {terms.map((term, index) => (
            <li key={index} role="listitem">
              <button
                onClick={() => handleTermClick(term)}
                className="glossary-term-button"
                aria-label={`查看术语"${term.term}"的解释`}
              >
                {term.term}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {isOpen && selectedTerm && (
        <div
          className="glossary-modal"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <div className="modal-overlay" onClick={handleClose} />
          <div className="modal-content">
            <header className="modal-header">
              <h3 id="modal-title" className="modal-term">
                {selectedTerm.term}
              </h3>
              <button
                onClick={handleClose}
                className="modal-close"
                aria-label="关闭术语解释"
              >
                ×
              </button>
            </header>
            <div className="modal-body">
              <p className="term-definition">{selectedTerm.definition}</p>
              {selectedTerm.context && (
                <div className="term-context">
                  <strong>使用场景：</strong>
                  <p>{selectedTerm.context}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GlossaryPanel
