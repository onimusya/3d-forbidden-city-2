import { useEffect, useId, useRef } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Layers,
  Sparkles,
  X,
} from 'lucide-react'

import './overlay.css'

export interface ProgressHistoryEntry {
  id?: string
  round: number | string
  date: string
  score: number
  discovered: number
  total?: number
  label?: string
  summary?: string
}

export type ProgressComparisonVariant = 'mass' | 'axis' | 'light'

export interface ProgressComparison {
  label: string
  before: string
  current: string
  change: string
  detail: string
  variant?: ProgressComparisonVariant
}

export interface ProgressVerdict {
  title: string
  body: string
  tone?: 'affirmation' | 'focus'
}

export interface ProgressPageProps {
  isOpen: boolean
  onClose: () => void
  history: readonly ProgressHistoryEntry[]
  currentRound?: number | string
  comparisons?: readonly ProgressComparison[]
  verdicts?: readonly ProgressVerdict[]
  remainingGaps?: readonly string[]
  language?: 'en' | 'zh'
}

const DEFAULT_COMPARISONS: readonly ProgressComparison[] = [
  {
    label: 'Axial rhythm',
    before: '62%',
    current: '84%',
    change: '+22 pts',
    detail: 'Gate-to-hall sequence now holds at walking scale.',
    variant: 'axis',
  },
  {
    label: 'Roof massing',
    before: '48%',
    current: '76%',
    change: '+28 pts',
    detail: 'Layered silhouettes are reading with more confidence.',
    variant: 'mass',
  },
  {
    label: 'Light & material',
    before: '55%',
    current: '81%',
    change: '+26 pts',
    detail: 'Warm surfaces separate from the dark field more cleanly.',
    variant: 'light',
  },
]

const DEFAULT_VERDICTS: readonly ProgressVerdict[] = [
  {
    title: 'The procession is becoming legible.',
    body: 'The centerline now gives the eye a clear beginning, pause, and arrival.',
    tone: 'affirmation',
  },
  {
    title: 'Keep the horizon quiet.',
    body: 'The next pass should protect the negative space around the northern court.',
    tone: 'focus',
  },
]

const DEFAULT_GAPS: readonly string[] = [
  'Clarify the relationship between the outer court and Meridian Gate.',
  'Add a softer material break to the western service roofs.',
  'Test the central axis at dusk lighting.',
]

const FALLBACK_HISTORY: readonly ProgressHistoryEntry[] = [
  { round: 1, date: '08 AUG', score: 41, discovered: 2, total: 8, label: 'Foundation' },
  { round: 2, date: '15 AUG', score: 57, discovered: 3, total: 8, label: 'Massing' },
  { round: 3, date: '22 AUG', score: 72, discovered: 5, total: 8, label: 'Atmosphere' },
  { round: 4, date: '28 AUG', score: 86, discovered: 6, total: 8, label: 'Current pass' },
]

