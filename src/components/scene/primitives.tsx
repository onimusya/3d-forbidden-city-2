import { Html, Instance, Instances, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneLandmark } from './landmarkData'

export type Vec3 = [number, number, number]

export type BuildingInteractionProps = {
  onSelect?: () => void
  onHover?: (active: boolean) => void
}

export const point = (x: number, y: number, z: number): Vec3 => [x, y, z]

type RoofProps = {
  width: number
  depth: number
  y: number
  color: string
  ridgeColor?: string
  scale?: number
}

export function ChineseRoof({ width, depth, y, color, ridgeColor = '#d4a34e', scale = 1 }: RoofProps) {
  const roofWidth = width * scale
  const roofDepth = depth * scale
  const roofHeight = Math.max(0.38, Math.min(0.72, Math.max(roofWidth, roofDepth) * 0.075))
  const cornerX = roofWidth * 0.48
  const cornerZ = roofDepth * 0.48

  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow position={[0, -0.08, 0]}>
        <boxGeometry args={[roofWidth * 1.14, 0.16, roofDepth * 1.14]} />
        <meshStandardMaterial color={color} roughness={0.64} metalness={0.1} />
      </mesh>
      <mesh castShadow position={[0, roofHeight * 0.1, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, roofDepth / roofWidth]}>
        <coneGeometry args={[roofWidth * 0.57, roofHeight, 4]} />
        <meshStandardMaterial color={color} roughness={0.58} metalness={0.12} flatShading />
      </mesh>
      <mesh castShadow position={[0, roofHeight * 0.55, 0]}>
        <boxGeometry args={[roofWidth * 0.57, 0.1, 0.18]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.45} metalness={0.34} />
      </mesh>
      {[
        [-cornerX, cornerZ],
        [cornerX, cornerZ],
        [-cornerX, -cornerZ],
        [cornerX, -cornerZ],
      ].map(([x, z], index) => (
        <mesh key={`roof-finial-${index}`} position={[x, 0.08, z]} castShadow>
          <sphereGeometry args={[Math.max(0.08, roofWidth * 0.027), 6, 4]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.46} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

type PalaceBuildingProps = {
  position: Vec3
  width: number
  depth: number
  height: number
  roofColor: string
  wallColor?: string
  trimColor?: string
  tiers?: 1 | 2 | 3
  detail?: 'full' | 'light'
  accent?: string
} & BuildingInteractionProps

export function PalaceBuilding({
  position,
  width,
  depth,
  height,
  roofColor,
  wallColor = '#7f3328',
  trimColor = '#d99e48',
  tiers = 1,
  detail = 'full',
  accent = '#e3b25c',
  onSelect,
  onHover,
}: PalaceBuildingProps) {
  const columnPositions: readonly [number, number][] = [
    [-width * 0.34, -depth * 0.34],
    [width * 0.34, -depth * 0.34],
    [-width * 0.34, depth * 0.34],
    [width * 0.34, depth * 0.34],
  ]
  const windowOffsets = [-0.25, 0, 0.25]
  const tiersData = Array.from({ length: tiers }, (_, index) => {
    const factor = 1 - index * 0.17
    return {
      width: width * factor,
      depth: depth * factor,
      y: 0.9 + height + index * 0.48,
    }
  })

  return (
    <group
      position={position}
      onPointerOver={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onHover?.(true)
      }}
      onPointerOut={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onHover?.(false)
      }}
      onClick={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onSelect()
      }}
    >
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[width * 1.2, 0.4, depth * 1.2]} />
        <meshStandardMaterial color="#95805d" roughness={0.87} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[width * 1.04, 0.16, depth * 1.04]} />
        <meshStandardMaterial color={trimColor} roughness={0.75} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.86 + height * 0.5, 0]}>
        <boxGeometry args={[width * 0.78, height, depth * 0.7]} />
        <meshStandardMaterial color={wallColor} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 0.88 + height * 0.08, depth * 0.37]}>
        <boxGeometry args={[width * 0.82, 0.11, 0.13]} />
        <meshStandardMaterial color={trimColor} roughness={0.56} metalness={0.16} />
      </mesh>
      <mesh castShadow position={[0, 0.88 + height * 0.08, -depth * 0.37]}>
        <boxGeometry args={[width * 0.82, 0.11, 0.13]} />
        <meshStandardMaterial color={trimColor} roughness={0.56} metalness={0.16} />
      </mesh>
      {columnPositions.map(([x, z], index) => (
        <mesh key={`column-${index}`} castShadow position={[x, 0.86 + height * 0.5, z]}>
          <boxGeometry args={[Math.max(0.16, width * 0.055), height * 1.04, Math.max(0.16, depth * 0.055)]} />
          <meshStandardMaterial color={trimColor} roughness={0.56} metalness={0.16} />
        </mesh>
      ))}
      {detail === 'full' &&
        windowOffsets.flatMap((offset, index) => [
          <mesh key={`front-window-${index}`} position={[width * offset, 0.98 + height * 0.55, depth * 0.359]}>
            <boxGeometry args={[Math.max(0.24, width * 0.1), Math.max(0.22, height * 0.22), 0.025]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} roughness={0.44} />
          </mesh>,
          <mesh key={`back-window-${index}`} position={[width * offset, 0.98 + height * 0.55, -depth * 0.359]}>
            <boxGeometry args={[Math.max(0.24, width * 0.1), Math.max(0.22, height * 0.22), 0.025]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} roughness={0.44} />
          </mesh>,
        ])}
      {tiersData.map((tier, index) => (
        <ChineseRoof
          key={`tier-${index}`}
          width={tier.width}
          depth={tier.depth}
          y={tier.y}
          color={roofColor}
          ridgeColor={accent}
        />
      ))}
      {tiers > 1 && (
        <mesh castShadow position={[0, 0.9 + height + (tiers - 1) * 0.48 + 0.55, 0]}>
          <cylinderGeometry args={[0.07, 0.1, 0.55, 6]} />
          <meshStandardMaterial color={accent} roughness={0.42} metalness={0.42} />
        </mesh>
      )}
    </group>
  )
}

