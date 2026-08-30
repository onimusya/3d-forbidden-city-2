import { Check, ChevronRight, MapPin } from 'lucide-react'

import type { Landmark } from './SiteInspector'
import './overlay.css'

export interface DiscoveryLandmark
  extends Pick<Landmark, 'id' | 'category' | 'name' | 'chineseName' | 'era'> {
  discovered?: boolean
  isDiscovered?: boolean
  index?: number | string
}

export interface DiscoveryRailProps {
  landmarks: readonly DiscoveryLandmark[]
  discoveredIds?: ReadonlySet<string> | readonly string[]
  onSelect: (landmark: DiscoveryLandmark) => void
  totalCount?: number
  maxVisible?: number
  label?: string
  language?: 'en' | 'zh'
}

function hasBeenDiscovered(
  landmark: DiscoveryLandmark,
  discoveredIds?: ReadonlySet<string> | readonly string[],
) {
  if (discoveredIds) {
    return "has" in discoveredIds ? discoveredIds.has(landmark.id) : discoveredIds.includes(landmark.id)
  }
  return landmark.discovered ?? landmark.isDiscovered ?? false
}

export function DiscoveryRail({
  landmarks,
  discoveredIds,
  onSelect,
  totalCount,
  maxVisible = 4,
  label = 'Known sites',
  language = 'en',
}: DiscoveryRailProps) {
  const discoveredCount = landmarks.filter((landmark) => hasBeenDiscovered(landmark, discoveredIds)).length
  const countTotal = Math.max(totalCount ?? landmarks.length, landmarks.length)
  const progress = countTotal === 0 ? 0 : Math.round((discoveredCount / countTotal) * 100)
  const visibleLandmarks = landmarks.slice(0, maxVisible)
  const isChinese = language === 'zh'

  return (
    <section className="discovery-rail" aria-label={isChinese ? '地标探索' : 'Landmark discoveries'}>
      <div className="discovery-rail__summary">
        <div>
          <span className="micro">{label}</span>
          <strong>
            {String(discoveredCount).padStart(2, '0')}
            <small> / {String(countTotal).padStart(2, '0')}</small>
          </strong>
        </div>
        <div className="discovery-rail__meter" aria-label={`${progress}% of landmarks discovered`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="discovery-rail__percentage micro">{String(progress).padStart(2, '0')}%</span>
      </div>

      <div className="discovery-rail__sites">
        {visibleLandmarks.length ? (
          visibleLandmarks.map((landmark, index) => {
            const discovered = hasBeenDiscovered(landmark, discoveredIds)

            return (
              <button
                className={`discovery-card${discovered ? ' is-discovered' : ''}`}
                key={landmark.id}
                type="button"
                aria-label={isChinese ? "打开" + landmark.name + "详情" : "Open " + landmark.name + " details"}
                onClick={() => onSelect(landmark)}
              >
                <span className="discovery-card__index micro">{String(index + 1).padStart(2, '0')}</span>
                <span className="discovery-card__body">
                  <span className="discovery-card__category">
                    <MapPin size={11} strokeWidth={1.6} aria-hidden="true" />
                    {landmark.category}
                  </span>
                  <strong>{landmark.name}</strong>
                  <span lang="zh-Hans">{landmark.chineseName}</span>
                </span>
                <span className="discovery-card__state" aria-hidden="true">
                  {discovered ? <Check size={13} strokeWidth={1.9} /> : <ChevronRight size={15} strokeWidth={1.5} />}
                </span>
              </button>
            )
          })
        ) : (
          <div className="discovery-rail__empty">
            <span className="micro">{isChinese ? '暂无地标记录' : 'No site records loaded'}</span>
          </div>
        )}
      </div>
    </section>
  )
}
