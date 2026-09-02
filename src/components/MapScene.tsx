import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
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

export function MapScene({ selectedId, hoveredId, discoveredIds, onSelect, onHover, onResetView, resetViewSignal, language = 'en', onReady }: MapSceneProps) {
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
      <ambientLight color="#d8d8c6" intensity={1.35} />
      <hemisphereLight args={['#f0c77b', '#123b35', 1.2]} />
      <directionalLight
        castShadow
        color="#ffdda4"
        intensity={3.15}
        position={[25, 42, 21]}
        shadow-bias={-0.00018}
        shadow-mapSize={[1536, 1536]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
      />
      <directionalLight color="#79b6a7" intensity={1.2} position={[-30, 18, -24]} />
      <pointLight color="#cb8050" intensity={18} distance={62} decay={2} position={[0, 9, 12]} />
      <pointLight color="#4e9e91" intensity={12} distance={54} decay={2} position={[0, 7, -17]} />
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
