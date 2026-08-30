declare module 'three-stdlib' {
  import type { Camera, EventDispatcher, Vector3 } from 'three'

  type OrbitControlEventMap = {
    change: { type: 'change' }
    start: { type: 'start' }
    end: { type: 'end' }
  }

  export class OrbitControls extends EventDispatcher<OrbitControlEventMap> {
    constructor(object: Camera, domElement?: HTMLElement)
    object: Camera
    domElement: HTMLElement
    target: Vector3
    enabled: boolean
    enableDamping: boolean
    dampingFactor: number
    enablePan: boolean
    enableRotate: boolean
    enableZoom: boolean
    screenSpacePanning: boolean
    rotateSpeed: number
    panSpeed: number
    zoomSpeed: number
    minPolarAngle: number
    maxPolarAngle: number
    minZoom: number
    maxZoom: number
    mouseButtons: Record<string, number>
    touches: Record<string, number>
    update(): boolean
    reset(): void
    dispose(): void
  }
}
