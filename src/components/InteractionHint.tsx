import { useId, useState } from 'react'
import { ChevronDown, ChevronUp, MousePointer2, Rotate3D, ZoomIn } from 'lucide-react'

import './overlay.css'

export interface InteractionHintProps {
  defaultExpanded?: boolean
  onToggle?: (expanded: boolean) => void
  label?: string
  language?: 'en' | 'zh'
}

export function InteractionHint({
  defaultExpanded = true,
  onToggle,
  label = 'Navigate the field',
  language = 'en',
}: InteractionHintProps) {
  const instructionsId = useId()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const isChinese = language === 'zh'

  function toggle() {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    onToggle?.(nextExpanded)
  }

  return (
    <aside className={`interaction-hint${expanded ? ' is-expanded' : ' is-collapsed'}`} aria-label={isChinese ? '图鉴操作提示' : 'Atlas interaction hints'}>
      <button
        className="interaction-hint__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={instructionsId}
        onClick={toggle}
      >
        <span className="interaction-hint__signal" aria-hidden="true" />
        <span className="micro">{label}</span>
        {expanded ? <ChevronDown size={13} strokeWidth={1.6} aria-hidden="true" /> : <ChevronUp size={13} strokeWidth={1.6} aria-hidden="true" />}
      </button>

      <div className="interaction-hint__body" id={instructionsId} hidden={!expanded}>
        <div className="interaction-hint__row">
          <span className="interaction-hint__icon"><MousePointer2 size={14} strokeWidth={1.5} aria-hidden="true" /></span>
          <span><strong>{isChinese ? '拖动' : 'Drag'}</strong><small>{isChinese ? '旋转图鉴' : 'rotate the atlas'}</small></span>
          <kbd>↔</kbd>
        </div>
        <div className="interaction-hint__row">
          <span className="interaction-hint__icon"><Rotate3D size={14} strokeWidth={1.5} aria-hidden="true" /></span>
          <span><strong>{isChinese ? 'Shift + 拖动' : 'Shift + drag'}</strong><small>{isChinese ? '平移宫苑' : 'pan across the grounds'}</small></span>
          <kbd>⇧</kbd>
        </div>
        <div className="interaction-hint__row">
          <span className="interaction-hint__icon"><ZoomIn size={14} strokeWidth={1.5} aria-hidden="true" /></span>
          <span><strong>{isChinese ? '滚动' : 'Scroll'}</strong><small>{isChinese ? '缩放至门槛' : 'zoom into a threshold'}</small></span>
          <kbd>＋−</kbd>
        </div>
      </div>
    </aside>
  )
}
