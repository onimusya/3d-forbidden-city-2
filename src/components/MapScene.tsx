import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { LANDMARKS } from '../data/landmarks'
import { ForbiddenCityWorld } from './scene/ForbiddenCityWorld'

export type MapSceneProps = {
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: string[]
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onResetView?: () => void
  resetViewSignal?: number
  language?: 'en' | 'zh'
  timeOfDay?: 'day' | 'night'
  onReady?: () => void
}

const BASE_MAP_WIDTH = 86
const BASE_MAP_HEIGHT = 68
const MAX_SCENE_ZOOM = 28

function getResponsiveZoom(width: number, height: number) {
  const widthZoom = width / BASE_MAP_WIDTH
  const heightZoom = height / BASE_MAP_HEIGHT
  return Math.min(14.5, Math.max(5.2, Math.min(widthZoom, heightZoom)))
}

const DAY_PHASE = 0.8
const NIGHT_PHASE = DAY_PHASE + Math.PI
const SCENE_RAYCAST_DISABLED: THREE.Object3D["raycast"] = () => undefined

function DayNightRig({ timeOfDay }: { timeOfDay: "day" | "night" }) {
  const { scene } = useThree()
  const phaseRef = useRef(timeOfDay === "night" ? NIGHT_PHASE : DAY_PHASE)
  const targetPhaseRef = useRef(phaseRef.current)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const hemisphereRef = useRef<THREE.HemisphereLight>(null)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const moonRef = useRef<THREE.DirectionalLight>(null)
  const warmPointRef = useRef<THREE.PointLight>(null)
  const coolPointRef = useRef<THREE.PointLight>(null)
  const sunOrbRef = useRef<THREE.Mesh>(null)
  const moonOrbRef = useRef<THREE.Mesh>(null)
  const sunMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const moonMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const dayBackground = useMemo(() => new THREE.Color("#0d1110"), [])
  const nightBackground = useMemo(() => new THREE.Color("#08111f"), [])
  const dayFog = useMemo(() => new THREE.Color("#0d1110"), [])
  const nightFog = useMemo(() => new THREE.Color("#08111f"), [])
  const dayAmbientColor = useMemo(() => new THREE.Color("#d8d8c6"), [])
  const nightAmbientColor = useMemo(() => new THREE.Color("#617898"), [])
  const daySkyColor = useMemo(() => new THREE.Color("#f0c77b"), [])
  const nightSkyColor = useMemo(() => new THREE.Color("#294d78"), [])
  const dayGroundColor = useMemo(() => new THREE.Color("#123b35"), [])
  const nightGroundColor = useMemo(() => new THREE.Color("#071c2a"), [])
  const daySunColor = useMemo(() => new THREE.Color("#ffdda4"), [])
  const nightSunColor = useMemo(() => new THREE.Color("#496b91"), [])
  const sunOrbColor = useMemo(() => new THREE.Color("#ffd27c"), [])
  const moonOrbColor = useMemo(() => new THREE.Color("#b8d8f2"), [])

  useEffect(() => {
    targetPhaseRef.current = timeOfDay === "night" ? NIGHT_PHASE : DAY_PHASE
  }, [timeOfDay])

  useFrame((_, delta) => {
    phaseRef.current = THREE.MathUtils.damp(phaseRef.current, targetPhaseRef.current, 1.35, delta)
    const phase = phaseRef.current
    const sunElevation = Math.sin(phase)
    const dayLevel = THREE.MathUtils.smoothstep(sunElevation, -0.22, 0.32)
    const sunX = Math.cos(phase) * 34
    const sunZ = Math.sin(phase) * 28
    const sunY = sunElevation * 38 + 16

    if (sunRef.current) {
      sunRef.current.position.set(sunX, sunY, sunZ)
      sunRef.current.intensity = THREE.MathUtils.lerp(0.06, 3.15, dayLevel)
      sunRef.current.color.lerpColors(nightSunColor, daySunColor, dayLevel)
    }
    if (moonRef.current) {
      moonRef.current.position.set(-sunX, 16 - sunElevation * 38, -sunZ)
      moonRef.current.intensity = THREE.MathUtils.lerp(0.9, 0.06, dayLevel)
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.44, 1.35, dayLevel)
      ambientRef.current.color.lerpColors(nightAmbientColor, dayAmbientColor, dayLevel)
    }
    if (hemisphereRef.current) {
      hemisphereRef.current.intensity = THREE.MathUtils.lerp(0.78, 1.2, dayLevel)
      hemisphereRef.current.color.lerpColors(nightSkyColor, daySkyColor, dayLevel)
      hemisphereRef.current.groundColor.lerpColors(nightGroundColor, dayGroundColor, dayLevel)
    }
    if (warmPointRef.current) warmPointRef.current.intensity = THREE.MathUtils.lerp(23, 12, dayLevel)
    if (coolPointRef.current) coolPointRef.current.intensity = THREE.MathUtils.lerp(14, 7, dayLevel)

    const background = scene.background
    if (background instanceof THREE.Color) background.lerpColors(nightBackground, dayBackground, dayLevel)
    if (scene.fog instanceof THREE.Fog) scene.fog.color.lerpColors(nightFog, dayFog, dayLevel)

    if (sunOrbRef.current && sunMaterialRef.current) {
      sunOrbRef.current.position.set(sunX, sunY, sunZ)
      sunOrbRef.current.scale.setScalar(0.86 + dayLevel * 0.14)
      sunMaterialRef.current.opacity = dayLevel * 0.9
      sunMaterialRef.current.color.copy(sunOrbColor)
      sunOrbRef.current.visible = dayLevel > 0.015
    }
    if (moonOrbRef.current && moonMaterialRef.current) {
      moonOrbRef.current.position.set(-sunX, 16 - sunElevation * 38, -sunZ)
      moonOrbRef.current.scale.setScalar(0.76 + (1 - dayLevel) * 0.14)
      moonMaterialRef.current.opacity = (1 - dayLevel) * 0.82
      moonMaterialRef.current.color.copy(moonOrbColor)
      moonOrbRef.current.visible = dayLevel < 0.985
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} color="#d8d8c6" intensity={1.35} />
      <hemisphereLight ref={hemisphereRef} args={["#f0c77b", "#123b35", 1.2]} />
      <directionalLight
        ref={sunRef}
        castShadow
        color="#ffdda4"
        intensity={3.15}
        position={[24, 43, 20]}
        shadow-bias={-0.00018}
        shadow-mapSize={[1536, 1536]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
      />
      <directionalLight ref={moonRef} color="#8eb7dd" intensity={0.06} position={[-24, -11, -20]} />
      <pointLight ref={warmPointRef} color="#cb8050" intensity={18} distance={62} decay={2} position={[0, 9, 12]} />
      <pointLight ref={coolPointRef} color="#4e9e91" intensity={12} distance={54} decay={2} position={[0, 7, -17]} />
      <mesh ref={sunOrbRef} raycast={SCENE_RAYCAST_DISABLED} renderOrder={3} position={[24, 43, 20]}>
        <sphereGeometry args={[0.78, 16, 10]} />
        <meshBasicMaterial ref={sunMaterialRef} color="#ffd27c" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={moonOrbRef} raycast={SCENE_RAYCAST_DISABLED} renderOrder={3} position={[-24, -11, -20]}>
        <sphereGeometry args={[0.68, 16, 10]} />
        <meshBasicMaterial ref={moonMaterialRef} color="#b8d8f2" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

function ResponsiveCamera() {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    camera.zoom = getResponsiveZoom(size.width, size.height)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}

type SceneControlsProps = Pick<MapSceneProps, 'onResetView' | 'resetViewSignal' | 'language'> & {
  selectedId: string | null
}

type CameraFocus = {
  fromPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  fromZoom: number
  toPosition: THREE.Vector3
  toTarget: THREE.Vector3
  toZoom: number
  elapsed: number
  duration: number
}

function SceneControls({ selectedId, onResetView, resetViewSignal, language = 'en' }: SceneControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const focusRef = useRef<CameraFocus | null>(null)
  const previousSelectedId = useRef(selectedId)
  const hudAnchorRef = useRef<THREE.Group | null>(null)
  const { camera, size } = useThree()
  const responsiveZoom = getResponsiveZoom(size.width, size.height)

  useEffect(() => {
    if (selectedId === previousSelectedId.current) return
    previousSelectedId.current = selectedId

    const landmark = selectedId ? LANDMARKS.find((candidate) => candidate.id === selectedId) : null
    const controls = controlsRef.current
    if (!landmark || !controls) return

    const fromTarget = controls.target.clone()
    const fromPosition = camera.position.clone()
    const offset = fromPosition.clone().sub(fromTarget)
    const focusTarget = new THREE.Vector3(...landmark.position)

    // Keep the selected building above the mobile details sheet.
    if (size.width <= 820) focusTarget.y -= 25
    else focusTarget.y -= 0.6

    const toPosition = focusTarget.clone().add(offset)
    const currentZoom = camera instanceof THREE.OrthographicCamera ? camera.zoom : responsiveZoom
    const toZoom = THREE.MathUtils.clamp(Math.max(currentZoom, responsiveZoom * 1.28), responsiveZoom, MAX_SCENE_ZOOM)
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    focusRef.current = {
      fromPosition,
      fromTarget,
      fromZoom: currentZoom,
      toPosition,
      toTarget: focusTarget,
      toZoom,
      elapsed: 0,
      duration: reducedMotion ? 0.12 : 0.78,
    }
    controls.enabled = false
  }, [camera, responsiveZoom, selectedId, size.width])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    hudAnchorRef.current?.position.copy(controls.target)

    const focus = focusRef.current
    if (!focus) return

    focus.elapsed = Math.min(focus.duration, focus.elapsed + delta)
    const progress = focus.duration === 0 ? 1 : focus.elapsed / focus.duration
    const eased = 1 - Math.pow(1 - progress, 3)
    camera.position.lerpVectors(focus.fromPosition, focus.toPosition, eased)
    controls.target.lerpVectors(focus.fromTarget, focus.toTarget, eased)

    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = THREE.MathUtils.lerp(focus.fromZoom, focus.toZoom, eased)
      camera.updateProjectionMatrix()
    }

    controls.update()
    if (progress >= 1) {
      focusRef.current = null
      controls.enabled = true
    }
  })

  const resetView = useCallback(() => {
    focusRef.current = null
    if (controlsRef.current) controlsRef.current.enabled = true
    controlsRef.current?.reset()
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = responsiveZoom
      camera.updateProjectionMatrix()
    }
    onResetView?.()
  }, [camera, onResetView, responsiveZoom])

  const previousResetSignal = useRef(resetViewSignal)
  useEffect(() => {
    if (resetViewSignal === undefined || resetViewSignal === previousResetSignal.current) return
    previousResetSignal.current = resetViewSignal
    focusRef.current = null
    if (controlsRef.current) controlsRef.current.enabled = true
    controlsRef.current?.reset()
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = responsiveZoom
      camera.updateProjectionMatrix()
    }
  }, [camera, resetViewSignal, responsiveZoom])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        enablePan
        enableRotate
        enableZoom
        screenSpacePanning
        rotateSpeed={0.54}
        panSpeed={0.68}
        zoomSpeed={0.72}
        minPolarAngle={0.48}
        maxPolarAngle={1.47}
        minZoom={4.7}
        maxZoom={MAX_SCENE_ZOOM}
        target={[0, 0.1, 0]}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <group ref={hudAnchorRef}>
        <Html fullscreen pointerEvents="none" zIndexRange={[20, 0]} className="scene-control-overlay">
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', color: '#e9e7dd' }}>
          <div
            style={{
              position: 'absolute',
              display: 'none',
              gap: 5,
              fontFamily: 'DM Mono, ui-monospace, monospace',
              fontSize: 9,
              lineHeight: 1.25,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(233,231,221,.68)',
              userSelect: 'none',
            }}
          >
            <span style={{ color: '#e2ae53' }}>Imperial axis</span>
            <span style={{ color: 'rgba(233,231,221,.42)' }}>Beijing · 1420—1911</span>
          </div>
          <div
            style={{
              position: 'absolute',
              display: 'none',
              gap: 4,
              textAlign: 'right',
              fontFamily: 'DM Mono, ui-monospace, monospace',
              fontSize: 8,
              lineHeight: 1.3,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: 'rgba(233,231,221,.48)',
              userSelect: 'none',
            }}
          >
            <span>Drag · orbit</span>
            <span>Right drag · pan</span>
            <span>Wheel / pinch · zoom</span>
          </div>
          <button
            className="scene-reset"
            aria-label={language === 'zh' ? '重置视角' : 'Reset view'}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              resetView()
            }}
            style={{
              position: 'absolute',
              right: 18,
              top: 16,
              pointerEvents: 'auto',
              cursor: 'pointer',
              border: '1px solid rgba(226,174,83,.42)',
              borderRadius: 2,
              padding: '8px 10px',
              background: 'rgba(13,17,16,.7)',
              color: '#e2ae53',
              fontFamily: 'DM Mono, ui-monospace, monospace',
              fontSize: 9,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(12px)',
            }}
          >
            {language === 'zh' ? '重置视角' : 'Reset view'}
          </button>
        </div>
        </Html>
      </group>
    </>
  )
}

export function MapScene({ selectedId, hoveredId, discoveredIds, onSelect, onHover, onResetView, resetViewSignal, language = 'en', timeOfDay = 'day', onReady }: MapSceneProps) {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [43, 37, 43], zoom: 12, near: 0.1, far: 220 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => onHover(null)}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    >
      <color attach="background" args={['#0d1110']} />
      <fog attach="fog" args={['#0d1110', 48, 132]} />
      <DayNightRig timeOfDay={timeOfDay} />
      <ResponsiveCamera />
      <SceneControls selectedId={selectedId} onResetView={onResetView} resetViewSignal={resetViewSignal} language={language} />
      <ForbiddenCityWorld
        selectedId={selectedId}
        hoveredId={hoveredId}
        discoveredIds={discoveredIds}
        onSelect={onSelect}
        onHover={onHover}
        onReady={onReady}
      />
    </Canvas>
  )
}

export default MapScene
