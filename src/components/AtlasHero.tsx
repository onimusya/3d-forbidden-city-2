import { ArrowUpRight, Compass, ScanLine } from 'lucide-react'

import './overlay.css'

export interface AtlasStatusReadout {
  label: string
  value: string
  detail?: string
  tone?: 'live' | 'quiet'
}

export interface AtlasHeroProps {
  kicker?: string
  title?: string
  titleAccent?: string
  description?: string
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  status?: AtlasStatusReadout
  coordinates?: string
  viewLabel?: string
}

const DEFAULT_STATUS: AtlasStatusReadout = {
  label: 'Atlas status',
  value: 'Synchronized',
  detail: '3D field model / live layer',
  tone: 'live',
}

export function AtlasHero({
  kicker = 'A cartography of memory / 01',
  title = 'The city is a',
  titleAccent = 'sequence of thresholds.',
  description = 'Move through the imperial axis and uncover the rooms, rituals, and quiet geometries that shaped the Forbidden City.',
  primaryActionLabel = 'Enter the atlas',
  onPrimaryAction,
  status = DEFAULT_STATUS,
  coordinates = '39° 55′ 00″ N  ·  116° 23′ 27″ E',
  viewLabel = 'Aerial study / 00.01',
}: AtlasHeroProps) {
  return (
    <section className="atlas-hero" aria-labelledby="atlas-hero-title">
      <div className="atlas-hero__content">
        <div className="atlas-hero__kicker micro">
          <span className="status-dot" aria-hidden="true" />
          {kicker}
        </div>
        <h1 className="atlas-hero__title display-serif" id="atlas-hero-title">
          {title}
          <em>{titleAccent}</em>
        </h1>
        <p className="atlas-hero__description">{description}</p>
        <button className="atlas-cta" type="button" onClick={onPrimaryAction}>
          <span>{primaryActionLabel}</span>
          <ArrowUpRight size={16} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>

      <div className="atlas-hero__meta" aria-label="Atlas readout">
        <div className="atlas-hero__status">
          <div className="atlas-hero__status-heading">
            <span className="micro">{status.label}</span>
            <span className={`status-pulse status-pulse--${status.tone ?? 'quiet'}`} aria-hidden="true" />
          </div>
          <strong>{status.value}</strong>
          {status.detail ? <span>{status.detail}</span> : null}
        </div>
        <div className="atlas-hero__readout">
          <div>
            <Compass size={14} strokeWidth={1.5} aria-hidden="true" />
            <span className="micro">{coordinates}</span>
          </div>
          <div>
            <ScanLine size={14} strokeWidth={1.5} aria-hidden="true" />
            <span className="micro">{viewLabel}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
