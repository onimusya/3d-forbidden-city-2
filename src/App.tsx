import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { ChevronLeft, ChevronRight, Compass, Navigation, X } from "lucide-react"
import { AtlasHero } from "./components/AtlasHero"
import { AtlasPreloader } from "./components/AtlasPreloader"
import { DiscoveryJournal, type JournalLandmark, type JournalRoute } from "./components/DiscoveryJournal"
import { DiscoveryRail, type DiscoveryLandmark } from "./components/DiscoveryRail"
import { InteractionHint } from "./components/InteractionHint"
import { ProgressPage } from "./components/ProgressPage"
import { SiteInspector } from "./components/SiteInspector"
import { TopBar, type AtlasLanguage, type AtlasNavItem } from "./components/TopBar"
import type { Landmark } from "./data/landmarks"
import { LANDMARKS } from "./data/landmarks"
import { PROGRESS_HISTORY } from "./data/progress"
import { copy } from "./lib/i18n"
import { useAtlasAudio } from "./lib/useAtlasAudio"
import { useAtlasStore, type DiscoveryRecord, type RouteCompletion } from "./store/atlasStore"

const MapScene = lazy(() => import("./components/MapScene"))

function SceneFallback() {
  return (
    <div className="scene-fallback" aria-label="Loading the atlas">
      <span className="scene-fallback__mark" />
      <span className="micro">assembling the imperial grid</span>
    </div>
  )
}

const LANDMARK_COPY_ZH: Record<string, { category: string; era: string; description: string; fact: string }> = {
  'meridian-gate': { category: '门', era: '明代 · 永乐年间，1420', description: '五座门洞标记礼仪性的门槛，帝国路线由此展开。', fact: '中央通道只为皇帝保留，门洞本身就是一堂关于等级的课。' },
  'gate-of-supreme-harmony': { category: '门', era: '明代 · 永乐年间，1420', description: '越过金水桥，宫廷在三大殿前汇聚。', fact: '这是外朝的正门，也是午门以北的第一道重要门槛。' },
  'hall-of-supreme-harmony': { category: '外朝', era: '明代奠基 · 清代重修', description: '中轴线上最高的屋顶，升起于三层汉白玉台基之上。', fact: '故宫最大的宫殿，承载帝国最重要的典礼。' },
  'hall-of-central-harmony': { category: '外朝', era: '明代 · 永乐年间，1420', description: '一座亲密的方殿，停驻在典礼与漫长御道之间。', fact: '皇帝在此稍作准备，再前往更大的宫殿主持仪式。' },
  'hall-of-preserving-harmony': { category: '外朝', era: '明代奠基 · 清代重修', description: '外朝北端的屋顶守住中轴线，随后空间转入内廷。', fact: '清代时，殿内举行殿试的最后一场考试。' },
  'gate-of-heavenly-purity': { category: '内廷', era: '明代 · 永乐年间，1420', description: '一座克制的门，框出从公共典礼到帝王家宅的转折。', fact: '这里标志着内廷的门槛，后三宫就在其后。' },
  'palace-of-heavenly-purity': { category: '内廷', era: '明代奠基 · 清代宫居', description: '曾经的居所将起居与朝政抬升到同一座台基之上。', fact: '明代及清初皇帝居于此；雍正以后，日常政务移向西侧。' },
  'hall-of-union': { category: '内廷', era: '明代奠基 · 清代内廷', description: '两座宫殿之间的紧凑殿宇，赋予内廷以象征性的平衡。', fact: '清代这里收藏皇帝宝玺，并安置铜壶滴漏。' },
  'palace-of-earthly-tranquility': { category: '内廷', era: '明代奠基 · 清代改制，1655', description: '交泰殿之后，皇后宫殿完成后三宫的北向序列。', fact: '清代东暖阁成为帝王婚房，见证宫廷最私密的仪式。' },
  'imperial-garden': { category: '御花园', era: '明代 · 永乐年间，1417', description: '柏树、叠石、亭台与借景，让北路在一方园林中收束。', fact: '钦安殿锚定花园的中线，园林在此与礼制几何相遇。' },
  'hall-of-literary-brilliance': { category: '侧院', era: '明代 · 永乐年间，1420', description: '东侧的文华空间，让典礼宫苑的严整几何变得柔和。', fact: '这里与帝王讲学和东部宫廷的文脉生活密切相关。' },
  'hall-of-mental-cultivation': { category: '侧院', era: '明代奠基 · 雍正年间，1723', description: '中轴线以西的工作宫殿，揭开典礼背后的日常宫廷。', fact: '1723年起，这里成为清代皇帝的主要居所与办公中心。' },
}

