import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type AnimalKind = 'dog' | 'cat' | 'rat'

type AnimalPalette = {
  body: string
  belly: string
  muzzle: string
  ear: string
  accent: string
  eye: string
}

type AnimalConfig = {
  id: string
  kind: AnimalKind
  palette: keyof typeof ANIMAL_PALETTES
  route: readonly (readonly [number, number])[]
  speed: number
  phase: number
  groundY: number
  scale: number
  barkEvery?: number
}

type AnimalRouteSegment = {
  from: THREE.Vector3
  to: THREE.Vector3
  length: number
}

const NO_RAYCAST: THREE.Object3D['raycast'] = () => undefined

const ANIMAL_PALETTES: Record<string, AnimalPalette> = {
  courtyardDog: {
    body: '#9b7049',
    belly: '#d5ad7b',
    muzzle: '#d7b58b',
    ear: '#67452f',
    accent: '#d6a94f',
    eye: '#151312',
  },
  gardenDog: {
    body: '#5d4a3f',
    belly: '#a88768',
    muzzle: '#c39b79',
    ear: '#392b28',
    accent: '#c98b47',
    eye: '#151312',
  },
  silverCat: {
    body: '#6c7777',
    belly: '#a9b2ac',
    muzzle: '#c2b49b',
    ear: '#514f50',
    accent: '#a4d2c0',
    eye: '#d8c66e',
  },
  gingerCat: {
    body: '#bd7044',
    belly: '#e0aa6b',
    muzzle: '#e0b889',
    ear: '#74402e',
    accent: '#f0c86b',
    eye: '#2a1711',
  },
  palaceRat: {
    body: '#6c625d',
    belly: '#a19387',
    muzzle: '#b9a596',
    ear: '#8e746a',
    accent: '#c58d58',
    eye: '#151212',
  },
}

const ANIMALS: readonly AnimalConfig[] = [
  {
    id: 'courtyard-dog',
    kind: 'dog',
    palette: 'courtyardDog',
    route: [
      [-8.9, 10.9],
      [-6.5, 10.9],
      [-6.5, 13.2],
      [-8.9, 13.2],
    ],
    speed: 0.72,
    phase: 0.8,
    groundY: 0.57,
    scale: 0.72,
    barkEvery: 8.2,
  },
  {
    id: 'garden-dog',
    kind: 'dog',
    palette: 'gardenDog',
    route: [
      [16.2, -12.2],
      [18.4, -12.2],
      [18.4, -10.6],
      [16.2, -10.6],
    ],
    speed: 0.58,
    phase: 3.6,
    groundY: 0.57,
    scale: 0.68,
    barkEvery: 10.4,
  },
  {
    id: 'garden-cat',
    kind: 'cat',
    palette: 'silverCat',
    route: [
      [8.6, -14.2],
      [10.5, -14.2],
      [10.5, -17.1],
      [8.6, -17.1],
    ],
    speed: 1.92,
    phase: 1.35,
    groundY: 0.58,
    scale: 0.64,
  },
  {
    id: 'garden-rat',
    kind: 'rat',
    palette: 'palaceRat',
    route: [
      [8.6, -14.2],
      [10.5, -14.2],
      [10.5, -17.1],
      [8.6, -17.1],
    ],
    speed: 1.42,
    phase: 0.05,
    groundY: 0.56,
    scale: 0.42,
  },
  {
    id: 'east-cat',
    kind: 'cat',
    palette: 'gingerCat',
    route: [
      [15.4, 8.7],
      [18.7, 8.7],
      [18.7, 10.2],
      [15.4, 10.2],
    ],
    speed: 1.74,
    phase: 4.25,
    groundY: 0.57,
    scale: 0.61,
  },
  {
    id: 'east-rat',
    kind: 'rat',
    palette: 'palaceRat',
    route: [
      [15.4, 8.7],
      [18.7, 8.7],
      [18.7, 10.2],
      [15.4, 10.2],
    ],
    speed: 1.26,
    phase: 0.3,
    groundY: 0.56,
    scale: 0.4,
  },
]

