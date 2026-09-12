import { useEffect, useId, useRef, useState, type RefObject } from "react"
import { Check, Copy, Download, Link2, Route, Share2, Sparkles, X } from "lucide-react"

import type { Season, TimeOfDay } from "../store/atlasStore"
import "./overlay.css"

export type PostcardRequest = {
  kind: "landmark" | "route"
  id: string
  season: Season
  timeOfDay: TimeOfDay
}

export type FieldPostcardLandmark = PostcardRequest & {
  kind: "landmark"
  title: string
  chineseName: string
  category: string
  categoryZh: string
  era: string
  eraZh: string
  description: string
  descriptionZh: string
  artifact: string
  artifactZh: string
  artifactNote: string
  artifactNoteZh: string
  discoveredAt?: string
}

export type FieldPostcardRoute = PostcardRequest & {
  kind: "route"
  title: string
  titleZh: string
  trail: string
  trailZh: string
  description: string
  descriptionZh: string
  reward: string
  rewardZh: string
  stops: readonly { id: string; title: string; chineseName: string }[]
  completedAt?: string
}

export type FieldPostcardTarget = FieldPostcardLandmark | FieldPostcardRoute

export interface FieldPostcardProps {
  isOpen: boolean
  target: FieldPostcardTarget | null
  language: "en" | "zh"
  shareUrl?: string
  onClose: () => void
}

const SEASON_LABELS: Record<Season, { en: string; zh: string }> = {
  spring: { en: "Spring", zh: "春" },
  summer: { en: "Summer", zh: "夏" },
  autumn: { en: "Autumn", zh: "秋" },
  winter: { en: "Winter", zh: "冬" },
}

const PALETTES: Record<Season, {
  sky: string
  skyDeep: string
  ground: string
  groundDeep: string
  roof: string
  roofShadow: string
  leaf: string
  accent: string
  particle: string
}> = {
  spring: { sky: "#273b34", skyDeep: "#0c1715", ground: "#2f6956", groundDeep: "#122e28", roof: "#3e806c", roofShadow: "#1c4c42", leaf: "#9dc889", accent: "#efc878", particle: "#d9e7bd" },
  summer: { sky: "#21453b", skyDeep: "#0b1715", ground: "#28614f", groundDeep: "#102f28", roof: "#387967", roofShadow: "#16483d", leaf: "#75a57b", accent: "#efbf65", particle: "#f0d69c" },
  autumn: { sky: "#51382c", skyDeep: "#1b1714", ground: "#6f5740", groundDeep: "#2b2520", roof: "#47695d", roofShadow: "#263f38", leaf: "#c87845", accent: "#f0b15b", particle: "#e3a464" },
  winter: { sky: "#536c6c", skyDeep: "#172627", ground: "#aebfba", groundDeep: "#526e6b", roof: "#436d69", roofShadow: "#244946", leaf: "#8da9a0", accent: "#f5d998", particle: "#f3f4e6" },
}

const PARTICLES = [
  [112, 106, 2.4], [177, 170, 1.8], [252, 91, 2.1], [326, 142, 1.4], [493, 91, 2.2],
  [583, 148, 1.7], [679, 96, 2.4], [715, 196, 1.4], [95, 278, 1.6], [688, 307, 2.1],
] as const

function formatMoment(date: string | undefined, language: "en" | "zh") {
  if (!date) return language === "en" ? "Atlas moment" : "图鉴时刻"
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return language === "en" ? "Atlas moment" : "图鉴时刻"
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(value)
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function createSeed(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0)
}

export function parsePostcardRequest(search = typeof window === "undefined" ? "" : window.location.search): PostcardRequest | null {
  const params = new URLSearchParams(search)
  const kind = params.get("postcard")
  const id = params.get("id")
  const season = params.get("season")
  const timeOfDay = params.get("time")
  if ((kind !== "landmark" && kind !== "route") || !id) return null
  if (season !== "spring" && season !== "summer" && season !== "autumn" && season !== "winter") return null
  if (timeOfDay !== "day" && timeOfDay !== "night") return null
  return { kind, id, season, timeOfDay }
}