const JOURNAL_ARTIFACTS: Record<string, { artifact: string; artifactZh: string; note: string; noteZh: string }> = {
  "meridian-gate": { artifact: "Vermilion Threshold", artifactZh: "朱门印", note: "The imperial passage begins where the red wall opens.", noteZh: "红墙开启之处，帝国通道由此开始。" },
  "gate-of-supreme-harmony": { artifact: "Golden Water Crossing", artifactZh: "金水印", note: "Five bridges turn approach into a measured ceremony.", noteZh: "五座桥让抵达变成一场有尺度的礼仪。" },
  "hall-of-supreme-harmony": { artifact: "Three-Tier Ceremony", artifactZh: "三台印", note: "The tallest roof gathers the court beneath one horizon.", noteZh: "最高的屋顶，让宫廷在同一条天际线下汇聚。" },
  "hall-of-central-harmony": { artifact: "Centering Pause", artifactZh: "中和印", note: "A small square hall holds the breath between grand rites.", noteZh: "一座方殿，停住盛大典礼之间的一口气。" },
  "hall-of-preserving-harmony": { artifact: "Examining Stone", artifactZh: "保和印", note: "The northern hall carries the memory of the palace examination.", noteZh: "北端宫殿保存着殿试最后一场考试的记忆。" },
  "gate-of-heavenly-purity": { artifact: "Inner Court Key", artifactZh: "内廷钥", note: "Crossing this gate changes public ceremony into private life.", noteZh: "跨过此门，公共礼仪转入帝王家宅。" },
  "palace-of-heavenly-purity": { artifact: "Quiet Audience", artifactZh: "乾清印", note: "Residence and governance once shared this elevated room.", noteZh: "起居与政务曾经在这座高台上的宫殿相遇。" },
  "hall-of-union": { artifact: "Seal of Balance", artifactZh: "交泰印", note: "The compact hall gives the inner court its symbolic center.", noteZh: "紧凑的殿宇，为内廷赋予象征性的中心。" },
  "palace-of-earthly-tranquility": { artifact: "Wedding Lantern", artifactZh: "坤宁印", note: "A private ritual once marked the northern end of the palace sequence.", noteZh: "一场私密仪式，曾标记宫殿序列的北端。" },
  "imperial-garden": { artifact: "Cypress Shadow", artifactZh: "御园印", note: "Cultivated landscape closes the axis with a quieter geometry.", noteZh: "园林以更安静的几何，让中轴线在北端收束。" },
  "hall-of-literary-brilliance": { artifact: "Scholar Desk", artifactZh: "文华印", note: "The eastern court keeps the trace of study and imperial learning.", noteZh: "东侧宫院保留着讲学与帝王文脉的痕迹。" },
  "hall-of-mental-cultivation": { artifact: "Daily Court", artifactZh: "养心印", note: "Behind ceremony, this working palace held the daily machinery of rule.", noteZh: "典礼背后，这座工作宫殿承载着日常政务。" },
}