function useBarkAudio(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.AudioContext) return undefined

    const unlock = () => {
      try {
        const context = contextRef.current ?? new window.AudioContext()
        contextRef.current = context
        if (context.state === 'suspended') void context.resume()
      } catch {
        // Audio is an enhancement; visual barking still works when audio is unavailable.
      }
    }

    window.addEventListener('pointerdown', unlock, { capture: true })
    window.addEventListener('keydown', unlock, { capture: true })

    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true })
      window.removeEventListener('keydown', unlock, { capture: true })
      const context = contextRef.current
      contextRef.current = null
      if (context) void context.close()
    }
  }, [])

  return useCallback(() => {
    if (!enabledRef.current) return
    const context = contextRef.current
    if (!context || context.state !== 'running') return

    const now = context.currentTime
    const carrier = context.createOscillator()
    const barkBody = context.createOscillator()
    const gain = context.createGain()
    const filter = context.createBiquadFilter()

    carrier.type = 'sawtooth'
    carrier.frequency.setValueAtTime(210, now)
    carrier.frequency.exponentialRampToValueAtTime(105, now + 0.16)
    barkBody.type = 'square'
    barkBody.frequency.setValueAtTime(96, now)
    barkBody.frequency.exponentialRampToValueAtTime(58, now + 0.14)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1150, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.018)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19)

    carrier.connect(gain)
    barkBody.connect(gain)
    gain.connect(filter)
    filter.connect(context.destination)
    carrier.start(now)
    barkBody.start(now)
    carrier.stop(now + 0.2)
    barkBody.stop(now + 0.2)
  }, [])
}