export function createPostcardUrl(request: PostcardRequest, baseUrl = typeof window === "undefined" ? "http://localhost/" : window.location.href) {
  const url = new URL(baseUrl)
  url.searchParams.set("postcard", request.kind)
  url.searchParams.set("id", request.id)
  url.searchParams.set("season", request.season)
  url.searchParams.set("time", request.timeOfDay)
  return url.toString()
}

function PostcardArt({ target, language, artRef }: { target: FieldPostcardTarget; language: "en" | "zh"; artRef: RefObject<SVGSVGElement | null> }) {
  const palette = PALETTES[target.season]
  const isChinese = language === "zh"
  const isNight = target.timeOfDay === "night"
  const isWinter = target.season === "winter"
  const isAutumn = target.season === "autumn"
  const seed = createSeed(target.id)
  const title = target.kind === "landmark" ? (isChinese ? target.chineseName : target.title) : (isChinese ? target.titleZh : target.title)
  const eyebrow = target.kind === "landmark" ? (isChinese ? "现场印记" : "FIELD SEAL") : (isChinese ? "游线徽章" : "TRAIL BADGE")
  const stopCount = target.kind === "route" ? target.stops.length : 1

  return (
    <svg ref={artRef} className="field-postcard__art-svg" data-postcard-art viewBox="0 0 800 580" role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="postcard-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={isNight ? palette.skyDeep : palette.sky} />
          <stop offset="1" stopColor="#091210" />
        </linearGradient>
        <linearGradient id="postcard-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.ground} />
          <stop offset="1" stopColor={palette.groundDeep} />
        </linearGradient>
        <linearGradient id="postcard-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.roof} />
          <stop offset="1" stopColor={palette.roofShadow} />
        </linearGradient>
        <radialGradient id="postcard-glow" cx="66%" cy="25%" r="60%">
          <stop offset="0" stopColor={palette.accent} stopOpacity={isNight ? ".18" : ".1"} />
          <stop offset="1" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
        <filter id="postcard-shadow" x="-30%" y="-40%" width="160%" height="190%">
          <feDropShadow dx="0" dy="18" stdDeviation="15" floodColor="#000" floodOpacity=".46" />
        </filter>
        <pattern id="postcard-grid" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="skewY(-27) scale(1 .72)">
          <path d="M36 0H0V36" fill="none" stroke="#d9e7d1" strokeOpacity=".12" />
        </pattern>
      </defs>

      <rect width="800" height="580" fill="url(#postcard-sky)" />
      <rect width="800" height="580" fill="url(#postcard-glow)" />
      <path d="M0 380 800 176v404H0Z" fill="url(#postcard-grid)" opacity=".72" />
      <path d="M0 381 800 177" stroke={palette.accent} strokeOpacity=".2" />

      {isNight ? (
        <g aria-hidden="true">
          <circle cx="637" cy="86" r="39" fill="#f7d68d" opacity=".12" />
          <circle cx="637" cy="86" r="21" fill="#f7d68d" opacity=".92" />
          <circle cx="629" cy="80" r="21" fill={isNight ? palette.sky : palette.skyDeep} opacity=".9" />
          <circle cx="522" cy="71" r="2" fill="#fff2c6" />
          <circle cx="704" cy="123" r="1.6" fill="#fff2c6" />
          <circle cx="563" cy="134" r="1.3" fill="#fff2c6" />
        </g>
      ) : null}

      {PARTICLES.map(([x, y, radius], index) => (
        <circle key={index} cx={x + (seed % 19)} cy={y + (seed % 11)} r={isWinter ? radius * 1.5 : radius} fill={palette.particle} opacity={isWinter ? ".72" : ".32"} />
      ))}

      <g transform="translate(400 327) rotate(-30) skewX(29) scale(1 .8)" filter="url(#postcard-shadow)">
        <rect x="-282" y="-143" width="564" height="286" rx="7" fill="#0c1714" stroke={palette.accent} strokeOpacity=".36" strokeWidth="8" />
        <rect x="-263" y="-124" width="526" height="248" fill="url(#postcard-ground)" stroke="#d0a063" strokeOpacity=".62" strokeWidth="2" />
        <path d="M-225-89h450M-225 89h450M0-124v248" stroke="#d8c18b" strokeOpacity=".4" strokeWidth="3" />
        <path d="M-241-110h44l-9-17h-27ZM197-110h44l-9-17h-27ZM-241 110h44l-9 17h-27ZM197 110h44l-9 17h-27Z" fill="#6c342b" stroke={palette.accent} strokeWidth="2" />

        {target.kind === "route" ? (
          <g fill="none" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".9">
            <path d="M-202 82C-119 58-105 2-36-15s74-55 155-80" strokeDasharray="8 11" />
          </g>
        ) : null}

        <g transform="translate(0 -12)">
          <path d="M-132 20h264l-16 56h-232Z" fill="#9a452f" stroke="#d8a457" strokeWidth="3" />
          <path d="M-151 20 0-43 151 20 0 51Z" fill="url(#postcard-roof)" stroke={palette.accent} strokeWidth="3" />
          <path d="M-106 8 0-36 106 8M-70-7 0-35l70 28" fill="none" stroke="#d7b06a" strokeOpacity=".72" strokeWidth="3" />
          <path d="M-103 76h206l-11 27h-184Z" fill="#6e352d" stroke="#b77c45" strokeWidth="2" />
          <path d="M-91 103h182l-8 19H-83Z" fill="#bf9351" opacity=".82" />
          <g fill="#eed285">
            <rect x="-77" y="25" width="12" height="28" rx="1" />
            <rect x="-42" y="25" width="12" height="28" rx="1" />
            <rect x="30" y="25" width="12" height="28" rx="1" />
            <rect x="65" y="25" width="12" height="28" rx="1" />
          </g>
          {isWinter ? <path d="M-151 20 0-43 151 20l-16 7L0-28-135 27Z" fill="#f3f1df" opacity=".9" /> : null}
        </g>

        <g fill={palette.roof} stroke={palette.accent} strokeWidth="2">
          <path d="M-220-76h58l-11-21h-36Z" />
          <path d="M162-76h58l-11-21h-36Z" />
          <path d="M-220 76h58l-11 21h-36Z" />
          <path d="M162 76h58l-11 21h-36Z" />
        </g>

        {isAutumn ? (
          <g fill={palette.leaf} opacity=".92">
            <circle cx="-185" cy="-106" r="9" /><circle cx="-160" cy="-122" r="6" /><circle cx="187" cy="-109" r="8" /><circle cx="164" cy="-127" r="6" />
            <circle cx="-192" cy="111" r="7" /><circle cx="185" cy="112" r="9" />
          </g>
        ) : null}

        {target.kind === "route" ? target.stops.map((stop, index) => {
          const x = -167 + index * (334 / Math.max(target.stops.length - 1, 1))
          return <g key={stop.id}><circle cx={x} cy={73 - (index % 2) * 22} r="9" fill="#10221d" stroke={index === target.stops.length - 1 ? palette.accent : "#b5c9ae"} strokeWidth="3" /><text x={x} y={77 - (index % 2) * 22} textAnchor="middle" fill="#f5e9b8" fontFamily="Arial, sans-serif" fontSize="10">{index + 1}</text></g>
        }) : (
          <g transform="translate(0 -113)" aria-hidden="true">
            <circle r="21" fill="#11251f" stroke={palette.accent} strokeWidth="3" />
            <path d="M0-15 5-5 16 0 5 5 0 16-5 5-16 0-5-5Z" fill={palette.accent} />
          </g>
        )}
      </g>

      <g fill="#f1e8ca" fontFamily="Arial, sans-serif">
        <text x="42" y="54" fontSize="12" letterSpacing="3.2" fill={palette.accent}>{eyebrow}</text>
        <text x="758" y="54" fontSize="11" letterSpacing="2.1" textAnchor="end" fill="#b7c4b6">{target.season.toUpperCase()} · {target.timeOfDay.toUpperCase()}</text>
        <text x="42" y="526" fontSize="11" letterSpacing="2.4" fill="#b7c4b6">FORBIDDEN CITY ATLAS · 01</text>
        <text x="758" y="526" fontSize="11" letterSpacing="2.2" textAnchor="end" fill={palette.accent}>{stopCount} {isChinese ? "站" : stopCount === 1 ? "SITE" : "STOPS"}</text>
        <text x="42" y="551" fontFamily="Georgia, 'Times New Roman', serif" fontSize="27" fill="#f3edda">{title.length > 26 ? title.slice(0, 26) + "…" : title}</text>
      </g>
    </svg>
  )
}