type WallRunProps = {
  position: Vec3
  length: number
  orientation: 'x' | 'z'
  gap?: number
  height?: number
  color?: string
  trimColor?: string
}

export function WallRun({
  position,
  length,
  orientation,
  gap = 0,
  height = 1.7,
  color = '#743228',
  trimColor = '#c68c40',
}: WallRunProps) {
  const segmentLength = gap > 0 ? (length - gap) / 2 : length
  const segmentOffset = gap > 0 ? (length + gap) / 4 : 0
  const crenellationCount = Math.max(3, Math.floor(segmentLength / 2.1))
  const segments = gap > 0 ? [-1, 1] : [0]

  return (
    <group position={position}>
      {segments.map((side) => {
        const segmentCenter = side * segmentOffset
        const segmentPosition: Vec3 = orientation === 'x' ? [segmentCenter, height / 2, 0] : [0, height / 2, segmentCenter]
        const segmentSize: Vec3 = orientation === 'x' ? [segmentLength, height, 0.72] : [0.72, height, segmentLength]
        const capPosition: Vec3 = orientation === 'x' ? [segmentCenter, height + 0.07, 0] : [0, height + 0.07, segmentCenter]
        const capSize: Vec3 = orientation === 'x' ? [segmentLength + 0.2, 0.14, 0.94] : [0.94, 0.14, segmentLength + 0.2]

        return (
          <group key={`wall-segment-${side}`}>
            <mesh castShadow receiveShadow position={segmentPosition}>
              <boxGeometry args={segmentSize} />
              <meshStandardMaterial color={color} roughness={0.84} />
            </mesh>
            <mesh castShadow position={capPosition}>
              <boxGeometry args={capSize} />
              <meshStandardMaterial color={trimColor} roughness={0.6} metalness={0.15} />
            </mesh>
            {Array.from({ length: crenellationCount }, (_, index) => {
              const progress = (index + 0.5) / crenellationCount
              const offset = -segmentLength / 2 + progress * segmentLength
              const battlementPosition: Vec3 =
                orientation === 'x' ? [segmentCenter + offset, height + 0.31, 0] : [0, height + 0.31, segmentCenter + offset]
              const battlementSize: Vec3 = orientation === 'x' ? [0.44, 0.48, 0.96] : [0.96, 0.48, 0.44]
              return (
                <mesh key={`battlement-${side}-${index}`} castShadow position={battlementPosition}>
                  <boxGeometry args={battlementSize} />
                  <meshStandardMaterial color={color} roughness={0.78} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

type GateHouseProps = {
  position: Vec3
  rotation?: number
  width?: number
  depth?: number
  roofColor?: string
} & BuildingInteractionProps

export function GateHouse({
  position,
  rotation = 0,
  width = 7.8,
  depth = 3.25,
  roofColor = '#b78338',
  onSelect,
  onHover,
}: GateHouseProps) {
  const columnX = [-width * 0.38, 0, width * 0.38]

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onPointerOver={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onHover?.(true)
      }}
      onPointerOut={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onHover?.(false)
      }}
      onClick={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onSelect()
      }}
    >
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[width * 1.1, 0.5, depth * 1.18]} />
        <meshStandardMaterial color="#95805d" roughness={0.85} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.12, 0]}>
        <boxGeometry args={[width * 0.84, 1.55, depth * 0.82]} />
        <meshStandardMaterial color="#773027" roughness={0.8} />
      </mesh>
      {columnX.map((x, index) => (
        <mesh key={`gate-column-${index}`} castShadow position={[x, 1.14, depth * 0.43]}>
          <boxGeometry args={[0.3, 1.75, 0.3]} />
          <meshStandardMaterial color="#cc9344" roughness={0.56} metalness={0.18} />
        </mesh>
      ))}
      <mesh position={[0, 0.87, depth * 0.425]}>
        <boxGeometry args={[width * 0.34, 1.08, 0.035]} />
        <meshStandardMaterial color="#1b2522" roughness={0.72} />
      </mesh>
      {[-0.11, 0, 0.11].map((offset, index) => (
        <mesh key={`gate-door-${index}`} position={[width * offset, 0.84, depth * 0.45]}>
          <boxGeometry args={[0.055, 0.94, 0.05]} />
          <meshStandardMaterial color="#d7a84e" roughness={0.42} metalness={0.3} />
        </mesh>
      ))}
      <ChineseRoof width={width * 1.12} depth={depth * 1.25} y={2.02} color={roofColor} ridgeColor="#e2ae53" />
      <mesh castShadow position={[0, 2.53, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.42, 6]} />
        <meshStandardMaterial color="#e2ae53" roughness={0.4} metalness={0.4} />
      </mesh>
    </group>
  )
}

type WatchTowerProps = {
  position: Vec3
  scale?: number
}

export function WatchTower({ position, scale = 1 }: WatchTowerProps) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[2.45, 1.6, 2.45]} />
        <meshStandardMaterial color="#703027" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 1.66, 0]}>
        <boxGeometry args={[2.75, 0.15, 2.75]} />
        <meshStandardMaterial color="#bd883d" roughness={0.64} metalness={0.12} />
      </mesh>
      <ChineseRoof width={3.3} depth={3.3} y={1.88} color="#2b554d" ridgeColor="#d8a54d" />
      <ChineseRoof width={2.45} depth={2.45} y={2.34} color="#23473f" ridgeColor="#d8a54d" scale={0.74} />
    </group>
  )
}

