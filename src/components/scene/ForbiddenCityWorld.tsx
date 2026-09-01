import { Suspense, useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { SCENE_LANDMARKS, type SceneLandmark } from './landmarkData'
import {
  Atmosphere,
  ChineseRoof,
  CourtyardLantern,
  GateHouse,
  LandmarkBeacon,
  PalaceBuilding,
  StoneBridge,
  TreeGroves,
  WallRun,
  WaterSurface,
  WatchTower,
  point,
} from './primitives'
import type { BuildingInteractionProps, Vec3 } from './primitives'
import { registerAtlasLoadingManager } from '../../lib/atlasLoading'

export type ForbiddenCityWorldProps = {
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: readonly string[]
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onReady?: () => void
}

type LandmarkEventProps = Pick<ForbiddenCityWorldProps, "onSelect" | "onHover">

function landmarkInteraction(id: string, onSelect: ForbiddenCityWorldProps["onSelect"], onHover: ForbiddenCityWorldProps["onHover"]): BuildingInteractionProps {
  return {
    onSelect: () => onSelect(id),
    onHover: (active) => onHover(active ? id : null),
  }
}

const FORBIDDEN_CITY_MODEL_URL = import.meta.env.BASE_URL + 'models/forbidden-city-atlas.glb'

function ForbiddenCityModel({ onReady }: { onReady?: () => void }) {
  const { scene } = useGLTF(FORBIDDEN_CITY_MODEL_URL)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  useEffect(() => {
    onReady?.()
  }, [onReady, scene])

  return <primitive object={model} />
}

registerAtlasLoadingManager(THREE.DefaultLoadingManager)
useGLTF.preload(FORBIDDEN_CITY_MODEL_URL)

type CourtyardProps = {
  position: Vec3
  width: number
  depth: number
  stoneColor?: string
  borderColor?: string
  tileRows?: number
}

function Courtyard({ position, width, depth, stoneColor = '#7f6a4a', borderColor = '#b19363', tileRows = 3 }: CourtyardProps) {
  const tileLines = useMemo(() => {
    const lines: Array<{ axis: 'x' | 'z'; offset: number }> = []
    const rows = Math.max(1, tileRows)
    for (let index = 1; index < rows; index += 1) {
      lines.push({ axis: 'z', offset: -depth / 2 + (depth / rows) * index })
    }
    const columns = Math.max(2, Math.round(width / 5))
    for (let index = 1; index < columns; index += 1) {
      lines.push({ axis: 'x', offset: -width / 2 + (width / columns) * index })
    }
    return lines
  }, [depth, tileRows, width])

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[width, 0.16, depth]} />
        <meshStandardMaterial color={stoneColor} roughness={0.91} />
      </mesh>
      <mesh position={[0, 0.17, -depth / 2]}>
        <boxGeometry args={[width + 0.2, 0.08, 0.16]} />
        <meshStandardMaterial color={borderColor} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.17, depth / 2]}>
        <boxGeometry args={[width + 0.2, 0.08, 0.16]} />
        <meshStandardMaterial color={borderColor} roughness={0.78} />
      </mesh>
      <mesh position={[-width / 2, 0.17, 0]}>
        <boxGeometry args={[0.16, 0.08, depth]} />
        <meshStandardMaterial color={borderColor} roughness={0.78} />
      </mesh>
      <mesh position={[width / 2, 0.17, 0]}>
        <boxGeometry args={[0.16, 0.08, depth]} />
        <meshStandardMaterial color={borderColor} roughness={0.78} />
      </mesh>
      {tileLines.map((line, index) => (
        <mesh key={`court-line-${index}`} position={line.axis === 'x' ? [line.offset, 0.172, 0] : [0, 0.172, line.offset]}>
          <boxGeometry args={line.axis === 'x' ? [0.035, 0.018, depth - 0.18] : [width - 0.18, 0.018, 0.035]} />
          <meshStandardMaterial color="#a48a62" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function ImperialBase() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, -0.92, 0]}>
        <boxGeometry args={[69, 1.1, 53]} />
        <meshStandardMaterial color="#202b26" roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.47, 0]}>
        <boxGeometry args={[66, 0.22, 50]} />
        <meshStandardMaterial color="#5b4836" roughness={0.9} />
      </mesh>
      <WaterSurface width={64} depth={48} />
      <mesh castShadow receiveShadow position={[0, -0.08, 0]}>
        <boxGeometry args={[56.8, 0.45, 38.8]} />
        <meshStandardMaterial color="#8a6b49" roughness={0.91} />
      </mesh>
      <mesh receiveShadow position={[0, 0.16, 0]}>
        <boxGeometry args={[55.2, 0.1, 37.2]} />
        <meshStandardMaterial color="#aa8a5b" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[2.75, 0.05, 35.8]} />
        <meshStandardMaterial color="#c09c69" roughness={0.77} />
      </mesh>
      <mesh position={[0, 0.235, 0]}>
        <boxGeometry args={[54, 0.045, 1.6]} />
        <meshStandardMaterial color="#a27f52" roughness={0.82} />
      </mesh>
      {[-12.3, -6.2, 0, 6.2, 12.3].map((z, index) => (
        <mesh key={`axis-step-${index}`} position={[0, 0.27, z]}>
          <boxGeometry args={[4.25, 0.045, 0.11]} />
          <meshStandardMaterial color="#d0ad76" roughness={0.77} />
        </mesh>
      ))}
    </group>
  )
}

