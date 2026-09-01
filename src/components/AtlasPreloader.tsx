import { useEffect, useRef, useState } from 'react'
import { useAtlasLoading } from '../lib/atlasLoading'

import './overlay.css'

type AtlasPreloaderProps = {
  language: 'en' | 'zh'
  ready: boolean
  usingFallback?: boolean
}

export function AtlasPreloader({ language, ready, usingFallback = false }: AtlasPreloaderProps) {
  const { active, errors, progress } = useAtlasLoading()
  const startedAtRef = useRef(Date.now())
  const [isExiting, setIsExiting] = useState(false)
  const [isMounted, setIsMounted] = useState(true)
  const [displayProgress, setDisplayProgress] = useState(6)
  const isChinese = language === 'zh'

  useEffect(() => {
    const target = ready ? 100 : Math.max(6, Math.min(99, Math.round(progress || (active ? 4 : 6))))
    let frame = 0

    const animate = () => {
      setDisplayProgress((current) => {
        const next = current + (target - current) * 0.18
        if (Math.abs(target - next) < 0.5) return target
        frame = window.requestAnimationFrame(animate)
        return next
      })
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [active, progress, ready])

  useEffect(() => {
    if (!ready) return undefined

    const elapsed = Date.now() - startedAtRef.current
    const exitDelay = Math.max(0, 820 - elapsed)
    const exitTimer = window.setTimeout(() => setIsExiting(true), exitDelay)
    const removeTimer = window.setTimeout(() => setIsMounted(false), exitDelay + 620)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(removeTimer)
    }
  }, [ready])

  if (!isMounted) return null

  const status = usingFallback
    ? (isChinese ? '使用轻量场景' : 'Using lightweight scene')
    : errors.length
      ? (isChinese ? '继续加载场景' : 'Continuing with scene load')
      : ready
        ? (isChinese ? '场景已就绪' : 'Scene ready')
        : active
          ? (isChinese ? '正在解析模型' : 'Parsing model')
          : (isChinese ? '正在组装宫苑' : 'Assembling palace grounds')

  return (
    <div
      className={'atlas-preloader' + (isExiting ? ' is-exiting' : '')}
      role="status"
      aria-live="polite"
      aria-label={isChinese ? '正在加载故宫图鉴' : 'Loading Forbidden City Atlas'}
    >
      <div className="atlas-preloader__grid" aria-hidden="true" />
      <div className="atlas-preloader__wash" aria-hidden="true" />
      <section className="atlas-preloader__panel" aria-label={isChinese ? '图鉴加载进度' : 'Atlas loading progress'}>
        <header className="atlas-preloader__header">
          <div className="atlas-preloader__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <span className="micro atlas-preloader__brand">Forbidden City Atlas</span>
            <span className="atlas-preloader__edition">Beijing · 1420—1911 / 01</span>
          </div>
        </header>

        <div className="atlas-preloader__center">
          <span className="micro atlas-preloader__eyebrow">
            {isChinese ? '初始化 / 等距场景' : 'Initialising / isometric scene'}
          </span>
          <div className="atlas-preloader__figure">
            <span className="atlas-preloader__figure-line" aria-hidden="true" />
            <strong>{Math.round(displayProgress).toString().padStart(2, '0')}</strong>
            <span className="micro">%</span>
          </div>
          <p>{isChinese ? '沿着帝国中轴线，准备一座可以漫游的城。' : 'Preparing a city you can move through.'}</p>
        </div>

        <div
          className="atlas-preloader__meter"
          role="progressbar"
          aria-label={isChinese ? "图鉴加载进度" : "Atlas loading progress"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(displayProgress)}
        >
          <span style={{ width: displayProgress + '%' }} />
        </div>

        <footer className="atlas-preloader__footer">
          <span className="atlas-preloader__status">
            <i className={ready ? 'is-ready' : ''} />
            {status}
          </span>
          <span className="micro">{isChinese ? '拖动 · 旋转 · 发现' : 'Drag · orbit · discover'}</span>
        </footer>
      </section>
    </div>
  )
}
