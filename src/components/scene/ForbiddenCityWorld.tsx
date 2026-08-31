import { Suspense, useMemo } from "react"
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

export type ForbiddenCityWorldProps = {
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: readonly string[]
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

type LandmarkEventProps = Pick<ForbiddenCityWorldProps, "onSelect" | "onHover">

function landmarkInteraction(id: string, onSelect: ForbiddenCityWorldProps["onSelect"], onHover: ForbiddenCityWorldProps["onHover"]): BuildingInteractionProps {
  return {
    onSelect: () => onSelect(id),
    onHover: (active) => onHover(active ? id : null),
  }
}

const FORBIDDEN_CITY_MODEL_URL = import.meta.env.BASE_URL + 'models/forbidden-city-atlas.glb'

function ForbiddenCityModel() {
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

  return <primitive object={model} />
}

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


export function ForbiddenCityWorld({ selectedId, hoveredId, discoveredIds, onSelect, onHover }: ForbiddenCityWorldProps) {
  return (
    <group>
      <Suspense fallback={<ProceduralWorld selectedId={selectedId} hoveredId={hoveredId} discoveredIds={discoveredIds} onSelect={onSelect} onHover={onHover} />}>
        <ForbiddenCityModel />
      </Suspense>
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