function OuterFortifications({ onSelect, onHover }: LandmarkEventProps) {
  return (
    <group>
      <WallRun position={point(0, 0, 19)} length={54} orientation="x" gap={8.4} />
      <WallRun position={point(0, 0, -19)} length={54} orientation="x" gap={7.5} />
      <WallRun position={point(27, 0, 0)} length={36} orientation="z" gap={5.8} />
      <WallRun position={point(-27, 0, 0)} length={36} orientation="z" gap={5.8} />
      <WatchTower position={point(26.45, 0, 18.35)} scale={0.88} />
      <WatchTower position={point(-26.45, 0, 18.35)} scale={0.88} />
      <WatchTower position={point(26.45, 0, -18.35)} scale={0.88} />
      <WatchTower position={point(-26.45, 0, -18.35)} scale={0.88} />
      <GateHouse position={point(0, 0, 18.65)} width={8.2} depth={3.2} roofColor="#ae7f36" {...landmarkInteraction("meridian-gate", onSelect, onHover)} />
      <GateHouse position={point(0, 0.34, 12.35)} width={8.8} depth={2.9} roofColor="#b78338" {...landmarkInteraction("gate-of-supreme-harmony", onSelect, onHover)} />
      <GateHouse position={point(0, 0, -18.65)} width={7.4} depth={3.2} roofColor="#ae7f36" rotation={Math.PI} />
      <GateHouse position={point(26.65, 0, 0)} width={6.6} depth={3.05} roofColor="#2d5149" rotation={Math.PI / 2} {...landmarkInteraction("east-flower-gate", onSelect, onHover)} />
      <GateHouse position={point(-26.65, 0, 0)} width={6.6} depth={3.05} roofColor="#2d5149" rotation={-Math.PI / 2} />
      <StoneBridge position={point(0, -0.02, 21.3)} width={8.2} depth={4.4} />
      <StoneBridge position={point(0, -0.02, -21.3)} width={7.6} depth={4.2} rotation={Math.PI} />
      <StoneBridge position={point(30.1, -0.02, 0)} width={7.2} depth={4.2} rotation={Math.PI / 2} />
      <StoneBridge position={point(-30.1, -0.02, 0)} width={7.2} depth={4.2} rotation={-Math.PI / 2} />
    </group>
  )
}

function OuterCourts() {
  return (
    <group>
      <Courtyard position={point(0, 0.28, 12.35)} width={21.5} depth={6.2} tileRows={2} stoneColor="#8f7650" />
      <Courtyard position={point(0, 0.28, 3.05)} width={22.6} depth={7.6} tileRows={3} stoneColor="#88704c" />
      <Courtyard position={point(0, 0.28, -4.45)} width={20.5} depth={6.4} tileRows={3} stoneColor="#806746" />
      <Courtyard position={point(0, 0.28, -10.6)} width={18.8} depth={4.8} tileRows={2} stoneColor="#796044" />
      <mesh position={[0, 0.29, 8.75]}>
        <boxGeometry args={[1.5, 0.07, 1.5]} />
        <meshStandardMaterial color="#d0ac6e" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.3, -13.65]}>
        <boxGeometry args={[1.15, 0.07, 1.15]} />
        <meshStandardMaterial color="#c49c63" roughness={0.72} />
      </mesh>
    </group>
  )
}

