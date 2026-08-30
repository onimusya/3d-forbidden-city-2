import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { AtlasHero } from "./components/AtlasHero"
import { DiscoveryRail, type DiscoveryLandmark } from "./components/DiscoveryRail"
import { InteractionHint } from "./components/InteractionHint"
import { ProgressPage } from "./components/ProgressPage"
import { SiteInspector } from "./components/SiteInspector"
import { TopBar, type AtlasLanguage, type AtlasNavItem } from "./components/TopBar"
import type { Landmark } from "./data/landmarks"
import { LANDMARKS } from "./data/landmarks"
import { PROGRESS_HISTORY } from "./data/progress"
import { copy } from "./lib/i18n"
import { useAtlasStore } from "./store/atlasStore"

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

const PROGRESS_HISTORY_ZH = [
  { label: '建立中轴线', summary: '第一轮可漫游的体量研究，搭起帝国南北路线。' },
  { label: '校准院落', summary: '东西两侧的目的地开始把视线从中轴线上引开。' },
  { label: '建立屋顶层级', summary: '尺度、色彩与高度区分了典礼的权力和居住的静谧。' },
  { label: '让探索清晰', summary: '图鉴开始说明你在哪里、附近有什么，以及它为何重要。' },
  { label: '当前迭代 · 克制自信', summary: '内容层已准备好，为双语故宫图鉴提供可漫游的骨架。' },
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

export default function App() {
  const shellRef = useRef<HTMLElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const {
    selectedId,
    hoveredId,
    discoveredIds,
    language,
    progressOpen,
    helpVisible,
    resetViewSignal,
    setSelected,
    setHovered,
    discover,
    setLanguage,
    setProgressOpen,
    setHelpVisible,
    resetView,
  } = useAtlasStore()

  const selectedLandmark = useMemo(
    () => LANDMARKS.find((landmark) => landmark.id === selectedId) ?? null,
    [selectedId],
  )
  const uiLandmarks = useMemo(
    () => LANDMARKS.map((landmark) => toUiLandmark(landmark, discoveredIds, language)),
    [discoveredIds, language],
  )
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
    setSelected(id)
  }

  const handleDiscover = (id: string) => {
    if (!discover(id)) return
    setToast(language === "en" ? "Site added to your field notes" : "地标已加入探索笔记")
    window.setTimeout(() => setToast(null), 2400)
  }

  const handleLanguageChange = (nextLanguage: AtlasLanguage) => {
    setLanguage(nextLanguage === "EN" ? "en" : "zh")
  }

  const handleNavigate = (item: AtlasNavItem) => {
    if (item === "archive") {
      setProgressOpen(true)
      return
    }
    setHelpVisible(true)
  }

  return (
    <main ref={shellRef} className="app-shell">
      <div className="atlas-noise" aria-hidden="true" />
      <div className="canvas-layer" aria-label={language === "en" ? "Interactive isometric map of the Forbidden City" : "故宫互动等距地图"}>
        <Suspense fallback={<SceneFallback />}>
          <MapScene
            selectedId={selectedId}
            hoveredId={hoveredId}
            discoveredIds={discoveredIds}
            resetViewSignal={resetViewSignal}
            onSelect={handleSelect}
            onHover={setHovered}
            onResetView={resetView}
            language={language}
          />
        </Suspense>
      </div>

      <div className={"ui-layer" + (selectedLandmark ? " has-selection" : "")}>
        <TopBar
          language={language === "en" ? "EN" : "中"}
          onLanguageChange={handleLanguageChange}
          onProgressOpen={() => setProgressOpen(true)}
          onMenuOpen={() => setHelpVisible(true)}
          onNavigate={handleNavigate}
          progressLabel={copy(language, "navProgress") + " · " + discoveredIds.length + "/" + LANDMARKS.length}
          menuLabel={copy(language, "menu")}
        />
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
          language={language}
          label={language === "en" ? "Known sites" : "已知地标"}
          onSelect={(landmark) => handleSelect(landmark.id)}
        />
        {helpVisible && !selectedLandmark && !progressOpen && <InteractionHint defaultExpanded onToggle={(expanded) => setHelpVisible(expanded)} language={language} label={language === "en" ? "Navigate the field" : "探索图鉴"} />}
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
            onClose={() => setSelected(null)}
            onDiscover={(landmark) => handleDiscover(landmark.id)}
          />
        )}
      </div>

      <ProgressPage
        isOpen={progressOpen}
        onClose={() => setProgressOpen(false)}
        history={progressHistory}
        currentRound={PROGRESS_HISTORY.at(-1)?.round ?? 1}
        language={language}
        remainingGaps={language === 'zh' ? ['完善 360 像素以下的触控探索提示。', '继续优化低功耗设备上的 WebGL 构图与纹理内存。', '为地标详情补充更完整的焦点恢复。'] : ['Refine the sub-360px touch discovery cue.', 'Tune low-power WebGL framing and texture memory.', 'Add deeper focus restoration to the landmark inspector.']}
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
