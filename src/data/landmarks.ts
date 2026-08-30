export type LandmarkCategory =
  | 'gate'
  | 'outer-court'
  | 'inner-court'
  | 'side-court'
  | 'garden'

export type LandmarkStatus = 'discovered' | 'available' | 'locked'

export interface Landmark {
  id: string
  title: string
  chineseName: string
  category: LandmarkCategory
  /** [east-west, elevation, south-north]; north is positive on the atlas map. */
  position: [number, number, number]
  scale: number
  color: string
  status: LandmarkStatus
  description: string
  era: string
  fact: string
  accent: string
  discoveryLabel?: string
  featured?: boolean
}

/** Approximate scene coordinates keep the imperial axis legible while opening side-court paths. */
export const LANDMARKS: Landmark[] = [
  {
    id: 'meridian-gate',
    title: 'Meridian Gate',
    chineseName: '午门',
    category: 'gate',
    position: [0, 0.52, 17.05],
    scale: 2.3,
    color: '#c85c46',
    status: 'discovered',
    description: 'Five openings mark the ceremonial threshold where the imperial route begins.',
    era: 'Ming dynasty · Yongle era, 1420',
    fact: 'Its central passage was reserved for the emperor, making the gate a precise lesson in courtly rank.',
    accent: '#efb05c',
    discoveryLabel: 'ORIGIN POINT',
    featured: true,
  },
  {
    id: 'gate-of-supreme-harmony',
    title: 'Gate of Supreme Harmony',
    chineseName: '太和门',
    category: 'gate',
    position: [0, 0.62, 12.35],
    scale: 1.55,
    color: '#b95743',
    status: 'discovered',
    description: 'Beyond the Golden Water bridges, the court gathers before the Three Great Halls.',
    era: 'Ming dynasty · Yongle era, 1420',
    fact: 'It is the principal gate of the Outer Court and the first major threshold north of Meridian Gate.',
    accent: '#d8924b',
    discoveryLabel: 'FIRST THRESHOLD',
  },
  {
    id: 'hall-of-supreme-harmony',
    title: 'Hall of Supreme Harmony',
    chineseName: '太和殿',
    category: 'outer-court',
    position: [0, 1.15, 6.1],
    scale: 2.8,
    color: '#d8a94f',
    status: 'discovered',
    description: 'The highest roof on the axis rises above a three-tiered marble terrace.',
    era: 'Ming foundation · Qing reconstruction, Kangxi era',
    fact: 'The largest hall in the Forbidden City, it was reserved for the empire’s most important ceremonies.',
    accent: '#f2c96f',
    discoveryLabel: 'CEREMONIAL CORE',
    featured: true,
  },
  {
    id: 'hall-of-central-harmony',
    title: 'Hall of Central Harmony',
    chineseName: '中和殿',
    category: 'outer-court',
    position: [0, 1.05, 0.15],
    scale: 1.35,
    color: '#bd8f4a',
    status: 'available',
    description: 'An intimate square hall poised between ceremony and the long imperial terrace.',
    era: 'Ming dynasty · Yongle era, 1420',
    fact: 'The emperor paused here to prepare himself before continuing to the larger halls for a state rite.',
    accent: '#dfb664',
  },
  {
    id: 'hall-of-preserving-harmony',
    title: 'Hall of Preserving Harmony',
    chineseName: '保和殿',
    category: 'outer-court',
    position: [0, 1.12, -5.15],
    scale: 1.7,
    color: '#b97952',
    status: 'available',
    description: 'The northern crown of the Outer Court holds the axis before it enters private space.',
    era: 'Ming foundation · Qing reconstruction',
    fact: 'During the Qing dynasty, the final stage of the Palace Examination was held in this hall.',
    accent: '#e1a667',
    discoveryLabel: 'OUTER COURT',
  },
  {
    id: 'gate-of-heavenly-purity',
    title: 'Gate of Heavenly Purity',
    chineseName: '乾清门',
    category: 'inner-court',
    position: [0, 0.62, -8.4],
    scale: 1.45,
    color: '#9d794a',
    status: 'available',
    description: 'An austere gate frames the turn from public spectacle to the emperor’s household.',
    era: 'Ming dynasty · Yongle era, 1420',
    fact: 'It marks the threshold of the Inner Court, with the Rear Three Palaces immediately beyond.',
    accent: '#c99a5a',
    discoveryLabel: 'INNER COURT',
  },
  {
    id: 'palace-of-heavenly-purity',
    title: 'Palace of Heavenly Purity',
    chineseName: '乾清宫',
    category: 'inner-court',
    position: [0, 0.96, -11.55],
    scale: 2.05,
    color: '#b94f3f',
    status: 'available',
    description: 'Once a residence, its raised throne room made domestic space part of statecraft.',
    era: 'Ming foundation · Qing court residence',
    fact: 'Ming and early Qing emperors lived here; from the Yongzheng reign, daily imperial work shifted west.',
    accent: '#e07b50',
    discoveryLabel: 'IMPERIAL RESIDENCE',
    featured: true,
  },
  {
    id: 'hall-of-union',
    title: 'Hall of Union',
    chineseName: '交泰殿',
    category: 'inner-court',
    position: [0, 0.72, -13.2],
    scale: 1.25,
    color: '#c4954d',
    status: 'available',
    description: 'Between two palaces, a compact hall gives the Inner Court its symbolic balance.',
    era: 'Ming foundation · Qing imperial interior',
    fact: 'Under the Qing, the hall kept the imperial seals and a water clock within the Rear Three Palaces.',
    accent: '#e6bf68',
  },
  {
    id: 'palace-of-earthly-tranquility',
    title: 'Palace of Earthly Tranquility',
    chineseName: '坤宁宫',
    category: 'inner-court',
    position: [0, 0.9, -16.05],
    scale: 1.9,
    color: '#a94a3d',
    status: 'locked',
    description: 'Behind the Hall of Union, the empress’s palace completes the Rear Three Palaces.',
    era: 'Ming foundation · Qing reconfiguration, 1655',
    fact: 'In the Qing period, its eastern warm chamber served as the imperial wedding chamber.',
    accent: '#d87650',
    discoveryLabel: 'NEXT CHAMBER',
  },
  {
    id: 'imperial-garden',
    title: 'Imperial Garden',
    chineseName: '御花园',
    category: 'garden',
    position: [10.7, 0.48, -14.75],
    scale: 1.75,
    color: '#6f9a7c',
    status: 'available',
    description: 'Cypress, rockery, pavilions, and framed views close the northern route in miniature.',
    era: 'Ming dynasty · Yongle era, completed 1417',
    fact: 'Qin’an Hall anchors the garden’s central line, where cultivated landscape meets ritual geometry.',
    accent: '#9dc49a',
    discoveryLabel: 'NORTHERN CLOSE',
  },
  {
    id: 'hall-of-literary-brilliance',
    title: 'Hall of Literary Brilliance',
    chineseName: '文华殿',
    category: 'side-court',
    position: [12.9, 0.9, -3.25],
    scale: 1.55,
    color: '#7e9a91',
    status: 'available',
    description: 'On the eastern flank, scholarship softens the rigid geometry of the ceremonial court.',
    era: 'Ming dynasty · Yongle era, 1420',
    fact: 'The hall was associated with imperial lectures and the scholarly life of the eastern court.',
    accent: '#a7c8b4',
    discoveryLabel: 'EASTERN SIDE COURT',
  },
  {
    id: 'hall-of-mental-cultivation',
    title: 'Hall of Mental Cultivation',
    chineseName: '养心殿',
    category: 'side-court',
    position: [-12.9, 0.9, 6.7],
    scale: 1.5,
    color: '#6d9b8a',
    status: 'available',
    description: 'West of the axis, this working palace reveals the court behind the ceremony.',
    era: 'Ming foundation · Yongzheng reign, 1723',
    fact: 'From 1723 onward, it became the principal residence and work center of Qing emperors.',
    accent: '#8fc1ad',
    discoveryLabel: 'WESTERN SIDE COURT',
    featured: true,
  },
]