export function FieldPostcard({ isOpen, target, language, shareUrl, onClose }: FieldPostcardProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const artRef = useRef<SVGSVGElement>(null)
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "downloaded" | "error">("idle")
  const isChinese = language === "zh"

  useEffect(() => {
    if (!isOpen || !target) return undefined
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
  }, [isOpen, onClose, target])

  useEffect(() => setStatus("idle"), [target])

  if (!isOpen || !target) return null

  const title = target.kind === "landmark" ? (isChinese ? target.chineseName : target.title) : (isChinese ? target.titleZh : target.title)
  const secondaryTitle = target.kind === "landmark" ? (isChinese ? target.title : target.chineseName) : (isChinese ? target.title : target.titleZh)
  const category = target.kind === "landmark" ? (isChinese ? target.categoryZh : target.category) : (isChinese ? target.trailZh : target.trail)
  const era = target.kind === "landmark" ? (isChinese ? target.eraZh : target.era) : formatMoment(target.completedAt, language)
  const description = target.kind === "landmark" ? (isChinese ? target.descriptionZh : target.description) : (isChinese ? target.descriptionZh : target.description)
  const note = target.kind === "landmark" ? (isChinese ? target.artifactNoteZh : target.artifactNote) : (isChinese ? target.rewardZh + " · " + target.stops.length + "站" : target.reward + " · " + target.stops.length + " stops")
  const request: PostcardRequest = { kind: target.kind, id: target.id, season: target.season, timeOfDay: target.timeOfDay }
  const resolvedShareUrl = shareUrl ?? createPostcardUrl(request)
  const momentLabel = `${SEASON_LABELS[target.season][language]} · ${target.timeOfDay === "night" ? isChinese ? "夜" : "Night" : isChinese ? "昼" : "Day"}`

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedShareUrl)
      } else {
        const input = document.createElement("textarea")
        input.value = resolvedShareUrl
        input.setAttribute("readonly", "true")
        input.style.position = "fixed"
        input.style.opacity = "0"
        document.body.appendChild(input)
        input.select()
        document.execCommand("copy")
        input.remove()
      }
      setStatus("copied")
    } catch {
      setStatus("error")
    }
  }

  async function shareMoment() {
    if (!navigator.share) {
      await copyLink()
      return
    }
    try {
      await navigator.share({
        title: `${title} · Forbidden City Atlas`,
        text: description,
        url: resolvedShareUrl,
      })
      setStatus("shared")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setStatus("error")
    }
  }

  async function downloadPostcard() {
    const svg = artRef.current
    if (!svg) return
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      clone.setAttribute("width", "1600")
      clone.setAttribute("height", "1160")
      const serialized = new XMLSerializer().serializeToString(clone)
      const image = new Image()
      image.decoding = "async"
      const imageReady = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("Could not render postcard image"))
      })
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`
      await imageReady
      const canvas = document.createElement("canvas")
      canvas.width = 1600
      canvas.height = 1160
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Canvas is unavailable")
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) throw new Error("Could not encode postcard image")
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `forbidden-city-${slugify(title)}.png`
      anchor.click()
      URL.revokeObjectURL(url)
      setStatus("downloaded")
    } catch {
      setStatus("error")
    }
  }

  const statusMessage = status === "copied"
    ? isChinese ? "链接已复制" : "Link copied"
    : status === "shared"
      ? isChinese ? "已打开分享" : "Share sheet opened"
      : status === "downloaded"
        ? isChinese ? "明信片已下载" : "Postcard downloaded"
        : status === "error"
          ? isChinese ? "分享暂时不可用" : "Sharing is unavailable"
          : null

  return (
    <div className="field-postcard" role="presentation">
      <button className="field-postcard__backdrop" type="button" aria-label={isChinese ? "关闭明信片" : "Close postcard"} onClick={onClose} />
      <section ref={dialogRef} className="field-postcard__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="field-postcard__header">
          <div>
            <span className="micro">{isChinese ? "图鉴 / 现场明信片" : "Atlas / field postcard"}</span>
            <p>{isChinese ? "把一次漫游保存成可以带走的瞬间。" : "Keep one wandering moment close."}</p>
          </div>
          <button ref={closeButtonRef} className="icon-button" type="button" aria-label={isChinese ? "关闭明信片" : "Close postcard"} onClick={onClose}>
            <X size={17} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="field-postcard__body">
          <div className="field-postcard__art-wrap">
            <PostcardArt target={target} language={language} artRef={artRef} />
            <div className="field-postcard__art-caption"><span>{isChinese ? "一段被保存的行进" : "A passage worth keeping"}</span><span>BEIJING · 1420—1911</span></div>
          </div>

          <div className="field-postcard__details">
            <div className="field-postcard__eyebrow"><span className="field-postcard__seal"><Sparkles size={13} strokeWidth={1.5} aria-hidden="true" /></span><span className="micro">{target.kind === "landmark" ? isChinese ? "现场印记" : "Field seal" : isChinese ? "游线徽章" : "Trail badge"}</span></div>
            <span className="field-postcard__category micro">{category} <i aria-hidden="true">/</i> {era}</span>
            <h1 className="display-serif" id={titleId}>{title}</h1>
            <span className="field-postcard__secondary display-serif">{secondaryTitle}</span>
            <p className="field-postcard__description">{description}</p>

            <div className="field-postcard__meta">
              <div><span className="micro">{isChinese ? "记录时刻" : "Recorded in"}</span><strong>{momentLabel}</strong></div>
              <div><span className="micro">{isChinese ? "现场笔记" : "Field note"}</span><strong>{note}</strong></div>
            </div>

            <div className="field-postcard__actions">
              <button className="field-postcard__primary" type="button" onClick={shareMoment}>
                <Share2 size={15} strokeWidth={1.7} aria-hidden="true" />
                <span>{isChinese ? "分享这一刻" : "Share this moment"}</span>
                <span aria-hidden="true">↗</span>
              </button>
              <button className="field-postcard__secondary-action" type="button" onClick={copyLink}>
                {status === "copied" ? <Check size={15} strokeWidth={1.8} aria-hidden="true" /> : <Copy size={15} strokeWidth={1.7} aria-hidden="true" />}
                <span>{isChinese ? "复制链接" : "Copy link"}</span>
              </button>
              <button className="field-postcard__secondary-action" type="button" onClick={downloadPostcard}>
                <Download size={15} strokeWidth={1.7} aria-hidden="true" />
                <span>{isChinese ? "下载明信片" : "Download"}</span>
              </button>
            </div>

            <div className="field-postcard__link">
              <Link2 size={14} strokeWidth={1.5} aria-hidden="true" />
              <div><span className="micro">{isChinese ? "可分享的图鉴链接" : "Shareable atlas link"}</span><code>{resolvedShareUrl.replace(/^https?:\/\//, "")}</code></div>
            </div>

            {statusMessage ? <p className="field-postcard__status" role="status"><Check size={13} strokeWidth={1.8} aria-hidden="true" />{statusMessage}</p> : null}
          </div>
        </div>

        <footer className="field-postcard__footer">
          <span>{isChinese ? "故宫图鉴 / 私人探索档案" : "Forbidden City Atlas / personal field archive"}</span>
          <span>{isChinese ? "打开链接即可回到这一刻" : "Open the link to return to this moment"}</span>
        </footer>
      </section>
    </div>
  )
}