const PROGRESS_HISTORY_ZH = [
  { label: '建立中轴线', summary: '第一轮可漫游的体量研究，搭起帝国南北路线。' },
  { label: '校准院落', summary: '东西两侧的目的地开始把视线从中轴线上引开。' },
  { label: '建立屋顶层级', summary: '尺度、色彩与高度区分了典礼的权力和居住的静谧。' },
  { label: '让探索清晰', summary: '图鉴开始说明你在哪里、附近有什么，以及它为何重要。' },
  { label: '当前迭代 · 克制自信', summary: '内容层已准备好，为双语故宫图鉴提供可漫游的骨架。' },
  { label: '让地标成为现场', summary: '点击地标后，镜头进入更近的等距现场，游线与详情保持在同一段体验里。' },
  { label: "当前迭代 · 导览成形", summary: "三条策划游线把故宫变成一段可跟随的路线，镜头、地图与探索笔记保持同步。" },
  { label: "当前迭代 · 记忆落地", summary: "地标印记与游线徽章会被保存，让每次漫游都能成为下一次探索的线索。" },
] as const

function toUiLandmark(landmark: Landmark, discoveredIds: readonly string[], language: 'en' | 'zh'): DiscoveryLandmark {
  const localized = LANDMARK_COPY_ZH[landmark.id]
  const isChinese = language === 'zh'
  return {
    id: landmark.id,
    category: isChinese ? localized.category : landmark.category,
    name: isChinese ? landmark.chineseName : landmark.title,
    chineseName: isChinese ? landmark.title : landmark.chineseName,
    era: isChinese ? localized.era : landmark.era,
    discovered: discoveredIds.includes(landmark.id),
  }
}

type ProcessionRoute = {
  id: string
  title: string
  titleZh: string
  description: string
  descriptionZh: string
  stops: readonly string[]
}

const PROCESSION_ROUTES: readonly ProcessionRoute[] = [
  {
    id: "southern-axis",
    title: "The Southern Axis",
    titleZh: "南向中轴",
    description: "Pass from the ceremonial gate through the Three Great Halls, following the city’s public sequence.",
    descriptionZh: "从礼仪性的午门出发，穿过三大殿，沿着城市的公共序列向北行进。",
    stops: ["meridian-gate", "gate-of-supreme-harmony", "hall-of-supreme-harmony", "hall-of-central-harmony", "hall-of-preserving-harmony"],
  },
  {
    id: "inner-court",
    title: "The Inner Court",
    titleZh: "内廷深处",
    description: "Leave public ceremony behind and move through the residences, symbols, and garden at the northern end.",
    descriptionZh: "离开公开的典礼空间，走进北端的居所、象征与园林。",
    stops: ["gate-of-heavenly-purity", "palace-of-heavenly-purity", "hall-of-union", "palace-of-earthly-tranquility", "imperial-garden"],
  },
  {
    id: "living-flanks",
    title: "The Living Flanks",
    titleZh: "东西侧院",
    description: "Read the court from its working edges: scholarship, administration, and the quiet garden threshold.",
    descriptionZh: "从宫苑的工作边缘阅读故宫：文脉、政务与通往园林的静谧门槛。",
    stops: ["hall-of-mental-cultivation", "hall-of-supreme-harmony", "hall-of-literary-brilliance", "imperial-garden"],
  },
]

type ProcessionPickerProps = {
  isOpen: boolean
  language: "en" | "zh"
  onClose: () => void
  onStart: (routeId: string) => void
}