function CentralAxisBuildings({ onSelect, onHover }: LandmarkEventProps) {
  return (
    <group>
      <PalaceBuilding position={point(0, 0.34, 6.05)} width={9.25} depth={5.4} height={2.65} roofColor="#d3a24e" tiers={2} {...landmarkInteraction("hall-of-supreme-harmony", onSelect, onHover)} />
      <PalaceBuilding position={point(0, 0.34, 0.15)} width={6.8} depth={4.65} height={2.2} roofColor="#bf8f3d" tiers={2} {...landmarkInteraction("hall-of-central-harmony", onSelect, onHover)} />
      <PalaceBuilding position={point(0, 0.34, -5.15)} width={8.05} depth={5.05} height={2.42} roofColor="#ca983f" tiers={2} {...landmarkInteraction("hall-of-preserving-harmony", onSelect, onHover)} />
      <GateHouse position={point(0, 0.34, -8.4)} width={7.7} depth={2.7} roofColor="#9d794a" {...landmarkInteraction("gate-of-heavenly-purity", onSelect, onHover)} />
      <PalaceBuilding position={point(0, 0.34, -11.45)} width={7.2} depth={4.7} height={2.15} roofColor="#b98539" tiers={2} {...landmarkInteraction("palace-of-heavenly-purity", onSelect, onHover)} />
      <PalaceBuilding position={point(0, 0.34, -16.05)} width={6.7} depth={4.1} height={1.92} roofColor="#a97c38" tiers={1} {...landmarkInteraction("palace-of-earthly-tranquility", onSelect, onHover)} />
      <mesh castShadow position={[0, 0.5, 8.85]}>
        <boxGeometry args={[10.7, 0.3, 1.15]} />
        <meshStandardMaterial color="#c4a26e" roughness={0.86} />
      </mesh>
      <ChineseRoof width={9.8} depth={2.45} y={1.17} color="#315c50" ridgeColor="#d3a24e" />
    </group>
  )
}

const SIDE_ROWS: readonly number[] = [11.65, 6.7, 1.7, -3.25, -8.25, -13.1]
const SECONDARY_ROWS: readonly number[] = [10.3, 2.25, -5.8, -13.2]

function SidePalaces({ onSelect, onHover }: LandmarkEventProps) {
  return (
    <group>
      {[-1, 1].flatMap((side) =>
        SIDE_ROWS.map((z, index) => {
          const width = index % 2 === 0 ? 4.2 : 3.8
          const depth = index % 2 === 0 ? 2.65 : 2.4
          return (
            <PalaceBuilding
              key={`side-palace-${side}-${index}`}
              position={point(side * (index % 2 === 0 ? 12.9 : 17.35), 0.34, z)}
              width={width}
              depth={depth}
              height={index % 3 === 0 ? 1.58 : 1.42}
              roofColor={index % 2 === 0 ? '#2b554c' : '#315e53'}
              wallColor="#713129"
              trimColor="#b9843d"
              detail="light"
              accent="#dbad57"
              {...(side === 1 && index === 3 ? landmarkInteraction("hall-of-literary-brilliance", onSelect, onHover) : side === -1 && index === 1 ? landmarkInteraction("hall-of-mental-cultivation", onSelect, onHover) : {})}
            />
          )
        }),
      )}
      {[-1, 1].flatMap((side) =>
        SECONDARY_ROWS.map((z, index) => (
          <PalaceBuilding
            key={`secondary-palace-${side}-${index}`}
            position={point(side * 21.05, 0.34, z)}
            width={3.45}
            depth={2.35}
            height={1.25}
            roofColor="#254b44"
            wallColor="#692f29"
            trimColor="#a8793b"
            detail="light"
            accent="#cfa14e"
          />
        )),
      )}
    </group>
  )
}

