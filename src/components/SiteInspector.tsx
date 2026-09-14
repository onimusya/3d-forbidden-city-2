import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { Box, Check, ChevronLeft, ChevronRight, MapPin, Share2, Sparkles, X } from "lucide-react"

import { commonsSearchUrl, fetchCommonsPhotos, type CommonsPhoto } from "../lib/commonsPhotos"

import "./overlay.css"

export interface Landmark {
  id: string
  category: string
  name: string
  chineseName: string
  era: string
  description: string
  fact?: string
  context?: string
  contextZh?: string
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
  onPostcard?: (landmark: Landmark) => void
  onViewModel?: (landmark: Landmark) => void
  isDiscovering?: boolean
}


function PhotoGallery({ landmark, language }: { landmark: Landmark; language: InspectorLanguage }) {
  const titleId = useId()
  const [photos, setPhotos] = useState<CommonsPhoto[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const isChinese = language === "zh"

  useEffect(() => {
    const controller = new AbortController()
    setPhotos([])
    setStatus("loading")
    setActiveIndex(null)

    fetchCommonsPhotos(landmark.name, landmark.chineseName, controller.signal)
      .then((nextPhotos) => {
        if (controller.signal.aborted) return
        setPhotos(nextPhotos)
        setStatus(nextPhotos.length ? "ready" : "empty")
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error")
      })

    return () => controller.abort()
  }, [landmark.chineseName, landmark.id, landmark.name])

  useEffect(() => {
    if (activeIndex === null) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopImmediatePropagation()
        setActiveIndex(null)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        movePhoto(-1)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        movePhoto(1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, photos.length])

  const activePhoto = activeIndex === null ? null : photos[activeIndex] ?? null

  function movePhoto(direction: -1 | 1) {
    if (!photos.length) return
    setActiveIndex((current) => ((current ?? 0) + direction + photos.length) % photos.length)
  }

  return (
    <>
      <section className="site-inspector__photos" aria-labelledby={titleId}>
      <div className="site-inspector__photos-heading">
        <div>
          <span className="micro">{isChinese ? "现场照片 /" : "Photo log /"} 04</span>
          <h3 id={titleId}>{isChinese ? "最近的现场影像" : "Recent field photographs"}</h3>
        </div>
        <span className="site-inspector__photos-source">Wikimedia Commons</span>
      </div>

      {status === "loading" ? (
        <div className="site-inspector__photo-loading" aria-live="polite">
          <span className="site-inspector__photo-skeleton" />
          <span className="site-inspector__photo-skeleton" />
          <span className="site-inspector__photo-skeleton" />
        </div>
      ) : null}

      {status === "ready" ? (
        <div className="site-inspector__photo-grid">
          {photos.map((photo, index) => (
            <figure className="site-inspector__photo" key={photo.id}>
              <button
                className="site-inspector__photo-trigger"
                type="button"
                aria-label={(isChinese ? "放大查看 " : "Open photo ") + String(index + 1) + ": " + photo.title}
                onClick={() => setActiveIndex(index)}
              >
                <img src={photo.imageUrl} alt={photo.alt} loading="lazy" decoding="async" />
                <span aria-hidden="true">↗</span>
              </button>
              <figcaption>
                <strong>{photo.year ?? (isChinese ? "年代未知" : "Date unknown")}</strong>
                <span>{photo.artist}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      {status === "empty" || status === "error" ? (
        <div className="site-inspector__photo-empty">
          <p>{isChinese ? "暂时没有可加载的现场照片，仍可浏览该地点的公开图像。" : "No field photographs loaded yet, but the public image archive is still open."}</p>
          <a href={commonsSearchUrl(landmark.name)} target="_blank" rel="noreferrer">
            {isChinese ? "浏览公开图像" : "Browse photo archive"} <span aria-hidden="true">↗</span>
          </a>
        </div>
      ) : null}

      {status === "ready" ? (
        <p className="site-inspector__photo-credit">
          {isChinese ? "图片来自 Wikimedia Commons；请打开来源查看摄影者与授权信息。" : "Images via Wikimedia Commons; open a source to see photographer and license details."}
        </p>
      ) : null}
    </section>

        {activePhoto ? createPortal(
          <div className="site-photo-lightbox">
            <button
              className="site-photo-lightbox__backdrop"
              type="button"
              aria-label={isChinese ? "关闭照片查看器" : "Close photo viewer"}
              onClick={() => setActiveIndex(null)}
            />
            <section
              className="site-photo-lightbox__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId + "-lightbox"}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="site-photo-lightbox__header">
                <div>
                  <span className="micro">{isChinese ? "现场影像 /" : "Field image /"} {String((activeIndex ?? 0) + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
                  <h3 id={titleId + "-lightbox"}>{isChinese ? "在现场停留。" : "Stay with the place."}</h3>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  autoFocus
                  aria-label={isChinese ? "关闭照片查看器" : "Close photo viewer"}
                  onClick={() => setActiveIndex(null)}
                >
                  <X size={17} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

              <div className="site-photo-lightbox__stage">
                <button
                  className="site-photo-lightbox__arrow"
                  type="button"
                  aria-label={isChinese ? "上一张照片" : "Previous photo"}
                  onClick={() => movePhoto(-1)}
                  disabled={photos.length < 2}
                >
                  <ChevronLeft size={19} strokeWidth={1.4} aria-hidden="true" />
                </button>
                <figure className="site-photo-lightbox__figure">
                  <div className="site-photo-lightbox__image-wrap">
                    <img src={activePhoto.imageUrl} alt={activePhoto.alt} />
                  </div>
                  <figcaption>
                    <div>
                      <strong>{activePhoto.year ?? (isChinese ? "年代未知" : "Date unknown")}</strong>
                      <span>{activePhoto.artist} · {activePhoto.license}</span>
                    </div>
                    <a href={activePhoto.sourceUrl} target="_blank" rel="noreferrer">
                      {isChinese ? "查看来源" : "View source"} <span aria-hidden="true">↗</span>
                    </a>
                  </figcaption>
                </figure>
                <button
                  className="site-photo-lightbox__arrow"
                  type="button"
                  aria-label={isChinese ? "下一张照片" : "Next photo"}
                  onClick={() => movePhoto(1)}
                  disabled={photos.length < 2}
                >
                  <ChevronRight size={19} strokeWidth={1.4} aria-hidden="true" />
                </button>
              </div>

              <div className="site-photo-lightbox__thumbs" role="list" aria-label={isChinese ? "照片缩略图" : "Photo thumbnails"}>
                {photos.map((photo, index) => (
                  <button
                    className={"site-photo-lightbox__thumb" + (index === activeIndex ? " is-active" : "")}
                    type="button"
                    role="listitem"
                    aria-label={(isChinese ? "查看照片 " : "View photo ") + String(index + 1)}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => setActiveIndex(index)}
                    key={photo.id}
                  >
                    <img src={photo.imageUrl} alt="" />
                  </button>
                ))}
              </div>
            </section>
          </div>,
          document.body,
        ) : null}
    </>
  )
}

export function SiteInspector({
  landmark,
  isOpen = true,
  language = "en",
  onClose,
  onDiscover,
  onPostcard,
  onViewModel,
  isDiscovering = false,
}: SiteInspectorProps) {
  const titleId = useId()
  const descriptionId = useId()
  const isChinese = language === "zh"

  useEffect(() => {
    if (!landmark || !isOpen) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (document.querySelector(".site-photo-lightbox, .building-model-viewer")) return
        onClose()
      }
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
  const context = isChinese ? landmark.contextZh ?? landmark.context : landmark.context

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

      {context ? (
        <div className="site-inspector__context">
          <span className="micro">{isChinese ? "建筑故事" : "Deeper context"}</span>
          <p>{context}</p>
        </div>
      ) : null}

      {onViewModel ? (
        <button className="model-view-button" type="button" onClick={() => onViewModel(landmark)}>
          <Box size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>{isChinese ? "查看建筑三维模型" : "View this building in 3D"}</strong>
            <small>{isChinese ? "参考现场照片的可旋转建筑研究" : "Rotate a photo-referenced architectural study"}</small>
          </span>
          <span aria-hidden="true">↗</span>
        </button>
      ) : null}

      <div className="site-inspector__location">
        <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
        <span className="micro">{isChinese ? "内廷 / 中轴线" : landmark.coordinates ?? "Inner court / central axis"}</span>
      </div>

      <PhotoGallery landmark={landmark} language={language} />

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
      {discovered && onPostcard ? (
        <button className="postcard-button" type="button" onClick={() => onPostcard(landmark)}>
          <Share2 size={14} strokeWidth={1.6} aria-hidden="true" />
          <span>{isChinese ? "制作现场明信片" : "Make a field postcard"}</span>
          <span aria-hidden="true">↗</span>
        </button>
      ) : null}
    </aside>
  )
}