function ProcessionPicker({ isOpen, language, onClose, onStart }: ProcessionPickerProps) {
  if (!isOpen) return null

  const isChinese = language === "zh"
  return (
    <div className="route-picker-layer">
      <button className="route-picker-backdrop" type="button" aria-label={isChinese ? "关闭游线选择" : "Close procession picker"} onClick={onClose} />
      <section className="route-picker glass-panel" role="dialog" aria-modal="true" aria-labelledby="procession-picker-title">
        <div className="route-picker__header">
          <div>
            <span className="micro route-picker__eyebrow">{isChinese ? "考察方法 / 02" : "Field method / 02"}</span>
            <h2 className="display-serif" id="procession-picker-title">{isChinese ? "选择一条游线。" : "Choose a procession."}</h2>
            <p>{isChinese ? "让镜头沿着故宫的空间秩序移动，每一站都保留一段可以停驻的故事。" : "Let the camera follow the city’s spatial order. Each stop keeps a story worth pausing for."}</p>
          </div>
          <button className="icon-button" type="button" aria-label={isChinese ? "关闭游线选择" : "Close procession picker"} onClick={onClose}>
            <X size={17} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="route-picker__list">
          {PROCESSION_ROUTES.map((route, index) => {
            const stops = route.stops.map((id) => LANDMARKS.find((landmark) => landmark.id === id)).filter((landmark): landmark is Landmark => Boolean(landmark))
            const title = isChinese ? route.titleZh : route.title
            return (
              <button className="route-option" key={route.id} type="button" data-testid={"route-option-" + route.id} aria-label={(isChinese ? "开始游览 " : "Start ") + title} onClick={() => onStart(route.id)}>
                <span className="route-option__index micro">{String(index + 1).padStart(2, "0")}</span>
                <span className="route-option__body">
                  <span className="route-option__meta micro"><Navigation size={12} strokeWidth={1.6} aria-hidden="true" /> {stops.length} {isChinese ? "站" : "stops"}</span>
                  <strong>{title}</strong>
                  <span className="route-option__description">{isChinese ? route.descriptionZh : route.description}</span>
                  <span className="route-option__stops">
                    {stops.map((stop, stopIndex) => <span key={stop.id}>{String(stopIndex + 1).padStart(2, "0")} · {isChinese ? stop.chineseName : stop.title}</span>)}
                  </span>
                </span>
                <ChevronRight size={17} strokeWidth={1.4} aria-hidden="true" />
              </button>
            )
          })}
        </div>
        <div className="route-picker__footer">
          <Compass size={14} strokeWidth={1.5} aria-hidden="true" />
          <span>{isChinese ? "可随时退出游线，继续自由漫游。" : "Exit any time and return to free exploration."}</span>
        </div>
      </section>
    </div>
  )
}

type ProcessionPanelProps = {
  route: ProcessionRoute
  stopIndex: number
  language: "en" | "zh"
  onStopSelect: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  onExit: () => void
}