const PROGRESS_COPY = {
  en: {
    eyebrow: 'Archive / progress log', title: 'A city, in revision.', close: 'Close progress', currentRound: 'Current round', fieldReview: 'Field review / 05.09.26', overviewFallback: 'A measured pass through structure, shadow, and the memory held between them.', atlasScore: 'Atlas score', sinceRoundOne: 'since round one', sitesFound: 'Sites found', spatialIndex: 'Spatial index', lastReview: 'Last review', curatorNotes: 'Curator notes saved', comparisonNumber: '01 / Visual comparison', comparisonTitle: 'The latest pass, beside the last.', comparisonNote: 'Reading the model as a sequence', before: 'Before', now: 'Now', verdictNumber: '02 / Critic verdicts', verdictTitle: 'What is holding.', confirmed: 'Confirmed', nextAttention: 'Next attention', gapsNumber: '03 / Remaining gaps', gapsTitle: 'The open edges.', nextReview: 'Next review: refine one relationship at a time.', timelineNumber: '04 / Improvements over time', timelineTitle: 'A slower, clearer line.', timelineNote: 'Six recorded passes', score: 'Score', fieldPass: 'Field pass', sitesIndexed: 'sites indexed.', footerLeft: 'Forbidden City Atlas / archive record 01', footerRight: 'Save the next question, not only the answer.',
  },
  zh: {
    eyebrow: '档案 / 进度记录', title: '一座城，持续修订。', close: '关闭进度', currentRound: '当前轮次', fieldReview: '现场评审 / 2026.09.05', overviewFallback: '一次穿过结构、阴影与记忆的克制漫游。', atlasScore: '图鉴评分', sinceRoundOne: '比第一轮', sitesFound: '已发现地标', spatialIndex: '空间索引', lastReview: '最近评审', curatorNotes: '策展笔记已保存', comparisonNumber: '01 / 视觉对比', comparisonTitle: '把最新一轮放在上一轮身旁。', comparisonNote: '将模型读作一段序列', before: '之前', now: '现在', verdictNumber: '02 / 评审结论', verdictTitle: '哪些已经站稳。', confirmed: '已确认', nextAttention: '下一步关注', gapsNumber: '03 / 待补空缺', gapsTitle: '仍然敞开的边缘。', nextReview: '下一轮评审：一次只打磨一段关系。', timelineNumber: '04 / 持续改进', timelineTitle: '一条更慢、更清晰的线。', timelineNote: '六轮记录', score: '评分', fieldPass: '现场迭代', sitesIndexed: '个地标已编入索引。', footerLeft: '故宫图鉴 / 档案记录 01', footerRight: '留下下一个问题，而不只是答案。',
  },
} as const

const DEFAULT_COMPARISONS_ZH: readonly ProgressComparison[] = [
  { label: '中轴节奏', before: '62%', current: '84%', change: '+22 分', detail: '门殿序列在漫游尺度下更连贯。', variant: 'axis' },
  { label: '屋顶体量', before: '48%', current: '76%', change: '+28 分', detail: '层叠的轮廓读起来更有把握。', variant: 'mass' },
  { label: '光线与材质', before: '55%', current: '81%', change: '+26 分', detail: '暖色表面与深色场地分离得更干净。', variant: 'light' },
]

const DEFAULT_VERDICTS_ZH: readonly ProgressVerdict[] = [
  { title: '行进路径开始清晰。', body: '中轴线为视线提供了明确的开始、停驻与抵达。', tone: 'affirmation' },
  { title: '让天际线保持安静。', body: '下一轮应保护北院周围的留白。', tone: 'focus' },
]

const DEFAULT_GAPS_ZH: readonly string[] = [
  '说清外朝与午门之间的空间关系。',
  '为西侧服务屋顶加入更柔和的材质转折。',
  '测试黄昏光线下的中轴线。',
]

function roundLabel(round: number | string, language: 'en' | 'zh' = 'en') {
  const value = String(round)
  const number = value.match(/[0-9]+/)?.[0] ?? value
  return language === 'zh'
    ? '第 ' + number.padStart(2, '0') + ' 轮'
    : value.toLowerCase().startsWith('round') ? value : 'Round ' + value.padStart(2, '0')
}

