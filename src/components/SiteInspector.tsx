import { useEffect, useId } from "react"
import { Check, MapPin, Sparkles, X } from "lucide-react"

import "./overlay.css"

export interface Landmark {
  id: string
  category: string
  name: string
  chineseName: string
  era: string
  description: string
  fact?: string
  coordinates?: string
  discovered?: boolean
  isDiscovered?: boolean
  index?: number | string
  categoryZh?: string
  eraZh?: string
  descriptionZh?: string
  factZh?: string
}

export type InspectorLanguage = "en" | "zh"

export interface SiteInspectorProps {
  landmark: Landmark | null
  isOpen?: boolean
  language?: InspectorLanguage
  onClose: () => void
  onDiscover?: (landmark: Landmark) => void
  isDiscovering?: boolean
}

export function SiteInspector({
  landmark,
  isOpen = true,
  language = "en",
  onClose,
  onDiscover,
  isDiscovering = false,
}: SiteInspectorProps) {
  const titleId = useId()
  const descriptionId = useId()
  const isChinese = language === "zh"

  useEffect(() => {
    if (!landmark || !isOpen) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, landmark, onClose])

  if (!landmark || !isOpen) return null

  const discovered = landmark.discovered ?? landmark.isDiscovered ?? false
  const marker = landmark.index ?? "01"
  const category = isChinese ? landmark.categoryZh ?? landmark.category : landmark.category
  const era = isChinese ? landmark.eraZh ?? landmark.era : landmark.era
  const name = isChinese ? landmark.chineseName : landmark.name
  const secondaryName = isChinese ? landmark.name : landmark.chineseName
  const description = isChinese ? landmark.descriptionZh ?? landmark.description : landmark.description
  const fact = isChinese ? landmark.factZh ?? landmark.fact : landmark.fact

  return (
    <aside
      className="site-inspector glass-panel"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={isChinese ? "已选地标" : "Selected landmark"}
    >
      <div className="site-inspector__topline">
        <span className="micro">{isChinese ? "地标记录 /" : "Site record /"} {String(marker).padStart(2, "0")}</span>
        <button
          className="icon-button"
          type="button"
          aria-label={isChinese ? "关闭详情并返回图鉴" : "Close details and return to atlas"}
          onClick={onClose}
        >
          <X size={17} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div className="site-inspector__mode" aria-label={isChinese ? "沉浸式现场视角" : "Immersive expedition view"}>
        <span className="site-inspector__mode-mark" aria-hidden="true" />
        <span className="micro">{isChinese ? "沉浸式现场" : "Expedition focus"}</span>
        <span>{isChinese ? "拖动旋转 · 滚轮推进" : "Drag to orbit · scroll to enter"}</span>
      </div>

      <div className="site-inspector__category">
        <span className="category-rule" aria-hidden="true" />
        <span className="micro">{category}</span>
        <span className="site-inspector__era">{era}</span>
      </div>

      <div className="site-inspector__heading">
        <span className="site-inspector__chinese display-serif" lang={isChinese ? "en" : "zh-Hans"}>
          {secondaryName}
        </span>
        <h2 className="display-serif" id={titleId}>
          {name}
        </h2>
      </div>

      <p className="site-inspector__description" id={descriptionId}>
        {description}
      </p>

      {fact ? (
        <div className="site-inspector__fact">
          <Sparkles size={15} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <span className="micro">{isChinese ? "探索笔记" : "Field note"}</span>
            <p>{fact}</p>
          </div>
        </div>
      ) : null}

      <div className="site-inspector__location">
        <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
        <span className="micro">{isChinese ? "内廷 / 中轴线" : landmark.coordinates ?? "Inner court / central axis"}</span>
      </div>

      <button
        className={"discover-button" + (discovered ? " is-discovered" : "")}
        type="button"
        aria-pressed={discovered}
        disabled={discovered || isDiscovering}
        onClick={() => onDiscover?.(landmark)}
      >
        {discovered ? <Check size={15} strokeWidth={1.8} aria-hidden="true" /> : null}
        <span>
          {isDiscovering
            ? isChinese ? "正在记录…" : "Recording site…"
            : discovered
              ? isChinese ? "地标已发现" : "Landmark discovered"
              : isChinese ? "标记为已发现" : "Mark as discovered"}
        </span>
        {!discovered && !isDiscovering ? <span aria-hidden="true">↗</span> : null}
      </button>
    </aside>
  )
}
