import { useEffect, useId, useRef, useState } from "react"
import { BadgeCheck, Check, Compass, Moon, Route, Share2, Sun, X } from "lucide-react"

import type { Season, TimeOfDay } from "../store/atlasStore"
import "./overlay.css"

export type JournalLandmark = {
  id: string
  index: number
  title: string
  chineseName: string
  category: string
  categoryZh: string
  description: string
  descriptionZh: string
  artifact: string
  artifactZh: string
  artifactNote: string
  artifactNoteZh: string
  discovered: boolean
  discoveredAt?: string
  season?: Season
  timeOfDay?: TimeOfDay
}

export type JournalRouteStop = {
  id: string
  title: string
  chineseName: string
}

export type JournalRoute = {
  id: string
  title: string
  titleZh: string
  stops: readonly JournalRouteStop[]
  completed: boolean
  progressIndex?: number
  completedAt?: string
  season?: Season
  timeOfDay?: TimeOfDay
}

type JournalFilter = "all" | "sites" | "routes"

export interface DiscoveryJournalProps {
  isOpen: boolean
  language: "en" | "zh"
  landmarks: readonly JournalLandmark[]
  routes: readonly JournalRoute[]
  onClose: () => void
  onSelectLandmark: (id: string) => void
  onOpenRoutePostcard?: (id: string) => void
}

const SEASON_LABELS: Record<Season, { en: string; zh: string }> = {
  spring: { en: "Spring", zh: "春" },
  summer: { en: "Summer", zh: "夏" },
  autumn: { en: "Autumn", zh: "秋" },
  winter: { en: "Winter", zh: "冬" },
}

function formatMoment(date: string | undefined, language: "en" | "zh") {
  if (!date) return language === "en" ? "Earlier atlas entry" : "早期图鉴记录"
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return language === "en" ? "Earlier atlas entry" : "早期图鉴记录"
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(value)
}

function formatRouteMoment(route: JournalRoute, language: "en" | "zh") {
  if (!route.completedAt) return language === "en" ? "Open Processions to begin" : "打开游线开始行进"
  const season = route.season ? SEASON_LABELS[route.season][language] : language === "en" ? "Atlas" : "图鉴"
  const time = route.timeOfDay === "night" ? language === "en" ? "Night" : "夜" : language === "en" ? "Day" : "昼"
  return season + " · " + time + " · " + formatMoment(route.completedAt, language)
}

function MomentStamp({ landmark, language }: { landmark: JournalLandmark; language: "en" | "zh" }) {
  if (!landmark.discovered) return <span className="journal-site-card__stamp">{language === "en" ? "Still in the field" : "仍在现场"}</span>
  const season = landmark.season ? SEASON_LABELS[landmark.season][language] : language === "en" ? "Atlas" : "图鉴"
  const isNight = landmark.timeOfDay === "night"
  return (
    <span className="journal-site-card__stamp">
      {isNight ? <Moon size={11} strokeWidth={1.6} aria-hidden="true" /> : <Sun size={11} strokeWidth={1.6} aria-hidden="true" />}
      {season} · {isNight ? language === "en" ? "Night" : "夜" : language === "en" ? "Day" : "昼"} · {formatMoment(landmark.discoveredAt, language)}
    </span>
  )
}