function InnerGarden({ onSelect, onHover }: LandmarkEventProps) {
  return (
    <group>
      <Courtyard position={point(11.25, 0.28, -15.25)} width={7.8} depth={5.4} stoneColor="#53604c" borderColor="#9a875a" tileRows={2} />
      <Courtyard position={point(-11.25, 0.28, -15.25)} width={7.8} depth={5.4} stoneColor="#53604c" borderColor="#9a875a" tileRows={2} />
      <PalaceBuilding position={point(11.25, 0.38, -15.2)} width={3.55} depth={2.85} height={1.28} roofColor="#2d6656" wallColor="#74342a" trimColor="#c3974e" detail="full" tiers={1} {...landmarkInteraction("imperial-garden", onSelect, onHover)} />
      <PalaceBuilding position={point(-11.25, 0.38, -15.2)} width={3.55} depth={2.85} height={1.28} roofColor="#2d6656" wallColor="#74342a" trimColor="#c3974e" detail="full" tiers={1} />
      <ChineseRoof width={2.85} depth={2.85} y={2.55} color="#3d795f" ridgeColor="#d7a950" scale={0.8} />
      <mesh castShadow position={[11.25, 0.53, -13.45]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#65735a" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[-11.25, 0.53, -13.45]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#65735a" roughness={0.96} />
      </mesh>
      {[
        [8.5, -16.45],
        [13.95, -16.05],
        [-8.5, -16.45],
        [-13.95, -16.05],
      ].map(([x, z], index) => (
        <mesh key={`garden-rock-${index}`} castShadow position={[x, 0.54, z]} scale={[1, 0.7, 0.8]}>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color="#505b4c" roughness={0.98} />
        </mesh>
      ))}
    </group>
  )
}

function NineDragonScreen() {
  const dragons = Array.from({ length: 9 }, (_, index) => index)
  return (
    <group position={[17.9, 0.42, 4.8]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow receiveShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[0.7, 2.15, 5.8]} />
        <meshStandardMaterial color="#24585a" roughness={0.55} metalness={0.2} />
      </mesh>
      {dragons.map((index) => {
        const z = -2.2 + index * 0.55
        const color = index % 3 === 0 ? '#d86445' : index % 3 === 1 ? '#d8ae4d' : '#5fafa0'
        return (
          <mesh key={`dragon-scale-${index}`} castShadow position={[0.4, 1.35 + Math.sin(index) * 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.28, 0.09, 6, 12, Math.PI * 1.55]} />
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.25} />
          </mesh>
        )
      })}
      {[-2.5, 2.5].map((z, index) => (
        <mesh key={`screen-pillar-${index}`} castShadow position={[0, 1.35, z]}>
          <boxGeometry args={[0.9, 2.55, 0.4]} />
          <meshStandardMaterial color="#9c3b2d" roughness={0.68} />
        </mesh>
      ))}
      <ChineseRoof width={1.15} depth={6.2} y={2.7} color="#2c6c69" ridgeColor="#d9a54b" />
    </group>
  )
}

function LanternRows() {
  const lanterns: readonly Vec3[] = [
    point(-5.6, 0.36, 10.5),
    point(5.6, 0.36, 10.5),
    point(-6.2, 0.36, 2.1),
    point(6.2, 0.36, 2.1),
    point(-5.4, 0.36, -6.4),
    point(5.4, 0.36, -6.4),
    point(-4.7, 0.36, -12.35),
    point(4.7, 0.36, -12.35),
  ]
  return (
    <group>
      {lanterns.map((position, index) => (
        <CourtyardLantern key={`lantern-${index}`} position={position} active={index === 0 || index === 7} />
      ))}
    </group>
  )
}