function ProcessionPanel({ route, stopIndex, language, onStopSelect, onPrevious, onNext, onExit }: ProcessionPanelProps) {
  const isChinese = language === "zh"
  const stops = route.stops.map((id) => LANDMARKS.find((landmark) => landmark.id === id)).filter((landmark): landmark is Landmark => Boolean(landmark))
  const current = stops[Math.min(stopIndex, Math.max(0, stops.length - 1))]
  if (!current) return null

  return (
    <aside className="procession-panel glass-panel" aria-labelledby="procession-panel-title">
      <div className="procession-panel__topline">
        <span className="micro">{isChinese ? "游线 /" : "Procession /"} {String(stopIndex + 1).padStart(2, "0")}</span>
        <button className="icon-button" type="button" aria-label={isChinese ? "退出游线" : "Exit procession"} onClick={onExit}>
          <X size={15} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="procession-panel__heading">
        <span className="procession-panel__route-label"><Navigation size={13} strokeWidth={1.6} aria-hidden="true" /> <span className="micro">{isChinese ? "帝国行进" : "Imperial procession"}</span></span>
        <span className="procession-panel__count micro">{String(stopIndex + 1).padStart(2, "0")} / {String(stops.length).padStart(2, "0")}</span>
      </div>
      <h2 className="display-serif" id="procession-panel-title">{isChinese ? route.titleZh : route.title}</h2>
      <p className="procession-panel__description">{isChinese ? route.descriptionZh : route.description}</p>
      <div className="procession-panel__stops" role="list" aria-label={isChinese ? "游线站点" : "Procession stops"}>
        {stops.map((stop, index) => (
          <button className={"procession-stop" + (index === stopIndex ? " is-active" : "")} key={stop.id} type="button" role="listitem" aria-current={index === stopIndex ? "step" : undefined} aria-label={(isChinese ? "前往 " : "Go to ") + (isChinese ? stop.chineseName : stop.title)} onClick={() => onStopSelect(index)}>
            <span className="procession-stop__index micro">{String(index + 1).padStart(2, "0")}</span>
            <span className="procession-stop__name">{isChinese ? stop.chineseName : stop.title}</span>
          </button>
        ))}
      </div>
      <div className="procession-panel__current" aria-live="polite">
        <span className="micro">{isChinese ? "当前站点" : "Current stop"}</span>
        <strong>{isChinese ? current.chineseName : current.title}</strong>
        <span>{isChinese ? current.title : current.chineseName}</span>
      </div>
      <div className="procession-panel__controls">
        <button className="procession-panel__previous" type="button" disabled={stopIndex === 0} aria-label={isChinese ? "上一站" : "Previous stop"} onClick={onPrevious}>
          <ChevronLeft size={14} strokeWidth={1.6} aria-hidden="true" />
          <span>{isChinese ? "上一站" : "Previous"}</span>
        </button>
        <button className="procession-panel__next" type="button" aria-label={stopIndex === stops.length - 1 ? (isChinese ? "完成游线" : "Complete procession") : (isChinese ? "下一站" : "Next stop")} onClick={onNext}>
          <span>{stopIndex === stops.length - 1 ? (isChinese ? "完成游线" : "Complete route") : (isChinese ? "下一站" : "Next stop")}</span>
          <ChevronRight size={14} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  const shellRef = useRef<HTMLElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneTimedOut, setSceneTimedOut] = useState(false)
  const [routePickerOpen, setRoutePickerOpen] = useState(false)
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null)
  const [routeStopIndex, setRouteStopIndex] = useState(0)
  const [journalOpen, setJournalOpen] = useState(false)
  const {
    selectedId,
    hoveredId,
    discoveredIds,
    discoveryRecords,
    completedRoutes,
    language,
    progressOpen,
    helpVisible,
    soundEnabled,
    timeOfDay,
    season,
    resetViewSignal,
    setSelected,
    setHovered,
    discover,
    completeRoute,
    setLanguage,
    setProgressOpen,
    setHelpVisible,
    toggleSound,
    toggleTimeOfDay,
    cycleSeason,
    resetView,
  } = useAtlasStore()

  const { playSfx, startBgm } = useAtlasAudio(soundEnabled)
  const handleSceneReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => {
    if (sceneReady) return undefined
    const timeout = window.setTimeout(() => setSceneTimedOut(true), 12000)
    return () => window.clearTimeout(timeout)
  }, [sceneReady])

  const selectedLandmark = useMemo(
    () => LANDMARKS.find((landmark) => landmark.id === selectedId) ?? null,
    [selectedId],
  )
  const activeRoute = useMemo(
    () => PROCESSION_ROUTES.find((route) => route.id === activeRouteId) ?? null,
    [activeRouteId],
  )
  const uiLandmarks = useMemo(
    () => LANDMARKS.map((landmark) => toUiLandmark(landmark, discoveredIds, language)),
    [discoveredIds, language],
  )
  const journalLandmarks = useMemo<readonly JournalLandmark[]>(() => {
    const records = new Map<string, DiscoveryRecord>(discoveryRecords.map((record) => [record.id, record]))
    return LANDMARKS.map((landmark, index) => {
      const localized = LANDMARK_COPY_ZH[landmark.id]
      const artifact = JOURNAL_ARTIFACTS[landmark.id]
      const record = records.get(landmark.id)
      return {
        id: landmark.id,
        index: index + 1,
        title: landmark.title,
        chineseName: landmark.chineseName,
        category: landmark.category,
        categoryZh: localized.category,
        description: landmark.description,
        descriptionZh: localized.description,
        artifact: artifact.artifact,
        artifactZh: artifact.artifactZh,
        artifactNote: artifact.note,
        artifactNoteZh: artifact.noteZh,
        discovered: discoveredIds.includes(landmark.id),
        discoveredAt: record?.discoveredAt,
        season: record?.season,
        timeOfDay: record?.timeOfDay,
      }
    })
  }, [discoveredIds, discoveryRecords])
  const journalRoutes = useMemo<readonly JournalRoute[]>(() => PROCESSION_ROUTES.map((route) => {
    const completion = completedRoutes.find((entry: RouteCompletion) => entry.routeId === route.id)
    const stops = route.stops
      .map((id) => LANDMARKS.find((landmark) => landmark.id === id))
      .filter((landmark): landmark is Landmark => Boolean(landmark))
      .map((landmark) => ({ id: landmark.id, title: landmark.title, chineseName: landmark.chineseName }))
    return {
      id: route.id,
      title: route.title,
      titleZh: route.titleZh,
      stops,
      completed: Boolean(completion),
      completedAt: completion?.completedAt,
      season: completion?.season,
      timeOfDay: completion?.timeOfDay,
    }
  }), [completedRoutes])
  const progressHistory = useMemo(
    () => PROGRESS_HISTORY.map((entry, index) => ({
      id: entry.id,
      round: entry.round,
      date: entry.date.replaceAll("-", "."),
      score: Math.min(96, 46 + index * 11),
      discovered: Math.min(discoveredIds.length, Math.max(2, 2 + index * 2)),
      total: LANDMARKS.length,
      label: language === 'zh' ? PROGRESS_HISTORY_ZH[index]?.label ?? entry.title : entry.title,
      summary: language === 'zh' ? PROGRESS_HISTORY_ZH[index]?.summary ?? entry.summary : entry.summary,
    })),
    [discoveredIds.length, language],
  )

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(".atlas-topbar, .atlas-hero, .discovery-rail, .interaction-hint", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "power3.out" })
    }, shellRef)
    return () => context.revert()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const context = gsap.context(() => {
      gsap.fromTo(".site-inspector", { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.65, ease: "power3.out" })
    }, shellRef)
    return () => context.revert()
  }, [selectedId])

  const handleSelect = (id: string) => {
    playSfx("open")
    if (activeRoute) {
      const nextStopIndex = activeRoute.stops.indexOf(id)
      if (nextStopIndex >= 0) setRouteStopIndex(nextStopIndex)
      else {
        setActiveRouteId(null)
        setRouteStopIndex(0)
      }
    }
    setSelected(id)
  }

  const handleStartRoute = (routeId: string) => {
    const route = PROCESSION_ROUTES.find((candidate) => candidate.id === routeId)
    if (!route || !route.stops.length) return
    playSfx("open")
    setRoutePickerOpen(false)
    setJournalOpen(false)
    setActiveRouteId(route.id)
    setRouteStopIndex(0)
    setHelpVisible(false)
    setSelected(route.stops[0])
  }

  const handleRouteStop = (nextStopIndex: number) => {
    if (!activeRoute || nextStopIndex < 0 || nextStopIndex >= activeRoute.stops.length) return
    playSfx("select")
    setRouteStopIndex(nextStopIndex)
    setSelected(activeRoute.stops[nextStopIndex])
  }

  const handleExitRoute = () => {
    playSfx("close")
    setActiveRouteId(null)
    setRouteStopIndex(0)
    resetView()
    setSelected(null)
  }

  const handleNextRouteStop = () => {
    if (!activeRoute) return
    if (routeStopIndex >= activeRoute.stops.length - 1) {
      playSfx("discover")
      completeRoute(activeRoute.id, { season, timeOfDay })
      setToast(language === "en" ? "Procession saved · atlas view restored" : "游线已保存 · 已返回图鉴视角")
      setActiveRouteId(null)
      setRouteStopIndex(0)
      resetView()
      setSelected(null)
      window.setTimeout(() => setToast(null), 2600)
      return
    }
    handleRouteStop(routeStopIndex + 1)
  }

  const handleDiscover = (id: string) => {
    if (!discover(id, { season, timeOfDay })) return
    playSfx('discover')
    setToast(language === "en" ? "Site added to your field notes" : "地标已加入探索笔记")
    window.setTimeout(() => setToast(null), 2400)
  }

  const handleJournalLandmarkSelect = (id: string) => {
    playSfx("open")
    setJournalOpen(false)
    handleSelect(id)
  }

  const handleLanguageChange = (nextLanguage: AtlasLanguage) => {
    playSfx('select')
    setLanguage(nextLanguage === "EN" ? "en" : "zh")
  }

  const handleNavigate = (item: AtlasNavItem) => {
    playSfx('select')
    if (item === "archive") {
      setRoutePickerOpen(false)
      setProgressOpen(false)
      setJournalOpen(true)
      setHelpVisible(false)
      return
    }
    if (item === "method") {
      setJournalOpen(false)
      setRoutePickerOpen(true)
      setHelpVisible(false)
      return
    }
    setRoutePickerOpen(false)
    setJournalOpen(false)
    setHelpVisible(true)
  }

  const handleProgressOpen = () => {
    playSfx("open")
    setRoutePickerOpen(false)
    setJournalOpen(false)
    setProgressOpen(true)
  }

  const handleMenuOpen = () => {
    playSfx("open")
    setRoutePickerOpen(false)
    setJournalOpen(false)
    setHelpVisible(true)
  }

  const handleCloseInspector = () => {
    if (activeRouteId) {
      handleExitRoute()
      return
    }
    playSfx("close")
    resetView()
    setSelected(null)
  }

  const handleSoundToggle = () => {
    if (!soundEnabled) startBgm(true)
    toggleSound()
  }

  const handleTimeOfDayToggle = () => {
    playSfx("select")
    toggleTimeOfDay()
  }

  const handleSeasonCycle = () => {
    playSfx("select")
    cycleSeason()
  }

  const handleResetView = () => {
    playSfx('select')
    resetView()
  }

  return (
    <main ref={shellRef} className="app-shell" data-season={season} aria-busy={!sceneReady && !sceneTimedOut}>
      <div className="atlas-noise" aria-hidden="true" />
      <AtlasPreloader language={language} ready={sceneReady || sceneTimedOut} usingFallback={sceneTimedOut && !sceneReady} />
      <div className="canvas-layer" aria-label={language === "en" ? "Interactive isometric map of the Forbidden City" : "故宫互动等距地图"}>
        <Suspense fallback={<SceneFallback />}>
          <MapScene
            selectedId={selectedId}
            hoveredId={hoveredId}
            discoveredIds={discoveredIds}
            routeStopIds={activeRoute?.stops}
            activeRouteStopId={activeRoute?.stops[routeStopIndex] ?? null}
            resetViewSignal={resetViewSignal}
            onSelect={handleSelect}
            onHover={setHovered}
            onResetView={handleResetView}
            language={language}
            timeOfDay={timeOfDay}
            season={season}
            onReady={handleSceneReady}
          />
        </Suspense>
      </div>

      <div className={"ui-layer" + (selectedLandmark ? " has-selection" : "") + (activeRoute ? " has-route" : "")}>
        <TopBar
          language={language === "en" ? "EN" : "中"}
          onLanguageChange={handleLanguageChange}
          onProgressOpen={handleProgressOpen}
          onMenuOpen={handleMenuOpen}
          onNavigate={handleNavigate}
          soundEnabled={soundEnabled}
          onSoundToggle={handleSoundToggle}
          timeOfDay={timeOfDay}
          onTimeOfDayToggle={handleTimeOfDayToggle}
          season={season}
          onSeasonCycle={handleSeasonCycle}
          progressLabel={copy(language, "navProgress") + " · " + discoveredIds.length + "/" + LANDMARKS.length}
          menuLabel={copy(language, "menu")}
        />
        {activeRoute && (
          <ProcessionPanel
            route={activeRoute}
            stopIndex={routeStopIndex}
            language={language}
            onStopSelect={handleRouteStop}
            onPrevious={() => handleRouteStop(routeStopIndex - 1)}
            onNext={handleNextRouteStop}
            onExit={handleExitRoute}
          />
        )}
        <AtlasHero
          kicker={copy(language, "appKicker") + " / 01"}
          title={language === "en" ? "The city is a" : "这座城，是一段"}
          titleAccent={language === "en" ? "sequence of thresholds." : "层层递进的门槛。"}
          description={language === "en" ? "Move through the imperial axis and uncover the rooms, rituals, and quiet geometries that shaped the Forbidden City." : "沿着帝国中轴线漫游，发现塑造故宫的宫室、仪式与静谧几何。"}
          primaryActionLabel={copy(language, "enterAtlas")}
          onPrimaryAction={() => setHelpVisible(true)}
        />
        <DiscoveryRail
          landmarks={uiLandmarks}
          discoveredIds={discoveredIds}
          totalCount={LANDMARKS.length}
          maxVisible={LANDMARKS.length}
          language={language}
          label={language === "en" ? "Known sites" : "已知地标"}
          onSelect={(landmark) => handleSelect(landmark.id)}
        />
        {helpVisible && !selectedLandmark && !progressOpen && (
          <InteractionHint
            defaultExpanded
            onToggle={(expanded) => setHelpVisible(expanded)}
            onOpenProcessions={() => {
              playSfx("open")
              setRoutePickerOpen(true)
              setHelpVisible(false)
            }}
            onOpenJournal={() => {
              playSfx("open")
              setRoutePickerOpen(false)
              setJournalOpen(true)
              setHelpVisible(false)
            }}
            language={language}
            label={language === "en" ? "Navigate the field" : "探索图鉴"}
          />
        )}
        {selectedLandmark && (
          <SiteInspector
            landmark={{
              id: selectedLandmark.id,
              category: selectedLandmark.category,
              name: selectedLandmark.title,
              chineseName: selectedLandmark.chineseName,
              era: selectedLandmark.era,
              description: selectedLandmark.description,
              fact: selectedLandmark.fact,
              categoryZh: LANDMARK_COPY_ZH[selectedLandmark.id]?.category,
              eraZh: LANDMARK_COPY_ZH[selectedLandmark.id]?.era,
              descriptionZh: LANDMARK_COPY_ZH[selectedLandmark.id]?.description,
              factZh: LANDMARK_COPY_ZH[selectedLandmark.id]?.fact,
              discovered: discoveredIds.includes(selectedLandmark.id),
              index: LANDMARKS.findIndex((landmark) => landmark.id === selectedLandmark.id) + 1,
            }}
            isOpen
            language={language}
            onClose={handleCloseInspector}
            onDiscover={(landmark) => handleDiscover(landmark.id)}
          />
        )}
      </div>

      <ProcessionPicker isOpen={routePickerOpen} language={language} onClose={() => setRoutePickerOpen(false)} onStart={handleStartRoute} />

      <DiscoveryJournal
        isOpen={journalOpen}
        language={language}
        landmarks={journalLandmarks}
        routes={journalRoutes}
        onClose={() => setJournalOpen(false)}
        onSelectLandmark={handleJournalLandmarkSelect}
      />

      <ProgressPage
        isOpen={progressOpen}
        onClose={() => setProgressOpen(false)}
        history={progressHistory}
        currentRound={PROGRESS_HISTORY.at(-1)?.round ?? 1}
        language={language}
        remainingGaps={language === 'zh' ? ['让未完成的游线可以在下次访问时继续。', '把一枚图鉴印记分享给同行者。', '继续优化低功耗设备上的 WebGL 构图与纹理内存。'] : ['Resume an unfinished procession between visits.', 'Share a field journal moment with someone else.', 'Tune low-power WebGL framing and texture memory.']}
      />

      {toast && (
        <div className="app-toast glass-panel" role="status">
          <span className="status-dot" aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}
    </main>
  )
}