export function DiscoveryJournal({ isOpen, language, landmarks, routes, onClose, onSelectLandmark, onOpenRoutePostcard }: DiscoveryJournalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [filter, setFilter] = useState<JournalFilter>("all")
  const isChinese = language === "zh"
  const discovered = landmarks.filter((landmark) => landmark.discovered)
  const completedRoutes = routes.filter((route) => route.completed)
  const latestDiscovery = [...discovered].sort((left, right) => (right.discoveredAt ?? "").localeCompare(left.discoveredAt ?? ""))[0]

  useEffect(() => {
    if (!isOpen) return undefined
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab") return
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null)
      if (!focusable.length) {
        event.preventDefault()
        return
      }
      const firstFocusable = focusable[0]
      const lastFocusable = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener("keydown", handleKeyDown)
      restoreFocusRef.current?.focus()
      restoreFocusRef.current = null
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const visibleLandmarks = filter === "sites" ? discovered : filter === "routes" ? [] : landmarks
  return (
    <div className="discovery-journal" role="presentation">
      <button className="discovery-journal__backdrop" type="button" aria-label={isChinese ? "关闭探索档案" : "Close field journal"} onClick={onClose} />
      <section ref={dialogRef} className="journal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="journal-dialog__header">
          <div>
            <span className="micro journal-dialog__eyebrow">{isChinese ? "档案 / 现场笔记" : "Archive / field journal"}</span>
            <h1 className="display-serif" id={titleId}>{isChinese ? "图鉴记住了什么。" : "What the atlas remembers."}</h1>
            <p>{isChinese ? "每一座被标记的建筑，都会留下一个季节、一个时刻与一枚独特的现场印记。" : "Every marked building keeps a season, a moment, and a unique field seal."}</p>
          </div>
          <button ref={closeButtonRef} className="icon-button icon-button--light" type="button" aria-label={isChinese ? "关闭探索档案" : "Close field journal"} onClick={onClose}>
            <X size={19} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="journal-dialog__body">
          <div className="journal-overview">
            <div className="journal-overview__stats">
              <div className="journal-stat journal-stat--primary">
                <span className="micro">{isChinese ? "现场印记" : "Field seals"}</span>
                <strong>{String(discovered.length).padStart(2, "0")}<small> / {String(landmarks.length).padStart(2, "0")}</small></strong>
                <span>{isChinese ? "地标已记录" : "landmarks recorded"}</span>
              </div>
              <div className="journal-stat">
                <span className="micro">{isChinese ? "游线徽章" : "Route badges"}</span>
                <strong>{String(completedRoutes.length).padStart(2, "0")}<small> / {String(routes.length).padStart(2, "0")}</small></strong>
                <span>{isChinese ? "游线已完成" : "processions completed"}</span>
              </div>
              <div className="journal-stat">
                <span className="micro">{isChinese ? "最近记录" : "Latest entry"}</span>
                <strong className="journal-stat__title">{latestDiscovery ? (isChinese ? latestDiscovery.chineseName : latestDiscovery.title) : "—"}</strong>
                <span>{latestDiscovery ? formatMoment(latestDiscovery.discoveredAt, language) : isChinese ? "等待第一次发现" : "Waiting for a first discovery"}</span>
              </div>
            </div>
            <div className="journal-overview__note">
              <Compass size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>{isChinese ? "探索会在此留下回声。" : "Exploration leaves an echo here."}</span>
            </div>
          </div>

          <nav className="journal-filter" aria-label={isChinese ? "档案筛选" : "Journal filters"}>
            {(["all", "sites", "routes"] as const).map((value) => {
              const label = value === "all" ? isChinese ? "全部" : "Everything" : value === "sites" ? isChinese ? "地标" : "Discoveries" : isChinese ? "游线" : "Processions"
              return <button key={value} className={filter === value ? "is-active" : ""} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            })}
            <span className="journal-filter__count">{String(discovered.length).padStart(2, "0")} {isChinese ? "已记录" : "recorded"}</span>
          </nav>

          {filter !== "routes" && (
            <section className="journal-section" aria-labelledby={`${titleId}-sites`}>
              <div className="journal-section__heading">
                <div>
                  <span className="micro">01 / {isChinese ? "地标簿" : "Landmark ledger"}</span>
                  <h2 className="display-serif" id={`${titleId}-sites`}>{isChinese ? "一座座建筑，一枚枚印记。" : "One building, one field seal."}</h2>
                </div>
                <span>{isChinese ? "点击记录，返回现场" : "Select an entry to return to the site"}</span>
              </div>
              <div className="journal-site-grid">
                {visibleLandmarks.map((landmark) => (
                  <button key={landmark.id} className={`journal-site-card${landmark.discovered ? " is-discovered" : " is-locked"}`} type="button" aria-label={(isChinese ? "查看 " : "Inspect ") + (isChinese ? landmark.chineseName : landmark.title)} onClick={() => onSelectLandmark(landmark.id)}>
                    <span className="journal-site-card__topline">
                      <span className="micro">{String(landmark.index).padStart(2, "0")} · {isChinese ? landmark.categoryZh : landmark.category}</span>
                      <span className="journal-seal" aria-hidden="true">{landmark.discovered ? <Check size={14} strokeWidth={1.8} /> : "·"}</span>
                    </span>
                    <span className="journal-site-card__names">
                      <span>{landmark.chineseName}</span>
                      <strong className="display-serif">{isChinese ? landmark.chineseName : landmark.title}</strong>
                    </span>
                    {landmark.discovered ? (
                      <span className="journal-site-card__artifact"><BadgeCheck size={13} strokeWidth={1.6} aria-hidden="true" /><span><small>{isChinese ? "现场印记" : "Field seal"}</small><strong>{isChinese ? landmark.artifactZh : landmark.artifact}</strong><em>{isChinese ? landmark.artifactNoteZh : landmark.artifactNote}</em></span></span>
                    ) : (
                      <span className="journal-site-card__locked"><span>{isChinese ? "尚未记录" : "Not yet recorded"}</span><small>{isChinese ? "回到地图寻找它" : "Return to the map to find it"}</small></span>
                    )}
                    <span className="journal-site-card__footer"><MomentStamp landmark={landmark} language={language} /><span aria-hidden="true">↗</span></span>
                  </button>
                ))}
              </div>
              {!visibleLandmarks.length && <p className="journal-empty">{isChinese ? "还没有地标印记。回到地图，点击一座建筑开始记录。" : "No field seals yet. Return to the map and mark a building to begin."}</p>}
            </section>
          )}

          {filter !== "sites" && (
            <section className="journal-section journal-routes" aria-labelledby={`${titleId}-routes`}>
              <div className="journal-section__heading">
                <div>
                  <span className="micro">02 / {isChinese ? "游线簿" : "Procession ledger"}</span>
                  <h2 className="display-serif" id={`${titleId}-routes`}>{isChinese ? "走过的路，也会留下徽章。" : "A route walked becomes a badge."}</h2>
                </div>
                <span>{isChinese ? "完成游线，保存一次完整行进" : "Complete a procession to save the full passage"}</span>
              </div>
              <div className="journal-route-grid">
                {routes.map((route, index) => {
                  const isInProgress = route.progressIndex !== undefined && !route.completed
                  return (
                    <article key={route.id} className={"journal-route-card" + (route.completed ? " is-completed" : isInProgress ? " is-in-progress" : "")}>
                      <div className="journal-route-card__topline"><span className="micro">{String(index + 1).padStart(2, "0")} · {route.stops.length} {isChinese ? "站" : "stops"}</span>{route.completed ? <BadgeCheck size={15} strokeWidth={1.6} aria-label={isChinese ? "已完成" : "Completed"} /> : <Route size={15} strokeWidth={1.5} aria-hidden="true" />}</div>
                      <h3 className="display-serif">{isChinese ? route.titleZh : route.title}</h3>
                      <div className="journal-route-card__stops">{route.stops.map((stop, stopIndex) => <span key={stop.id}>{String(stopIndex + 1).padStart(2, "0")} · {isChinese ? stop.chineseName : stop.title}</span>)}</div>
                      <div className="journal-route-card__footer">
                        {route.completed ? <><span>{isChinese ? "已完成" : "Completed"}</span><small>{formatRouteMoment(route, language)}</small></> : isInProgress ? <><span>{isChinese ? "进行中" : "In progress"}</span><small>{isChinese ? "第 " + ((route.progressIndex ?? 0) + 1) + " 站已保存 · 打开游线继续" : "Stop " + ((route.progressIndex ?? 0) + 1) + " saved · Open Processions to continue"}</small></> : <><span>{isChinese ? "可开始" : "Ready to walk"}</span><small>{isChinese ? "打开游线开始行进" : "Open Processions to begin"}</small></>}
                      </div>
                      {route.completed && onOpenRoutePostcard ? (
                        <button className="journal-route-card__postcard" type="button" onClick={() => onOpenRoutePostcard(route.id)}>
                          <Share2 size={13} strokeWidth={1.6} aria-hidden="true" />
                          <span>{isChinese ? "制作游线明信片" : "Make trail postcard"}</span>
                          <span aria-hidden="true">↗</span>
                        </button>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <footer className="journal-dialog__footer">
          <span>{isChinese ? "故宫图鉴 / 私人探索档案" : "Forbidden City Atlas / personal field archive"}</span>
          <span>{discovered.length === landmarks.length ? isChinese ? "全部地标已记录" : "All landmarks recorded" : isChinese ? "继续探索，下一枚印记正在地图上" : "Keep exploring; the next seal is waiting on the map"}</span>
        </footer>
      </section>
    </div>
  )
}