function AnimalActor({ config, onBark }: { config: AnimalConfig; onBark: () => void }) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const tailRef = useRef<THREE.Group>(null)
  const leftFrontLegRef = useRef<THREE.Group>(null)
  const rightFrontLegRef = useRef<THREE.Group>(null)
  const leftBackLegRef = useRef<THREE.Group>(null)
  const rightBackLegRef = useRef<THREE.Group>(null)
  const barkBurstRef = useRef<THREE.Mesh>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef(0)
  const barkLatchRef = useRef(false)
  const directionRef = useRef(new THREE.Vector3())
  const palette = ANIMAL_PALETTES[config.palette]
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const route = useMemo(() => {
    const points = config.route.map(([x, z]) => new THREE.Vector3(x, 0, z))
    const segments: AnimalRouteSegment[] = []

    points.forEach((from, index) => {
      const to = points[(index + 1) % points.length]
      const length = from.distanceTo(to)
      if (length > 0.001) segments.push({ from, to, length })
    })

    return {
      first: points[0] ?? new THREE.Vector3(),
      segments,
      total: segments.reduce((sum, segment) => sum + segment.length, 0),
    }
  }, [config])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    root.traverse((object) => {
      object.renderOrder = object.name === 'animal-shadow' ? 8 : 13
      if (!(object instanceof THREE.Mesh) || object.name === 'animal-shadow') return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        material.depthTest = true
        material.depthWrite = !material.transparent
      })
    })
  }, [])

  useFrame((_, delta) => {
    elapsedRef.current += delta
    const elapsed = elapsedRef.current * (reducedMotion ? 0.24 : 1)
    const root = rootRef.current
    if (!root) return

    const distance = route.total > 0 ? (elapsed * config.speed + config.phase) % route.total : 0
    let segment: AnimalRouteSegment | null = route.segments[route.segments.length - 1] ?? null
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
    }

    const stride = config.kind === 'cat' ? 1.2 : config.kind === 'rat' ? 0.9 : 0.66
    const gaitRate = config.kind === 'cat' ? 8 : config.kind === 'rat' ? 10 : 5.2
    const gait = Math.sin(elapsed * gaitRate + config.phase)
    const isBarking = config.kind === 'dog' && ((elapsed + config.phase * 0.8) % (config.barkEvery ?? 8.5)) < 0.42

    if (isBarking && !barkLatchRef.current) {
      barkLatchRef.current = true
      onBark()
    }
    if (!isBarking) barkLatchRef.current = false

    if (cueRef.current) cueRef.current.dataset.active = config.kind === 'cat' ? 'true' : String(isBarking)
    if (barkBurstRef.current) {
      const burst = isBarking ? 1 + (Math.sin(elapsed * 12) + 1) * 0.2 : 0.001
      barkBurstRef.current.scale.setScalar(burst)
      barkBurstRef.current.rotation.z = elapsed * 2.4
    }

    root.position.y = config.groundY + Math.abs(gait) * (config.kind === 'cat' ? 0.075 : config.kind === 'rat' ? 0.045 : 0.025)
    root.scale.setScalar(config.scale * (1 + Math.sin(elapsed * 0.75 + config.phase) * 0.025))
    root.rotation.z = gait * (config.kind === 'cat' ? 0.085 : config.kind === 'rat' ? 0.1 : 0.045)

    if (bodyRef.current) {
      bodyRef.current.rotation.x = config.kind === 'cat' ? Math.sin(elapsed * 0.7) * 0.08 : 0
      bodyRef.current.rotation.z = gait * (config.kind === 'rat' ? 0.08 : 0.035)
    }
    if (headRef.current) {
      headRef.current.rotation.x = isBarking ? -0.34 : config.kind === 'cat' ? Math.sin(elapsed * 0.8 + 1) * 0.12 : 0
      headRef.current.rotation.y = config.kind === 'cat' ? Math.sin(elapsed * 0.6) * 0.18 : 0
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = (config.kind === 'cat' ? -0.58 : 0.18) + Math.sin(elapsed * (config.kind === 'cat' ? 3.5 : 2.8) + config.phase) * 0.28
      tailRef.current.rotation.y = Math.sin(elapsed * 1.7 + config.phase) * 0.12
    }

    if (leftFrontLegRef.current) leftFrontLegRef.current.rotation.x = gait * stride
    if (rightFrontLegRef.current) rightFrontLegRef.current.rotation.x = -gait * stride
    if (leftBackLegRef.current) leftBackLegRef.current.rotation.x = -gait * stride
    if (rightBackLegRef.current) rightBackLegRef.current.rotation.x = gait * stride
  })

  const legPositions = [
    [-0.11, 0.22, 0.1],
    [0.11, 0.22, 0.1],
    [-0.11, 0.22, -0.1],
    [0.11, 0.22, -0.1],
  ] as const

  return (
    <group ref={rootRef} name={config.id} scale={config.scale}>
      <mesh name="animal-shadow" raycast={NO_RAYCAST} rotation={[-Math.PI / 2, 0, 0]} position={[0, -config.groundY + 0.035, 0]} scale={[0.5, 0.32, 1]}>
        <circleGeometry args={[0.34, 16]} />
        <meshBasicMaterial color="#050908" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      <mesh ref={barkBurstRef} raycast={NO_RAYCAST} position={[0, 0.62, 0.16]}>
        <torusGeometry args={[0.22, 0.02, 8, 20]} />
        <meshBasicMaterial color={palette.accent} transparent opacity={0.6} depthWrite={false} />
      </mesh>

      <mesh ref={bodyRef} raycast={NO_RAYCAST} castShadow position={[0, 0.34, 0]}>
        <boxGeometry args={config.kind === 'rat' ? [0.25, 0.16, 0.18] : [0.38, 0.23, 0.26]} />
        <meshStandardMaterial color={palette.body} roughness={0.88} />
      </mesh>
      <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.36, 0.08]}>
        <boxGeometry args={config.kind === 'rat' ? [0.18, 0.1, 0.1] : [0.3, 0.11, 0.17]} />
        <meshStandardMaterial color={palette.belly} roughness={0.86} />
      </mesh>
      <mesh ref={headRef} raycast={NO_RAYCAST} castShadow position={[0, 0.48, 0.2]}>
        <sphereGeometry args={config.kind === 'rat' ? [0.1, 8, 6] : [0.14, 10, 8]} />
        <meshStandardMaterial color={palette.body} roughness={0.84} flatShading />
      </mesh>
      {config.kind !== 'rat' && (
        <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.45, 0.32]}>
          <boxGeometry args={[config.kind === 'cat' ? 0.14 : 0.18, 0.08, 0.1]} />
          <meshStandardMaterial color={palette.muzzle} roughness={0.9} />
        </mesh>
      )}
      {config.kind !== 'rat' && (
        <>
          <mesh raycast={NO_RAYCAST} castShadow position={[-0.1, 0.57, 0.17]} rotation={[0, 0, config.kind === 'cat' ? -0.18 : -0.34]}>
            <coneGeometry args={[config.kind === 'cat' ? 0.07 : 0.055, config.kind === 'cat' ? 0.17 : 0.12, 4]} />
            <meshStandardMaterial color={palette.ear} roughness={0.86} />
          </mesh>
          <mesh raycast={NO_RAYCAST} castShadow position={[0.1, 0.57, 0.17]} rotation={[0, 0, config.kind === 'cat' ? 0.18 : 0.34]}>
            <coneGeometry args={[config.kind === 'cat' ? 0.07 : 0.055, config.kind === 'cat' ? 0.17 : 0.12, 4]} />
            <meshStandardMaterial color={palette.ear} roughness={0.86} />
          </mesh>
        </>
      )}
      {config.kind !== 'rat' && (
        <>
          <mesh raycast={NO_RAYCAST} castShadow position={[-0.055, 0.51, 0.315]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <meshBasicMaterial color={palette.eye} />
          </mesh>
          <mesh raycast={NO_RAYCAST} castShadow position={[0.055, 0.51, 0.315]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <meshBasicMaterial color={palette.eye} />
          </mesh>
          <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.33, 0.27]}>
            <boxGeometry args={[0.23, 0.025, 0.035]} />
            <meshStandardMaterial color={palette.accent} roughness={0.58} metalness={0.12} />
          </mesh>
        </>
      )}
      {config.kind === 'rat' && (
        <>
          <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.48, 0.29]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <meshBasicMaterial color={palette.eye} />
          </mesh>
          <mesh raycast={NO_RAYCAST} castShadow position={[0, 0.48, 0.34]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <meshBasicMaterial color={palette.muzzle} />
          </mesh>
        </>
      )}

      {legPositions.map(([x, y, z], index) => {
        const legRef = index === 0 ? leftFrontLegRef : index === 1 ? rightFrontLegRef : index === 2 ? leftBackLegRef : rightBackLegRef
        return (
          <group key={'animal-leg-' + index} ref={legRef} position={[x, y, z]}>
            <mesh raycast={NO_RAYCAST} castShadow position={[0, -0.1, 0]}>
              <boxGeometry args={[config.kind === 'rat' ? 0.045 : 0.065, config.kind === 'rat' ? 0.16 : 0.2, config.kind === 'rat' ? 0.045 : 0.06]} />
              <meshStandardMaterial color={palette.belly} roughness={0.88} />
            </mesh>
          </group>
        )
      })}

      <group ref={tailRef} position={[0, 0.37, -0.2]}>
        <mesh raycast={NO_RAYCAST} castShadow position={[0, config.kind === 'rat' ? 0.05 : 0.17, config.kind === 'rat' ? -0.08 : -0.02]} rotation={[config.kind === 'rat' ? Math.PI / 2 : 0, 0, config.kind === 'rat' ? 0 : -0.1]}>
          <cylinderGeometry args={[config.kind === 'rat' ? 0.012 : 0.028, config.kind === 'rat' ? 0.008 : 0.045, config.kind === 'rat' ? 0.28 : 0.36, 8]} />
          <meshStandardMaterial color={palette.ear} roughness={0.9} />
        </mesh>
      </group>

      {config.kind !== 'rat' && (
        <Html occlude position={[0, 0.98, 0]} center zIndexRange={[16, 0]} style={{ pointerEvents: 'none' }}>
          <div ref={cueRef} className={'animal-action-label animal-action-label--' + config.kind} data-active={config.kind === 'cat' ? 'true' : 'false'}>
            <span className="animal-action-label__dot" />
            {config.kind === 'cat' ? 'CHASE RAT' : 'BARK'}
          </div>
        </Html>
      )}
    </group>
  )
}

export function AnimalsLayer({ soundEnabled = true }: { soundEnabled?: boolean }) {
  const bark = useBarkAudio(soundEnabled)

  return (
    <group name="animals-layer">
      {ANIMALS.map((animal) => (
        <AnimalActor key={animal.id} config={animal} onBark={bark} />
      ))}
    </group>
  )
}