function DecorativeAxis() {
  return (
    <group>
      {[9.1, 3.2, -3.2, -9.1, -14.9].map((z, index) => (
        <group key={`axis-marker-${index}`} position={[0, 0.42, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.21, 0.27, 0.32, 8]} />
            <meshStandardMaterial color="#b18b55" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.23, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color="#e4bd65" emissive="#8e602f" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.45, 0]}>
        <ringGeometry args={[1.1, 1.16, 48]} />
        <meshBasicMaterial color="#d5aa5d" transparent opacity={0.34} depthWrite={false} />
      </mesh>
    </group>
  )
}

function LandmarkLayer({
  landmarks,
  selectedId,
  hoveredId,
  discoveredIds,
  onSelect,
  onHover,
}: {
  landmarks: readonly SceneLandmark[]
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: readonly string[]
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const discovered = useMemo(() => new Set(discoveredIds), [discoveredIds])

  return (
    <group>
      {landmarks.map((landmark) => (
        <LandmarkBeacon
          key={landmark.id}
          landmark={landmark}
          selected={selectedId === landmark.id}
          hovered={hoveredId === landmark.id}
          discovered={discovered.has(landmark.id)}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  )
}

function ProceduralWorld({ selectedId, hoveredId, discoveredIds, onSelect, onHover }: ForbiddenCityWorldProps) {
  return (
    <group>
      <ImperialBase />
      <OuterFortifications onSelect={onSelect} onHover={onHover} />
      <OuterCourts />
      <CentralAxisBuildings onSelect={onSelect} onHover={onHover} />
      <SidePalaces onSelect={onSelect} onHover={onHover} />
      <InnerGarden onSelect={onSelect} onHover={onHover} />
      <NineDragonScreen />
      <LanternRows />
      <DecorativeAxis />
      <TreeGroves />

    </group>
  )
}


type VisitorAction = 'tour' | 'run' | 'play' | 'observe'

type VisitorPalette = {
  coat: string
  garment: string
  skin: string
  hair: string
  accent: string
}

type VisitorConfig = {
  id: string
  action: VisitorAction
  palette: keyof typeof VISITOR_PALETTES
  route: readonly (readonly [number, number])[]
  speed: number
  phase: number
  groundY: number
  scale: number
  heading?: number
}

const VISITOR_PALETTES: Record<string, VisitorPalette> = {
  jade: {
    coat: '#2f5f54',
    garment: '#d4ab5c',
    skin: '#d59f7c',
    hair: '#26231e',
    accent: '#e3c77f',
  },
  vermilion: {
    coat: '#8c4033',
    garment: '#e8c995',
    skin: '#dca681',
    hair: '#241f1a',
    accent: '#f0d073',
  },
  indigo: {
    coat: '#344c69',
    garment: '#d9bd78',
    skin: '#c99472',
    hair: '#201e1b',
    accent: '#d9a34f',
  },
  teal: {
    coat: '#287172',
    garment: '#efca87',
    skin: '#d6a17c',
    hair: '#25231e',
    accent: '#e46743',
  },
}

const VISITORS: readonly VisitorConfig[] = [
  {
    id: 'axis-tourist',
    action: 'tour',
    palette: 'jade',
    route: [
      [6.15, 15.2],
      [6.15, 10],
      [6.15, 4.5],
      [6.15, -1.8],
      [6.15, -7.7],
    ],
    speed: 1.45,
    phase: 0.6,
    groundY: 0.58,
    scale: 1.38,
  },
  {
    id: 'west-courtyard-walker',
    action: 'tour',
    palette: 'vermilion',
    route: [
      [-9.2, 15],
      [-9.2, 9.9],
      [-9.2, 4.1],
      [-9.2, -2.3],
      [-9.2, -7.2],
    ],
    speed: 1.12,
    phase: 2.7,
    groundY: 0.56,
    scale: 1.25,
  },
  {
    id: 'courier-runner',
    action: 'run',
    palette: 'indigo',
    route: [
      [-9.4, 9.35],
      [9.4, 9.35],
      [9.4, 14.8],
      [-9.4, 14.8],
    ],
    speed: 4.15,
    phase: 4.1,
    groundY: 0.62,
    scale: 1.22,
  },
  {
    id: 'garden-player',
    action: 'play',
    palette: 'teal',
    route: [
      [8.1, -12.5],
      [8.1, -17.3],
      [14.4, -17.3],
      [14.4, -14.9],
    ],
    speed: 0.76,
    phase: 1.2,
    groundY: 0.55,
    scale: 1.3,
  },
  {
    id: 'screen-observer',
    action: 'observe',
    palette: 'vermilion',
    route: [[15.7, 4.7]],
    speed: 0,
    phase: 0.4,
    groundY: 0.57,
    scale: 1.3,
    heading: -Math.PI / 2,
  },
  {
    id: 'east-garden-stroller',
    action: 'tour',
    palette: 'jade',
    route: [
      [14.7, -13.2],
      [14.7, -17.4],
      [8.2, -17.4],
      [8.2, -15],
    ],
    speed: 0.86,
    phase: 3.8,
    groundY: 0.57,
    scale: 1.12,
  },
]

const NO_RAYCAST: THREE.Object3D['raycast'] = () => undefined

type RouteSegment = {
  from: THREE.Vector3
  to: THREE.Vector3
  length: number
}

function VisitorActor({ config }: { config: VisitorConfig }) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const ballRef = useRef<THREE.Mesh>(null)
  const directionRef = useRef(new THREE.Vector3())
  const palette = VISITOR_PALETTES[config.palette]
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const route = useMemo(() => {
    const points = config.route.map(([x, z]) => new THREE.Vector3(x, 0, z))
    const segments: RouteSegment[] = []

    if (points.length > 1) {
      points.forEach((from, index) => {
        const to = points[(index + 1) % points.length]
        const length = from.distanceTo(to)
        if (length > 0.001) segments.push({ from, to, length })
      })
    }

    return {
      first: points[0] ?? new THREE.Vector3(),
      segments,
      total: segments.reduce((sum, segment) => sum + segment.length, 0),
    }
  }, [config])

  useFrame(({ clock }) => {
    const root = rootRef.current
    if (!root) return

    const elapsed = reducedMotion ? 0 : clock.elapsedTime
    const distance = route.total > 0 ? (elapsed * config.speed + config.phase) % route.total : 0
    let segment = route.segments[route.segments.length - 1]
    let remaining = distance

    for (const candidate of route.segments) {
      if (remaining <= candidate.length) {
        segment = candidate
        break
      }
      remaining -= candidate.length
    }

    if (segment) {
      const amount = Math.min(1, remaining / segment.length)
      root.position.x = THREE.MathUtils.lerp(segment.from.x, segment.to.x, amount)
      root.position.z = THREE.MathUtils.lerp(segment.from.z, segment.to.z, amount)
      directionRef.current.subVectors(segment.to, segment.from).normalize()
      root.rotation.y = Math.atan2(directionRef.current.x, directionRef.current.z)
    } else {
      root.position.x = route.first.x
      root.position.z = route.first.z
      root.rotation.y = config.heading ?? 0
    }

    const isRunning = config.action === 'run'
    const isWalking = config.action === 'tour'
    const cycleRate = isRunning ? 13 : config.action === 'play' ? 5 : 7
    const cycle = elapsed * cycleRate + config.phase
    const gait = Math.sin(cycle)
    const bounce = config.action === 'play'
      ? Math.abs(Math.sin(cycle * 0.95)) * 0.07
      : Math.abs(gait) * (isRunning ? 0.035 : 0.018)

    root.position.y = config.groundY + bounce

    const stride = isRunning ? 0.76 : isWalking ? 0.38 : config.action === 'play' ? 0.2 : 0.04
    if (leftLegRef.current) leftLegRef.current.rotation.x = gait * stride
    if (rightLegRef.current) rightLegRef.current.rotation.x = -gait * stride
    if (leftArmRef.current) leftArmRef.current.rotation.x = -gait * stride * 0.72
    if (rightArmRef.current) rightArmRef.current.rotation.x = gait * stride * 0.72

    if (bodyRef.current) {
      bodyRef.current.rotation.x = isRunning ? -0.13 : 0
      bodyRef.current.rotation.z = config.action === 'play' ? Math.sin(cycle * 0.65) * 0.06 : 0
    }
    if (headRef.current) {
      headRef.current.rotation.y = config.action === 'observe' ? Math.sin(cycle * 0.25) * 0.18 : 0
      headRef.current.rotation.z = config.action === 'play' ? Math.sin(cycle * 0.65) * 0.04 : 0
    }

    if (config.action === 'play') {
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.52 - gait * 0.16
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.82 + gait * 0.2
      if (ballRef.current) {
        ballRef.current.position.set(
          0.28 + Math.sin(cycle * 0.76) * 0.24,
          0.34 + Math.abs(Math.sin(cycle * 1.55)) * 0.29,
          0.17 + Math.cos(cycle * 0.76) * 0.18,
        )
      }
    } else if (config.action === 'observe') {
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.18
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.9
    }
  })

  return (
    <group ref={rootRef} name={config.id} scale={config.scale}>
      <mesh raycast={NO_RAYCAST} rotation={[-Math.PI / 2, 0, 0]} position={[0, -config.groundY + 0.035, 0]} scale={[0.44, 0.28, 1]}>
        <circleGeometry args={[0.46, 20]} />
        <meshBasicMaterial color="#050908" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      <mesh ref={bodyRef} raycast={NO_RAYCAST} castShadow position={[0, 0.49, 0]}>
        <boxGeometry args={[0.24, 0.37, 0.17]} />
        <meshStandardMaterial color={palette.coat} roughness={0.82} />
      </mesh>
      <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.4, 0.09]}>
        <boxGeometry args={[0.18, 0.07, 0.025]} />
        <meshStandardMaterial color={palette.garment} roughness={0.72} />
      </mesh>

      <mesh ref={headRef} raycast={NO_RAYCAST} castShadow position={[0, 0.79, 0]}>
        <icosahedronGeometry args={[0.115, 1]} />
        <meshStandardMaterial color={palette.skin} roughness={0.88} flatShading />
      </mesh>
      <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.91, 0]}>
        <coneGeometry args={[0.13, 0.09, 6]} />
        <meshStandardMaterial color={palette.hair} roughness={0.9} flatShading />
      </mesh>

      <group ref={leftArmRef} position={[-0.17, 0.61, 0]}>
        <mesh raycast={NO_RAYCAST} castShadow position={[0, -0.14, 0]}>
          <boxGeometry args={[0.065, 0.28, 0.065]} />
          <meshStandardMaterial color={palette.coat} roughness={0.82} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.17, 0.61, 0]}>
        <mesh raycast={NO_RAYCAST} castShadow position={[0, -0.14, 0]}>
          <boxGeometry args={[0.065, 0.28, 0.065]} />
          <meshStandardMaterial color={palette.coat} roughness={0.82} />
        </mesh>
      </group>

      <group ref={leftLegRef} position={[-0.07, 0.29, 0]}>
        <mesh raycast={NO_RAYCAST} castShadow position={[0, -0.14, 0]}>
          <boxGeometry args={[0.075, 0.28, 0.075]} />
          <meshStandardMaterial color={palette.garment} roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.07, 0.29, 0]}>
        <mesh raycast={NO_RAYCAST} castShadow position={[0, -0.14, 0]}>
          <boxGeometry args={[0.075, 0.28, 0.075]} />
          <meshStandardMaterial color={palette.garment} roughness={0.8} />
        </mesh>
      </group>

      {config.action === 'tour' && (
        <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.96, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.035, 12]} />
          <meshStandardMaterial color={palette.accent} roughness={0.58} metalness={0.1} />
        </mesh>
      )}

      {config.action === 'run' && (
        <mesh raycast={NO_RAYCAST} castShadow position={[-0.2, 0.47, -0.08]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.13, 0.17, 0.08]} />
          <meshStandardMaterial color={palette.accent} roughness={0.72} />
        </mesh>
      )}

      {config.action === 'play' && (
        <mesh ref={ballRef} raycast={NO_RAYCAST} castShadow position={[0.28, 0.42, 0.17]}>
          <sphereGeometry args={[0.075, 12, 8]} />
          <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.15} roughness={0.64} />
        </mesh>
      )}

      {config.action === 'observe' && (
        <group position={[0.16, 0.51, 0.15]} rotation={[-0.18, 0.14, -0.1]}>
          <mesh raycast={NO_RAYCAST} castShadow>
            <boxGeometry args={[0.18, 0.22, 0.025]} />
            <meshStandardMaterial color={palette.accent} roughness={0.58} />
          </mesh>
          <mesh raycast={NO_RAYCAST} position={[0, 0, 0.018]}>
            <boxGeometry args={[0.12, 0.16, 0.01]} />
            <meshStandardMaterial color="#25313a" emissive="#36525a" emissiveIntensity={0.35} roughness={0.42} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function VisitorsLayer() {
  return (
    <group name="visitors-layer">
      {VISITORS.map((visitor) => (
        <VisitorActor key={visitor.id} config={visitor} />
      ))}
    </group>
  )
}

export function ForbiddenCityWorld({ selectedId, hoveredId, discoveredIds, onSelect, onHover, onReady }: ForbiddenCityWorldProps) {
  return (
    <group>
      <Suspense fallback={<ProceduralWorld selectedId={selectedId} hoveredId={hoveredId} discoveredIds={discoveredIds} onSelect={onSelect} onHover={onHover} />}>
        <ForbiddenCityModel onReady={onReady} />
      </Suspense>
      <VisitorsLayer />
      <LandmarkLayer
        landmarks={SCENE_LANDMARKS}
        selectedId={selectedId}
        hoveredId={hoveredId}
        discoveredIds={discoveredIds}
        onSelect={onSelect}
        onHover={onHover}
      />
      <Atmosphere />
    </group>
  )
}
