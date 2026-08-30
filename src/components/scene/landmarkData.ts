export type SceneLandmark = {
  readonly id: string
  readonly title: string
  readonly chineseName: string
  readonly category: string
  readonly position: readonly [number, number, number]
  readonly scale: number
  readonly color: string
  readonly status: string
  readonly description: string
  readonly era: string
  readonly fact: string
  readonly accent: string
}

const FALLBACK_LANDMARKS: readonly SceneLandmark[] = [
  {
    id: 'meridian-gate',
    title: 'Meridian Gate',
    chineseName: '午门',
    category: 'Gate',
    position: [0, 0.52, 17.05],
    scale: 1.25,
    color: '#d86445',
    status: 'OPEN',
    description: 'The ceremonial southern threshold of the imperial axis.',
    era: 'Ming dynasty · 1420',
    fact: 'Its five openings once separated the routes of the court by rank.',
    accent: '#e2ae53',
  },
  {
    id: 'hall-supreme-harmony',
    title: 'Hall of Supreme Harmony',
    chineseName: '太和殿',
    category: 'Ceremony',
    position: [0, 1.15, 6.1],
    scale: 1.65,
    color: '#d3a04c',
    status: 'DISCOVERED',
    description: 'The largest hall in the palace complex, reserved for state ceremonies.',
    era: 'Ming dynasty · 1420',
    fact: 'The hall stands on a three-tiered marble terrace at the heart of the city.',
    accent: '#f0c969',
  },
  {
    id: 'hall-central-harmony',
    title: 'Hall of Central Harmony',
    chineseName: '中和殿',
    category: 'Ceremony',
    position: [0, 1.05, 0.15],
    scale: 1.22,
    color: '#b98a3c',
    status: 'LOCKED',
    description: 'A quiet square hall where emperors prepared before formal rites.',
    era: 'Ming dynasty · 1420',
    fact: 'Its compact plan made it a place for pause between two grand ceremonies.',
    accent: '#d6b260',
  },
  {
    id: 'hall-preserving-harmony',
    title: 'Hall of Preserving Harmony',
    chineseName: '保和殿',
    category: 'Ceremony',
    position: [0, 1.12, -5.15],
    scale: 1.35,
    color: '#c39140',
    status: 'LOCKED',
    description: 'The northern hall of the outer court and the final stop on the main axis.',
    era: 'Ming dynasty · 1420',
    fact: 'Imperial banquets and the final stage of the civil examinations were held here.',
    accent: '#efc25f',
  },
  {
    id: 'palace-heavenly-purity',
    title: 'Palace of Heavenly Purity',
    chineseName: '乾清宫',
    category: 'Residence',
    position: [0, 0.96, -11.55],
    scale: 1.38,
    color: '#c4913e',
    status: 'LOCKED',
    description: 'The emperor’s principal residence in the inner court.',
    era: 'Ming dynasty · 1420',
    fact: 'Its name invokes the clear, active principle of heaven in classical cosmology.',
    accent: '#e7bd5e',
  },
  {
    id: 'palace-earthly-tranquility',
    title: 'Palace of Earthly Tranquility',
    chineseName: '坤宁宫',
    category: 'Residence',
    position: [0, 0.9, -16.05],
    scale: 1.2,
    color: '#aa7d37',
    status: 'LOCKED',
    description: 'The central residence of the empress within the inner court.',
    era: 'Ming dynasty · 1420',
    fact: 'Together with the northern palace, it completes the inner court’s central trio.',
    accent: '#d5a849',
  },
  {
    id: 'imperial-garden',
    title: 'Imperial Garden',
    chineseName: '御花园',
    category: 'Garden',
    position: [10.7, 0.48, -14.75],
    scale: 1.08,
    color: '#78b2a1',
    status: 'LOCKED',
    description: 'A compact northern garden shaped by pines, rockeries, and pavilions.',
    era: 'Ming dynasty · 1420',
    fact: 'Its ancient cypress trees are arranged to make the garden feel older than the palace.',
    accent: '#b6dfb7',
  },
  {
    id: 'hall-mental-cultivation',
    title: 'Hall of Mental Cultivation',
    chineseName: '养心殿',
    category: 'Residence',
    position: [-12.3, 0.75, -8.35],
    scale: 1.12,
    color: '#9e7539',
    status: 'LOCKED',
    description: 'A western inner-court hall that became an important working residence.',
    era: 'Qing dynasty · 1722',
    fact: 'Several Qing emperors governed from this comparatively intimate compound.',
    accent: '#d6ad5e',
  },
  {
    id: 'nine-dragon-wall',
    title: 'Nine-Dragon Wall',
    chineseName: '九龙壁',
    category: 'Detail',
    position: [17.8, 0.62, 4.8],
    scale: 1.08,
    color: '#3f8e88',
    status: 'LOCKED',
    description: 'A glazed screen whose nine dragons guard a side court.',
    era: 'Qing dynasty · 1773',
    fact: 'The imperial number nine appears in the dragon count and the wall’s decorative rhythm.',
    accent: '#6cd6c0',
  },
  {
    id: 'east-flower-gate',
    title: 'Gate of Eastern Floral Splendour',
    chineseName: '东华门',
    category: 'Gate',
    position: [26.2, 0.52, 0],
    scale: 1.02,
    color: '#d86445',
    status: 'LOCKED',
    description: 'The eastern gate, aligned with the quiet side of the palace city.',
    era: 'Ming dynasty · 1420',
    fact: 'The eastern and western gates mirror one another across the central axis.',
    accent: '#e2ae53',
  },
]

type LandmarkModule = {
  readonly LANDMARKS?: readonly SceneLandmark[]
}

type ViteImportMeta = ImportMeta & {
  glob: <T>(pattern: string, options: { eager: true }) => Record<string, T>
}

const landmarkModules = (import.meta as ViteImportMeta).glob<LandmarkModule>('../../data/landmarks.ts', {
  eager: true,
})

const externalLandmarks = Object.values(landmarkModules).find(
  (module): module is LandmarkModule & { readonly LANDMARKS: readonly SceneLandmark[] } =>
    Array.isArray(module.LANDMARKS),
)

/**
 * The production data module is picked up when it is present. The local set
 * keeps the scene useful in isolation while the data layer is being staged.
 */
export const SCENE_LANDMARKS: readonly SceneLandmark[] = externalLandmarks?.LANDMARKS ?? FALLBACK_LANDMARKS