type BridgeProps = {
  position: Vec3
  rotation?: number
  width?: number
  depth?: number
}

export function StoneBridge({ position, rotation = 0, width = 7.5, depth = 4.6 }: BridgeProps) {
  const plankCount = 6

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[width, 0.36, depth]} />
        <meshStandardMaterial color="#aa8d68" roughness={0.92} />
      </mesh>
      {Array.from({ length: plankCount }, (_, index) => {
        const z = -depth / 2 + (index + 0.5) * (depth / plankCount)
        return (
          <mesh key={`bridge-plank-${index}`} castShadow position={[0, 0.31, z]}>
            <boxGeometry args={[width * 0.96, 0.09, depth / plankCount - 0.08]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#c4a77c' : '#9b7d5c'} roughness={0.88} />
          </mesh>
        )
      })}
      {[-1, 1].map((side) => (
        <group key={`bridge-rail-${side}`} position={[side * width * 0.42, 0.75, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 1.05, depth]} />
            <meshStandardMaterial color="#7b5e43" roughness={0.8} />
          </mesh>
          {[-depth * 0.42, 0, depth * 0.42].map((z, index) => (
            <mesh key={`bridge-post-${side}-${index}`} castShadow position={[0, -0.18, z]}>
              <cylinderGeometry args={[0.11, 0.14, 0.74, 6]} />
              <meshStandardMaterial color="#9a774e" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

type WaterProps = {
  width: number
  depth: number
}

export function WaterSurface({ width, depth }: WaterProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.opacity = 0.57 + Math.sin(clock.elapsedTime * 0.42) * 0.045
    }
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#174f50"
          emissive="#0b2b2a"
          emissiveIntensity={0.42}
          transparent
          opacity={0.57}
          depthWrite={false}
          roughness={0.22}
          metalness={0.18}
        />
      </mesh>
      {[
        [-26, -17, 1.2],
        [26, 16, 1.05],
        [-28, 8, 0.9],
        [28, -8, 1.15],
      ].map(([x, z, radius], index) => (
        <mesh key={`water-ripple-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.29, z]}>
          <ringGeometry args={[radius * 0.65, radius, 32]} />
          <meshBasicMaterial color="#6fbbb0" transparent opacity={0.15} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

type TreePoint = {
  x: number
  z: number
  scale: number
}

const TREE_POINTS: readonly TreePoint[] = [
  { x: -22.8, z: -14.8, scale: 1.12 },
  { x: -20.8, z: -13.1, scale: 0.82 },
  { x: -23.1, z: -10.6, scale: 0.95 },
  { x: -20.9, z: 13.9, scale: 1.02 },
  { x: -22.9, z: 11.8, scale: 0.82 },
  { x: -18.8, z: 15.2, scale: 0.78 },
  { x: 22.5, z: -14.2, scale: 1.1 },
  { x: 20.5, z: -12.8, scale: 0.84 },
  { x: 23.2, z: -9.9, scale: 0.92 },
  { x: 21.8, z: 14.3, scale: 0.95 },
  { x: 23.5, z: 11.8, scale: 0.8 },
  { x: 18.7, z: 15.2, scale: 0.84 },
  { x: -15.8, z: -14.3, scale: 0.78 },
  { x: -14.2, z: -12.2, scale: 0.65 },
  { x: 15.8, z: -15.1, scale: 0.86 },
  { x: 13.9, z: -12.3, scale: 0.68 },
  { x: -15.8, z: 13.2, scale: 0.76 },
  { x: 15.9, z: 13.4, scale: 0.72 },
]

export function TreeGroves() {
  const trees = useMemo(() => TREE_POINTS, [])

  return (
    <group>
      <Instances limit={trees.length} range={trees.length} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1.18, 6]} />
        <meshStandardMaterial color="#553923" roughness={0.95} />
        {trees.map((tree, index) => (
          <Instance
            key={`trunk-${index}`}
            position={[tree.x, 0.55, tree.z]}
            scale={[tree.scale, tree.scale, tree.scale]}
          />
        ))}
      </Instances>
      <Instances limit={trees.length} range={trees.length} castShadow>
        <icosahedronGeometry args={[0.67, 0]} />
        <meshStandardMaterial color="#244c3d" roughness={0.96} />
        {trees.map((tree, index) => (
          <Instance
            key={`canopy-${index}`}
            position={[tree.x, 1.37 * tree.scale, tree.z]}
            scale={[tree.scale, tree.scale * 1.15, tree.scale]}
          />
        ))}
      </Instances>
      <Instances limit={trees.length} range={trees.length} castShadow>
        <icosahedronGeometry args={[0.39, 0]} />
        <meshStandardMaterial color="#3d7454" roughness={0.92} />
        {trees.map((tree, index) => (
          <Instance
            key={`canopy-highlight-${index}`}
            position={[tree.x + 0.12 * tree.scale, 1.7 * tree.scale, tree.z - 0.1 * tree.scale]}
            scale={[tree.scale, tree.scale, tree.scale]}
          />
        ))}
      </Instances>
    </group>
  )
}

type LanternProps = {
  position: Vec3
  active?: boolean
}

export function CourtyardLantern({ position, active = false }: LanternProps) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.055, 0.09, 1.12, 6]} />
        <meshStandardMaterial color="#6d4b33" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]}>
        <boxGeometry args={[0.33, 0.18, 0.33]} />
        <meshStandardMaterial color="#c08c3d" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.03, 0]}>
        <boxGeometry args={[0.23, 0.23, 0.23]} />
        <meshStandardMaterial
          color={active ? '#f4cf72' : '#d89c42'}
          emissive={active ? '#f4cf72' : '#8c552a'}
          emissiveIntensity={active ? 1.45 : 0.28}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh castShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[0.34, 0.11, 0.34]} />
        <meshStandardMaterial color="#8d693f" roughness={0.76} />
      </mesh>
      {active && <pointLight color="#e7b65c" intensity={0.55} distance={3.2} decay={2} position={[0, 1, 0]} />}
    </group>
  )
}

const LANDMARK_HIT_SIZES: Readonly<Record<string, Vec3>> = {
  "meridian-gate": [8.6, 4.2, 4.8],
  "gate-of-supreme-harmony": [9.2, 3.8, 3.6],
  "hall-of-supreme-harmony": [10.4, 5, 6.2],
  "hall-of-central-harmony": [7.4, 4.4, 5.2],
  "hall-of-preserving-harmony": [8.7, 4.6, 5.8],
  "gate-of-heavenly-purity": [7.8, 3.8, 3.6],
  "palace-of-heavenly-purity": [8.2, 4.6, 5.4],
  "hall-of-union": [6.2, 3.8, 4.2],
  "palace-of-earthly-tranquility": [7.6, 4.2, 4.8],
  "imperial-garden": [6.4, 3.6, 5.2],
  "hall-of-literary-brilliance": [5.4, 3.5, 3.4],
  "hall-of-mental-cultivation": [5.4, 3.5, 3.4],
  "nine-dragon-wall": [5, 3.5, 2.8],
  "east-flower-gate": [6, 3.8, 4.2],
}

type LandmarkBeaconProps = {
  landmark: SceneLandmark
  selected: boolean
  hovered: boolean
  discovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function LandmarkBeacon({
  landmark,
  selected,
  hovered,
  discovered,
  onSelect,
  onHover,
}: LandmarkBeaconProps) {
  const beaconRef = useRef<THREE.Group | null>(null)
  const haloRef = useRef<THREE.Mesh | null>(null)
  const starRef = useRef<THREE.Group | null>(null)
  const phase = useMemo(() => {
    let total = 0
    for (const character of landmark.id) total += character.charCodeAt(0)
    return (total % 19) / 5
  }, [landmark.id])
  const active = selected || hovered
  const showLabel = active
  const accent = active || discovered ? landmark.accent : landmark.color
  const anchor: Vec3 = [landmark.position[0], Math.max(0.32, landmark.position[1]), landmark.position[2]]
  const markerScale = Math.max(0.7, landmark.scale)
  const hitSize = LANDMARK_HIT_SIZES[landmark.id] ?? [Math.max(4.2, markerScale * 2.8), 3.8, Math.max(3.4, markerScale * 2.3)]
  const starShape = useMemo(() => {
    const shape = new THREE.Shape()
    const points = 8
    for (let index = 0; index < points; index += 1) {
      const angle = Math.PI / 2 + (index / points) * Math.PI * 2
      const radius = index % 2 === 0 ? 0.48 : 0.16
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (index === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()
    return shape
  }, [])

  useFrame(({ clock }, delta) => {
    const pulse = (Math.sin(clock.elapsedTime * 2.1 + phase) + 1) / 2
    if (beaconRef.current) {
      const nextScale = active ? 1.02 + pulse * 0.1 : 0.96 + pulse * 0.045
      beaconRef.current.scale.setScalar(nextScale)
      beaconRef.current.rotation.y += delta * (active ? 0.34 : 0.16)
    }
    if (haloRef.current) {
      haloRef.current.scale.setScalar((active ? 1.08 : 1) + pulse * (active ? 0.18 : 0.08))
      haloRef.current.rotation.z += delta * 0.26
    }
    if (starRef.current) {
      starRef.current.scale.setScalar((active ? 1.08 : 0.86) + pulse * (active ? 0.16 : 0.09))
      starRef.current.rotation.y += delta * (active ? 1.35 : 0.52)
      starRef.current.rotation.z = Math.sin(clock.elapsedTime * 1.4 + phase) * (active ? 0.12 : 0.07)
    }
  })

  return (
    <group position={anchor}>
      <group ref={beaconRef} scale={markerScale}>
        <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.62, 0.7, 32]} />
          <meshBasicMaterial color={accent} transparent opacity={active ? 0.78 : 0.38} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {discovered && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
            <ringGeometry args={[0.86, 0.9, 32]} />
            <meshBasicMaterial color={landmark.accent} transparent opacity={0.48} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.11, 1.04, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 1.1 : 0.34} roughness={0.42} metalness={0.24} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 1.55 : 0.56} roughness={0.28} metalness={0.28} />
        </mesh>
        <mesh position={[0, 1.47, 0]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshBasicMaterial color="#fff1bb" />
        </mesh>
        <group ref={starRef} position={[0, 2.08, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
            <shapeGeometry args={[starShape]} />
            <meshBasicMaterial color={accent} transparent opacity={active ? 0.96 : 0.62} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} renderOrder={2}>
            <ringGeometry args={[0.54, 0.58, 24]} />
            <meshBasicMaterial color={accent} transparent opacity={active ? 0.72 : 0.24} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <mesh
        position={[0, 1.45, 0]}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover(landmark.id)
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onHover(null)
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(landmark.id)
        }}
      >
        <boxGeometry args={hitSize} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      {active && <pointLight color={accent} intensity={selected ? 1.25 : 0.65} distance={3.8} decay={2} position={[0, 1.3, 0]} />}
      {showLabel && (
        <Html position={[0, 2.45, 0]} center zIndexRange={[30, 0]} pointerEvents="none">
          <div
            style={{
              minWidth: 148,
              padding: '9px 11px 10px',
              border: `1px solid ${accent}99`,
              borderRadius: 2,
              background: 'rgba(13, 17, 16, 0.9)',
              boxShadow: `0 8px 24px rgba(0,0,0,.3), 0 0 18px ${accent}25`,
              color: '#e9e7dd',
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            <div style={{ fontFamily: 'DM Mono, ui-monospace, monospace', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
              {landmark.category} · {landmark.status}
            </div>
            <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, lineHeight: 1.1 }}>{landmark.title}</div>
            <div style={{ color: '#9aa39d', fontSize: 11, marginTop: 4 }}>{landmark.chineseName}</div>
            <div style={{ color: accent, fontFamily: "DM Mono, ui-monospace, monospace", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 7 }}>Click to inspect ↗</div>
          </div>
        </Html>
      )}
    </group>
  )
}

export function Atmosphere() {
  return <Sparkles count={58} scale={[70, 16, 54]} size={1.45} speed={0.17} noise={1.1} color="#d8b56b" opacity={0.34} />
}