export function ProgressPage({
  isOpen,
  onClose,
  history,
  currentRound,
  comparisons = DEFAULT_COMPARISONS,
  verdicts = DEFAULT_VERDICTS,
  remainingGaps = DEFAULT_GAPS,
  language = 'en',
}: ProgressPageProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const timeline = history.length ? history : FALLBACK_HISTORY
  const latest = timeline[timeline.length - 1]
  const first = timeline[0]
  const activeRound = currentRound ?? latest?.round ?? 1
  const totalSites = latest?.total ?? 8
  const score = latest?.score ?? 0
  const discovered = latest?.discovered ?? 0
  const scoreDelta = latest && first && latest !== first ? latest.score - first.score : 0
  const isChinese = language === 'zh'
  const ui = PROGRESS_COPY[language]
  const visibleComparisons = isChinese && comparisons === DEFAULT_COMPARISONS ? DEFAULT_COMPARISONS_ZH : comparisons
  const visibleVerdicts = isChinese && verdicts === DEFAULT_VERDICTS ? DEFAULT_VERDICTS_ZH : verdicts
  const visibleGaps = isChinese && remainingGaps === DEFAULT_GAPS ? DEFAULT_GAPS_ZH : remainingGaps

  useEffect(() => {
    if (!isOpen) return undefined

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null)
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

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      restoreFocusRef.current?.focus()
      restoreFocusRef.current = null
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="progress-page" role="presentation">
      <div className="progress-page__backdrop" onMouseDown={onClose} />
      <section
        ref={dialogRef}
        className="progress-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="progress-dialog__header">
          <div>
            <span className="micro progress-dialog__eyebrow">{ui.eyebrow}</span>
            <h1 className="display-serif" id={titleId}>{ui.title}</h1>
          </div>
          <button ref={closeButtonRef} className="icon-button icon-button--light" type="button" aria-label={ui.close} onClick={onClose}>
            <X size={19} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="progress-dialog__body">
          <section className="progress-overview" aria-labelledby={`${titleId}-overview`}>
            <div className="progress-overview__heading">
              <div>
                <span className="micro">{ui.currentRound}</span>
                <h2 className="display-serif" id={`${titleId}-overview`}>
                  {roundLabel(activeRound, language)}
                </h2>
              </div>
              <span className="progress-overview__stamp micro">{ui.fieldReview}</span>
            </div>
            <p>{latest?.summary ?? ui.overviewFallback}</p>
            <div className="progress-stats">
              <div className="progress-stat">
                <span className="micro">{ui.atlasScore}</span>
                <strong>{String(score).padStart(2, '0')}</strong>
                <span className="progress-stat__delta">
                  <ArrowUpRight size={12} strokeWidth={1.7} aria-hidden="true" /> +{scoreDelta} {ui.sinceRoundOne}
                </span>
              </div>
              <div className="progress-stat">
                <span className="micro">{ui.sitesFound}</span>
                <strong>
                  {String(discovered).padStart(2, '0')}<small> / {String(totalSites).padStart(2, '0')}</small>
                </strong>
                <span className="progress-stat__delta progress-stat__delta--quiet">
                  <Layers size={12} strokeWidth={1.6} aria-hidden="true" /> {ui.spatialIndex}
                </span>
              </div>
              <div className="progress-stat">
                <span className="micro">{ui.lastReview}</span>
                <strong className="progress-stat__date">{latest?.date ?? '—'}</strong>
                <span className="progress-stat__delta progress-stat__delta--quiet">
                  <Clock3 size={12} strokeWidth={1.6} aria-hidden="true" /> {ui.curatorNotes}
                </span>
              </div>
            </div>
          </section>

          <section className="comparison-section" aria-labelledby={`${titleId}-comparison`}>
            <div className="section-heading">
              <div>
                <span className="micro">{ui.comparisonNumber}</span>
                <h2 className="display-serif" id={`${titleId}-comparison`}>
                  {ui.comparisonTitle}
                </h2>
              </div>
              <span className="section-heading__note">{ui.comparisonNote}</span>
            </div>
            <div className="comparison-grid">
              {visibleComparisons.map((comparison) => (
                <article className="comparison-card" key={comparison.label}>
                  <div className="comparison-card__topline">
                    <span className="micro">{comparison.label}</span>
                    <span className="comparison-card__change">
                      <ArrowUpRight size={12} strokeWidth={1.7} aria-hidden="true" /> {comparison.change}
                    </span>
                  </div>
                  <div className={`comparison-visual comparison-visual--${comparison.variant ?? 'axis'}`} aria-hidden="true">
                    <div className="comparison-visual__frame comparison-visual__frame--before">
                      <span className="micro">{ui.before}</span>
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="comparison-visual__frame comparison-visual__frame--current">
                      <span className="micro">{ui.now}</span>
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <div className="comparison-card__values">
                    <span>{comparison.before}</span>
                    <div className="comparison-card__bar" aria-hidden="true">
                      <span />
                    </div>
                    <strong>{comparison.current}</strong>
                  </div>
                  <p>{comparison.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="progress-lower-grid">
            <section className="verdict-section" aria-labelledby={`${titleId}-verdicts`}>
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="micro">{ui.verdictNumber}</span>
                  <h2 className="display-serif" id={`${titleId}-verdicts`}>
                    {ui.verdictTitle}
                  </h2>
                </div>
              </div>
              <div className="verdict-list">
                {visibleVerdicts.map((verdict) => (
                  <article className={`verdict-card verdict-card--${verdict.tone ?? 'affirmation'}`} key={verdict.title}>
                    <span className="verdict-card__icon" aria-hidden="true">
                      {verdict.tone === 'focus' ? (
                        <ArrowDownRight size={15} strokeWidth={1.6} />
                      ) : (
                        <Check size={15} strokeWidth={1.8} />
                      )}
                    </span>
                    <div>
                      <span className="micro">{verdict.tone === 'focus' ? ui.nextAttention : ui.confirmed}</span>
                      <h3>{verdict.title}</h3>
                      <p>{verdict.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="gaps-section" aria-labelledby={`${titleId}-gaps`}>
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="micro">{ui.gapsNumber}</span>
                  <h2 className="display-serif" id={`${titleId}-gaps`}>
                    {ui.gapsTitle}
                  </h2>
                </div>
              </div>
              <ol className="gaps-list">
                {visibleGaps.map((gap, index) => (
                  <li key={gap}>
                    <span className="micro">{String(index + 1).padStart(2, '0')}</span>
                    <span>{gap}</span>
                    <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  </li>
                ))}
              </ol>
              <div className="gaps-note">
                <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
                <span>{ui.nextReview}</span>
              </div>
            </section>
          </div>

          <section className="timeline-section" aria-labelledby={`${titleId}-timeline`}>
            <div className="section-heading">
              <div>
                <span className="micro">{ui.timelineNumber}</span>
                <h2 className="display-serif" id={`${titleId}-timeline`}>
                  {ui.timelineTitle}
                </h2>
              </div>
              <span className="section-heading__note">{ui.timelineNote}</span>
            </div>
            <ol className="progress-timeline">
              {timeline.map((entry, index) => {
                const isCurrent = index === timeline.length - 1
                const previous = timeline[index - 1]
                const delta = previous ? entry.score - previous.score : undefined

                return (
                  <li className={isCurrent ? 'is-current' : ''} key={entry.id ?? `${entry.round}-${entry.date}`}>
                    <div className="timeline-marker" aria-hidden="true">
                      <span />
                    </div>
                    <div className="timeline-entry">
                      <div className="timeline-entry__topline">
                        <span className="micro">{roundLabel(entry.round, language)}</span>
                        <time>{entry.date}</time>
                      </div>
                      <strong>{entry.label ?? ui.fieldPass}</strong>
                      <p>{entry.summary ?? (isChinese ? entry.discovered + " / " + (entry.total ?? totalSites) + " 个地标已编入索引。" : entry.discovered + " of " + (entry.total ?? totalSites) + " sites indexed.")}</p>
                      <div className="timeline-entry__score">
                        <span className="micro">{ui.score}</span>
                        <b>{String(entry.score).padStart(2, '0')}</b>
                        {delta !== undefined ? (
                          <span className="timeline-entry__delta">
                            <ArrowUpRight size={11} strokeWidth={1.7} aria-hidden="true" /> +{delta}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          <footer className="progress-dialog__footer">
            <span className="micro">{ui.footerLeft}</span>
            <span>{ui.footerRight}</span>
          </footer>
        </div>
      </section>
    </div>
  )
}
