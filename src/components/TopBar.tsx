import { useState } from "react"
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Languages,
  Menu,
} from "lucide-react"

import "./overlay.css"

export type AtlasNavItem = "atlas" | "method" | "archive"
export type AtlasLanguage = "EN" | "中"

export interface TopBarProps {
  activeItem?: AtlasNavItem
  onNavigate?: (item: AtlasNavItem) => void
  language?: AtlasLanguage
  onLanguageChange?: (language: AtlasLanguage) => void
  onProgressOpen?: () => void
  onMenuOpen?: () => void
  progressLabel?: string
  menuLabel?: string
}

const NAV_ITEMS: ReadonlyArray<{ id: AtlasNavItem; en: string; zh: string }> = [
  { id: "atlas", en: "The atlas", zh: "图鉴" },
  { id: "method", en: "Field method", zh: "考察方法" },
  { id: "archive", en: "Archive", zh: "档案" },
]

export function TopBar({
  activeItem = "atlas",
  onNavigate,
  language,
  onLanguageChange,
  onProgressOpen,
  onMenuOpen,
  progressLabel = "Progress",
  menuLabel = "Menu",
}: TopBarProps) {
  const [localLanguage, setLocalLanguage] = useState<AtlasLanguage>(language ?? "EN")
  const selectedLanguage = language ?? localLanguage
  const isChinese = selectedLanguage === "中"
  const localizedProgressLabel = isChinese ? progressLabel.replace(/^Progress/i, "进度") : progressLabel.replace(/^进度/i, "Progress")
  const localizedMenuLabel = isChinese ? '菜单' : menuLabel.replace(/^菜单/, 'Menu')

  function handleLanguageChange(nextLanguage: AtlasLanguage) {
    setLocalLanguage(nextLanguage)
    onLanguageChange?.(nextLanguage)
  }

  return (
    <header className="atlas-topbar">
      <div className="topbar-inner">
        <a
          className="atlas-brand"
          href="#atlas"
          aria-label={isChinese ? "返回故宫图鉴首页" : "Forbidden City Atlas home"}
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <span className="brand-name">{isChinese ? "故宫图鉴" : "Forbidden City"}</span>
            <span className="brand-subtitle">{isChinese ? "图录 / 北京 · 01" : "Atlas / Beijing · 01"}</span>
          </span>
        </a>

        <nav className="topbar-nav" aria-label={isChinese ? "主导航" : "Primary navigation"}>
          {NAV_ITEMS.map((item) => (
            <button
              className={"topbar-nav__item" + (activeItem === item.id ? " is-active" : "")}
              key={item.id}
              type="button"
              aria-current={activeItem === item.id ? "page" : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              {isChinese ? item.zh : item.en}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="language-switch" aria-label={isChinese ? "语言" : "Language"}>
            <Languages size={14} strokeWidth={1.6} aria-hidden="true" />
            <button
              className={selectedLanguage === "EN" ? "is-selected" : ""}
              type="button"
              aria-label={isChinese ? "使用英文" : "Use English"}
              aria-pressed={selectedLanguage === "EN"}
              onClick={() => handleLanguageChange("EN")}
            >
              EN
            </button>
            <span aria-hidden="true">/</span>
            <button
              className={selectedLanguage === "中" ? "is-selected" : ""}
              type="button"
              aria-label={isChinese ? "使用中文" : "Use Chinese"}
              aria-pressed={selectedLanguage === "中"}
              onClick={() => handleLanguageChange("中")}
            >
              中
            </button>
          </div>

          <button
            className="topbar-action topbar-action--progress"
            type="button"
            aria-label={(isChinese ? "打开 " : "Open ") + localizedProgressLabel.toLowerCase()}
            onClick={onProgressOpen}
          >
            <BarChart3 size={15} strokeWidth={1.7} aria-hidden="true" />
            <span>{localizedProgressLabel}</span>
            <ArrowUpRight size={13} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <button
            className="topbar-menu"
            type="button"
            aria-label={(isChinese ? "打开 " : "Open ") + localizedMenuLabel.toLowerCase()}
            onClick={onMenuOpen}
          >
            <span>{localizedMenuLabel}</span>
            <Menu size={17} strokeWidth={1.6} aria-hidden="true" />
            <ChevronDown className="topbar-menu__chevron" size={12} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}