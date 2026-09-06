import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Three's browser exporter uses FileReader for its final ArrayBuffer conversion.
// Node 22 provides Blob but not FileReader, so keep the export reproducible in CI.
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((result) => {
        this.result = result
        this.onloadend?.()
      })
    }
  }
}

const rootDir = resolve(import.meta.dirname, '..')
const outputPath = resolve(rootDir, 'public/models/forbidden-city-atlas.glb')

const scene = new THREE.Scene()
scene.name = 'Forbidden City Atlas'

const materials = new Map()
const geometries = new Map()

function material(color, { roughness = 0.8, metalness = 0, emissive = null } = {}) {
  const key = `${color}|${roughness}|${metalness}|${emissive ?? ''}`
  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        ...(emissive ? { emissive, emissiveIntensity: 0.12 } : {}),
      }),
    )
  }
  return materials.get(key)
}

function geometry(key, create) {
  if (!geometries.has(key)) geometries.set(key, create())
  return geometries.get(key)
}

function meshBox(size, color, position, parent, options = {}) {
  const [width, height, depth] = size
  const mesh = new THREE.Mesh(geometry(`box:${width}:${height}:${depth}`, () => new THREE.BoxGeometry(width, height, depth)), material(color, options))
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function meshCone(radius, height, segments, color, position, parent, options = {}) {
  const mesh = new THREE.Mesh(geometry(`cone:${radius}:${height}:${segments}`, () => new THREE.ConeGeometry(radius, height, segments)), material(color, options))
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function meshCylinder(radiusTop, radiusBottom, height, segments, color, position, parent, options = {}) {
  const mesh = new THREE.Mesh(
    geometry(`cylinder:${radiusTop}:${radiusBottom}:${height}:${segments}`, () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments)),
    material(color, options),
  )
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function meshGeometry(customGeometry, color, position, parent, options = {}) {
  const mesh = new THREE.Mesh(customGeometry, material(color, options))
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function createHipRoofGeometry(width, depth, height, eaveLift) {
  const halfWidth = width / 2
  const halfDepth = depth / 2
  const ridgeHalf = Math.max(0.32, halfWidth - halfDepth * 0.36)
  const positions = []
  const indices = []

  const addTriangle = (a, b, c) => {
    const offset = positions.length / 3
    positions.push(...a, ...b, ...c)
    indices.push(offset, offset + 1, offset + 2)
  }
  const addQuad = (a, b, c, d) => {
    const offset = positions.length / 3
    positions.push(...a, ...b, ...c, ...d)
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3)
  }

  const frontLeft = [-halfWidth, eaveLift, -halfDepth]
  const frontRight = [halfWidth, eaveLift, -halfDepth]
  const backLeft = [-halfWidth, eaveLift, halfDepth]
  const backRight = [halfWidth, eaveLift, halfDepth]
  const ridgeLeft = [-ridgeHalf, height, 0]
  const ridgeRight = [ridgeHalf, height, 0]

  addQuad(frontLeft, ridgeLeft, ridgeRight, frontRight)
  addQuad(backRight, ridgeRight, ridgeLeft, backLeft)
  addTriangle(frontRight, ridgeRight, backRight)
  addTriangle(backLeft, ridgeLeft, frontLeft)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function roofEaveBeams({ width, depth, lift, color, parent }) {
  const group = new THREE.Group()
  group.name = 'upturned-eaves'
  parent.add(group)
  const segments = 4
  const halfWidth = width / 2
  const halfDepth = depth / 2

  for (const side of [-1, 1]) {
    for (let index = 0; index < segments; index += 1) {
      const t0 = -1 + (index / segments) * 2
      const t1 = -1 + ((index + 1) / segments) * 2
      const x0 = t0 * halfWidth
      const x1 = t1 * halfWidth
      const y0 = lift * Math.pow(Math.abs(t0), 3)
      const y1 = lift * Math.pow(Math.abs(t1), 3)
      const length = Math.hypot(x1 - x0, y1 - y0)
      const beam = meshBox([length, 0.11, 0.15], color, [(x0 + x1) / 2, (y0 + y1) / 2 - 0.035, side * (halfDepth + 0.035)], group, { roughness: 0.62, metalness: 0.08 })
      beam.rotation.z = -Math.atan2(y1 - y0, x1 - x0)
    }
  }

  for (const side of [-1, 1]) {
    for (let index = 0; index < segments; index += 1) {
      const t0 = -1 + (index / segments) * 2
      const t1 = -1 + ((index + 1) / segments) * 2
      const z0 = t0 * halfDepth
      const z1 = t1 * halfDepth
      const y0 = lift * Math.pow(Math.abs(t0), 3)
      const y1 = lift * Math.pow(Math.abs(t1), 3)
      const length = Math.hypot(z1 - z0, y1 - y0)
      const beam = meshBox([0.15, 0.11, length], color, [side * (halfWidth + 0.035), (y0 + y1) / 2 - 0.035, (z0 + z1) / 2], group, { roughness: 0.62, metalness: 0.08 })
      beam.rotation.x = Math.atan2(y1 - y0, z1 - z0)
    }
  }
}

function chineseRoof({ width, depth, y, color, ridgeColor = '#d4a34e', parent, scale = 1 }) {
  const roofWidth = width * scale
  const roofDepth = depth * scale
  const roofHeight = Math.max(0.46, Math.min(1.02, Math.max(roofWidth, roofDepth) * 0.105))
  const eaveLift = Math.max(0.12, Math.min(0.34, roofWidth * 0.028))
  const group = new THREE.Group()
  group.name = 'roof'
  group.position.y = y
  parent.add(group)

  meshBox([roofWidth * 1.12, 0.12, roofDepth * 1.12], color, [0, -0.08, 0], group, { roughness: 0.64, metalness: 0.1 })
  const roof = meshGeometry(createHipRoofGeometry(roofWidth, roofDepth, roofHeight, eaveLift), color, [0, 0, 0], group, { roughness: 0.58, metalness: 0.12 })
  roof.material.side = THREE.DoubleSide
  roofEaveBeams({ width: roofWidth, depth: roofDepth, lift: eaveLift, color: ridgeColor, parent: group })
  const ridgeLength = Math.max(0.6, roofWidth - roofDepth * 0.72)
  meshBox([ridgeLength, 0.11, 0.18], ridgeColor, [0, roofHeight + 0.035, 0], group, { roughness: 0.45, metalness: 0.34 })

  const cornerX = roofWidth * 0.48
  const cornerZ = roofDepth * 0.48
  for (const [x, z] of [[-cornerX, cornerZ], [cornerX, cornerZ], [-cornerX, -cornerZ], [cornerX, -cornerZ]]) {
    meshCylinder(0.08, 0.08, Math.max(0.16, roofWidth * 0.054), 6, ridgeColor, [x, eaveLift + 0.04, z], group, { roughness: 0.46, metalness: 0.4 })
  }
  const guardianCount = Math.max(3, Math.min(7, Math.round(roofWidth / 1.55)))
  for (let index = 0; index < guardianCount; index += 1) {
    const progress = guardianCount === 1 ? 0.5 : index / (guardianCount - 1)
    const x = -ridgeLength * 0.42 + progress * ridgeLength * 0.84
    meshCone(0.07, 0.14, 6, ridgeColor, [x, roofHeight + 0.13, 0], group, { roughness: 0.42, metalness: 0.36 })
  }
  return group
}

function stoneTerrace({ width, depth, levels = 2, parent }) {
  const stoneColors = ['#b5aa91', '#c4b99f', '#a69b84']
  for (let index = 0; index < levels; index += 1) {
    const factor = 1.2 - index * 0.07
    const height = index === 0 ? 0.18 : 0.13
    meshBox([width * factor, height, depth * factor], stoneColors[index % stoneColors.length], [0, 0.09 + index * 0.16, 0], parent, { roughness: 0.9 })
  }
  if (levels < 3) return

  const railY = 0.55
  const railDepth = depth * 0.62
  meshBox([width * 1.02, 0.08, 0.08], '#d2c8ad', [0, railY, -railDepth], parent, { roughness: 0.82 })
  meshBox([width * 1.02, 0.08, 0.08], '#d2c8ad', [0, railY, railDepth], parent, { roughness: 0.82 })
  const posts = Math.max(3, Math.round(width / 1.7))
  for (const side of [-1, 1]) {
    for (let index = 0; index < posts; index += 1) {
      const x = -width * 0.5 + (index / Math.max(1, posts - 1)) * width
      meshBox([0.08, 0.34, 0.08], '#d2c8ad', [x, 0.42, side * railDepth], parent, { roughness: 0.82 })
    }
  }
  for (let index = 0; index < 3; index += 1) {
    meshBox([width * (0.23 - index * 0.035), 0.08, 0.48 - index * 0.08], '#d2c8ad', [0, 0.28 + index * 0.11, -depth * (0.67 - index * 0.025)], parent, { roughness: 0.86 })
  }
}

function palaceBuilding({ id, position, width, depth, height, roofColor, wallColor = '#7f3328', trimColor = '#d99e48', tiers = 1, detail = 'full', accent = '#e3b25c' }) {
  const group = new THREE.Group()
  group.name = id ? 'landmark:' + id : 'palace-building'
  group.position.set(...position)
  scene.add(group)

  const bodyBase = 0.58
  stoneTerrace({ width, depth, levels: tiers > 1 ? 3 : 2, parent: group })
  meshBox([width * 0.76, height, depth * 0.62], wallColor, [0, bodyBase + height * 0.5, 0], group, { roughness: 0.82 })

  const columnCount = detail === 'full' ? Math.max(4, Math.round(width / 1.35)) : Math.max(3, Math.round(width / 1.8))
  for (const side of [-1, 1]) {
    for (let index = 0; index < columnCount; index += 1) {
      const x = -width * 0.34 + (index / Math.max(1, columnCount - 1)) * width * 0.68
      meshBox([Math.max(0.14, width * 0.038), height * 0.92, Math.max(0.16, depth * 0.055)], trimColor, [x, bodyBase + height * 0.49, side * depth * 0.35], group, { roughness: 0.56, metalness: 0.16 })
    }
  }
  for (const side of [-1, 1]) {
    meshBox([width * 0.82, 0.12, 0.16], trimColor, [0, bodyBase + height * 0.12, side * depth * 0.355], group, { roughness: 0.56, metalness: 0.16 })
    meshBox([width * 0.88, 0.2, depth * 0.72], '#2e544f', [0, bodyBase + height * 0.86, side * depth * 0.015], group, { roughness: 0.56, metalness: 0.12 })
  }
  meshBox([width * 0.88, 0.14, depth * 0.72], '#2e544f', [0, bodyBase + height * 0.86, 0], group, { roughness: 0.56, metalness: 0.12 })

  if (detail === 'full') {
    const windowCount = Math.max(3, Math.round(width / 1.65))
    for (let index = 0; index < windowCount; index += 1) {
      const x = -width * 0.29 + (index / Math.max(1, windowCount - 1)) * width * 0.58
      for (const side of [-1, 1]) {
        meshBox([Math.max(0.2, width * 0.07), Math.max(0.22, height * 0.22), 0.025], accent, [x, bodyBase + height * 0.57, side * depth * 0.322], group, { roughness: 0.44, emissive: accent })
      }
    }
  }

  for (let index = 0; index < tiers; index += 1) {
    const factor = 1 - index * 0.17
    chineseRoof({ width: width * factor, depth: depth * factor, y: bodyBase + height + 0.16 + index * 0.58, color: roofColor, ridgeColor: accent, parent: group })
  }
  if (tiers > 1) meshCylinder(0.07, 0.1, 0.55, 6, accent, [0, bodyBase + height + (tiers - 1) * 0.58 + 0.72, 0], group, { roughness: 0.42, metalness: 0.42 })
  return group
}

function gateHouse({ id, position, rotation = 0, width = 7.8, depth = 3.25, roofColor = '#b78338', variant = 'standard' }) {
  const group = new THREE.Group()
  group.name = id ? 'landmark:' + id : 'gate-house'
  group.position.set(...position)
  group.rotation.y = rotation
  scene.add(group)

  const isMeridian = variant === 'meridian'
  const bodyBase = 0.58
  stoneTerrace({ width, depth, levels: isMeridian ? 2 : 1, parent: group })
  meshBox([width * 0.84, 1.55, depth * 0.78], '#773027', [0, bodyBase + 0.78, 0], group, { roughness: 0.8 })

  const columnCount = isMeridian ? 7 : 3
  for (let index = 0; index < columnCount; index += 1) {
    const x = -width * 0.38 + (index / Math.max(1, columnCount - 1)) * width * 0.76
    meshBox([0.22, 1.72, 0.28], '#cc9344', [x, bodyBase + 0.78, depth * 0.43], group, { roughness: 0.56, metalness: 0.18 })
  }

  const doorCount = isMeridian ? 5 : 1
  for (let index = 0; index < doorCount; index += 1) {
    const x = isMeridian ? -width * 0.33 + (index / Math.max(1, doorCount - 1)) * width * 0.66 : 0
    meshBox([isMeridian ? width * 0.105 : width * 0.34, 1.08, 0.035], '#1b2522', [x, bodyBase + 0.3, depth * 0.425], group, { roughness: 0.72 })
  }
  for (let index = 0; index < doorCount; index += 1) {
    const x = isMeridian ? -width * 0.33 + (index / Math.max(1, doorCount - 1)) * width * 0.66 : width * -0.11
    meshBox([0.055, 0.94, 0.05], '#d7a84e', [x, bodyBase + 0.27, depth * 0.45], group, { roughness: 0.42, metalness: 0.3 })
  }

  if (isMeridian) {
    const roofPositions = [-0.41, -0.205, 0, 0.205, 0.41]
    roofPositions.forEach((offset, index) => {
      const roofWidth = index === 2 ? width * 0.29 : width * 0.21
      const roof = chineseRoof({ width: roofWidth, depth: depth * 0.92, y: 2.16, color: roofColor, ridgeColor: '#e2ae53', parent: group })
      roof.position.x = width * offset
    })
    const centralRoof = chineseRoof({ width: width * 0.34, depth: depth * 1.04, y: 2.7, color: roofColor, ridgeColor: '#e2ae53', parent: group, scale: 0.82 })
    centralRoof.position.x = 0
    meshCylinder(0.09, 0.13, 0.42, 6, '#e2ae53', [0, 3.22, 0], group, { roughness: 0.4, metalness: 0.4 })
  } else {
    chineseRoof({ width: width * 1.12, depth: depth * 1.25, y: 2.02, color: roofColor, ridgeColor: '#e2ae53', parent: group })
    meshCylinder(0.09, 0.13, 0.42, 6, '#e2ae53', [0, 2.53, 0], group, { roughness: 0.4, metalness: 0.4 })
  }
  return group
}

function courtyard(position, width, depth, stoneColor = '#7f6a4a', borderColor = '#b19363', tileRows = 3) {
  const group = new THREE.Group()
  group.name = 'courtyard'
  group.position.set(...position)
  scene.add(group)
  meshBox([width, 0.16, depth], stoneColor, [0, 0.08, 0], group, { roughness: 0.91 })
  meshBox([width + 0.2, 0.08, 0.16], borderColor, [0, 0.17, -depth / 2], group, { roughness: 0.78 })
  meshBox([width + 0.2, 0.08, 0.16], borderColor, [0, 0.17, depth / 2], group, { roughness: 0.78 })
  meshBox([0.16, 0.08, depth], borderColor, [-width / 2, 0.17, 0], group, { roughness: 0.78 })
  meshBox([0.16, 0.08, depth], borderColor, [width / 2, 0.17, 0], group, { roughness: 0.78 })
  for (let index = 1; index < tileRows; index += 1) meshBox([width - 0.18, 0.018, 0.035], '#a48a62', [0, 0.172, -depth / 2 + (depth / tileRows) * index], group, { roughness: 0.9 })
  const columns = Math.max(2, Math.round(width / 5))
  for (let index = 1; index < columns; index += 1) meshBox([0.035, 0.018, depth - 0.18], '#a48a62', [-width / 2 + (width / columns) * index, 0.172, 0], group, { roughness: 0.9 })
  return group
}

function wallRun(position, length, orientation, gap = 0, height = 1.7, color = '#743228', trimColor = '#c68c40') {
  const group = new THREE.Group()
  group.name = 'outer-wall'
  group.position.set(...position)
  scene.add(group)
  const segmentLength = gap > 0 ? (length - gap) / 2 : length
  const segmentOffset = gap > 0 ? (length + gap) / 4 : 0
  const count = Math.max(3, Math.floor(segmentLength / 2.1))
  for (const side of gap > 0 ? [-1, 1] : [0]) {
    const center = side * segmentOffset
    const segmentPosition = orientation === 'x' ? [center, height / 2, 0] : [0, height / 2, center]
    const segmentSize = orientation === 'x' ? [segmentLength, height, 0.72] : [0.72, height, segmentLength]
    const capPosition = orientation === 'x' ? [center, height + 0.07, 0] : [0, height + 0.07, center]
    const capSize = orientation === 'x' ? [segmentLength + 0.2, 0.14, 0.94] : [0.94, 0.14, segmentLength + 0.2]
    meshBox(segmentSize, color, segmentPosition, group, { roughness: 0.84 })
    meshBox(capSize, trimColor, capPosition, group, { roughness: 0.6, metalness: 0.15 })
    for (let index = 0; index < count; index += 1) {
      const offset = -segmentLength / 2 + ((index + 0.5) / count) * segmentLength
      const battlementPosition = orientation === 'x' ? [center + offset, height + 0.31, 0] : [0, height + 0.31, center + offset]
      const battlementSize = orientation === 'x' ? [0.44, 0.48, 0.96] : [0.96, 0.48, 0.44]
      meshBox(battlementSize, color, battlementPosition, group, { roughness: 0.78 })
    }
  }
}

function watchTower(position, scale = 1) {
  const group = new THREE.Group()
  group.name = 'watch-tower'
  group.position.set(...position)
  group.scale.setScalar(scale)
  scene.add(group)
  meshBox([2.45, 1.6, 2.45], '#703027', [0, 0.8, 0], group, { roughness: 0.82 })
  meshBox([2.75, 0.15, 2.75], '#bd883d', [0, 1.66, 0], group, { roughness: 0.64, metalness: 0.12 })
  chineseRoof({ width: 3.3, depth: 3.3, y: 1.88, color: '#2b554d', ridgeColor: '#d8a54d', parent: group })
  chineseRoof({ width: 2.45, depth: 2.45, y: 2.34, color: '#23473f', ridgeColor: '#d8a54d', parent: group, scale: 0.74 })
}

function bridge(position, rotation = 0, width = 7.5, depth = 4.6) {
  const group = new THREE.Group()
  group.name = 'stone-bridge'
  group.position.set(...position)
  group.rotation.y = rotation
  scene.add(group)
  meshBox([width, 0.36, depth], '#aa8d68', [0, 0.1, 0], group, { roughness: 0.92 })
  for (let index = 0; index < 6; index += 1) meshBox([width * 0.96, 0.09, depth / 6 - 0.08], index % 2 === 0 ? '#c4a77c' : '#9b7d5c', [0, 0.31, -depth / 2 + (index + 0.5) * (depth / 6)], group, { roughness: 0.88 })
  for (const side of [-1, 1]) {
    const rail = new THREE.Group()
    rail.name = 'bridge-rail'
    rail.position.x = side * width * 0.42
    group.add(rail)
    meshBox([0.1, 1.05, depth], '#7b5e43', [0, 0.75, 0], rail, { roughness: 0.8 })
    for (const z of [-depth * 0.42, 0, depth * 0.42]) meshCylinder(0.11, 0.14, 0.74, 6, '#9a774e', [0, 0.57, z], rail, { roughness: 0.7 })
  }
}

// Ground and water.
meshBox([69, 1.1, 53], '#202b26', [0, -0.92, 0], scene, { roughness: 0.95 })
meshBox([66, 0.22, 50], '#5b4836', [0, -0.47, 0], scene, { roughness: 0.9 })
meshBox([64, 0.04, 48], '#174f50', [0, -0.32, 0], scene, { roughness: 0.22, metalness: 0.18 })
meshBox([56.8, 0.45, 38.8], '#8a6b49', [0, -0.08, 0], scene, { roughness: 0.91 })
meshBox([55.2, 0.1, 37.2], '#aa8a5b', [0, 0.16, 0], scene, { roughness: 0.84 })
meshBox([2.75, 0.05, 35.8], '#c09c69', [0, 0.23, 0], scene, { roughness: 0.77 })
meshBox([54, 0.045, 1.6], '#a27f52', [0, 0.235, 0], scene, { roughness: 0.82 })
for (const z of [-12.3, -6.2, 0, 6.2, 12.3]) meshBox([4.25, 0.045, 0.11], '#d0ad76', [0, 0.27, z], scene, { roughness: 0.77 })

wallRun([0, 0, 19], 54, 'x', 12)
wallRun([0, 0, -19], 54, 'x', 7.5)
wallRun([27, 0, 0], 36, 'z', 5.8)
wallRun([-27, 0, 0], 36, 'z', 5.8)
for (const position of [[26.45, 0, 18.35], [-26.45, 0, 18.35], [26.45, 0, -18.35], [-26.45, 0, -18.35]]) watchTower(position, 0.88)
gateHouse({ id: 'meridian-gate', position: [0, 0, 18.65], width: 11.2, depth: 3.8, roofColor: '#ae7f36', variant: 'meridian' })
gateHouse({ id: 'gate-of-supreme-harmony', position: [0, 0.34, 12.35], width: 9.4, depth: 3.2, roofColor: '#b78338' })
gateHouse({ position: [0, 0, -18.65], width: 7.4, depth: 3.2, roofColor: '#ae7f36', rotation: Math.PI })
gateHouse({ id: 'east-flower-gate', position: [26.65, 0, 0], width: 6.6, depth: 3.05, roofColor: '#2d5149', rotation: Math.PI / 2 })
gateHouse({ position: [-26.65, 0, 0], width: 6.6, depth: 3.05, roofColor: '#2d5149', rotation: -Math.PI / 2 })
bridge([0, -0.02, 21.3], 0, 11.2, 4.8)
bridge([0, -0.02, -21.3], Math.PI, 7.6, 4.2)
bridge([30.1, -0.02, 0], Math.PI / 2, 7.2, 4.2)
bridge([-30.1, -0.02, 0], -Math.PI / 2, 7.2, 4.2)

courtyard([0, 0.28, 12.35], 21.5, 6.2, '#8f7650', '#b19363', 2)
courtyard([0, 0.28, 3.05], 22.6, 7.6, '#88704c', '#b19363', 3)
courtyard([0, 0.28, -4.45], 20.5, 6.4, '#806746', '#b19363', 3)
courtyard([0, 0.28, -10.6], 18.8, 4.8, '#796044', '#b19363', 2)

palaceBuilding({ id: 'hall-of-supreme-harmony', position: [0, 0.34, 6.05], width: 10.4, depth: 6.1, height: 2.65, roofColor: '#d3a24e', tiers: 2 })
palaceBuilding({ id: 'hall-of-central-harmony', position: [0, 0.34, 0.15], width: 6.0, depth: 5.7, height: 2.05, roofColor: '#bf8f3d', tiers: 1 })
palaceBuilding({ id: 'hall-of-preserving-harmony', position: [0, 0.34, -5.15], width: 9.1, depth: 5.6, height: 2.35, roofColor: '#ca983f', tiers: 1 })
gateHouse({ id: 'gate-of-heavenly-purity', position: [0, 0.34, -8.4], width: 8.2, depth: 2.9, roofColor: '#9d794a' })
palaceBuilding({ id: 'palace-of-heavenly-purity', position: [0, 0.34, -11.45], width: 8.1, depth: 5.2, height: 2.2, roofColor: '#b98539', tiers: 2 })
palaceBuilding({ id: 'palace-of-earthly-tranquility', position: [0, 0.34, -16.05], width: 7.5, depth: 4.7, height: 2.0, roofColor: '#a97c38', tiers: 1 })

meshBox([10.7, 0.3, 1.15], '#c4a26e', [0, 0.5, 8.85], scene, { roughness: 0.86 })
chineseRoof({ width: 9.8, depth: 2.45, y: 1.17, color: '#315c50', ridgeColor: '#d3a24e', parent: scene })

for (const side of [-1, 1]) {
  for (let index = 0; index < 6; index += 1) {
    const z = [11.65, 6.7, 1.7, -3.25, -8.25, -13.1][index]
    const width = index % 2 === 0 ? 4.2 : 3.8
    const depth = index % 2 === 0 ? 2.65 : 2.4
    const id = side === 1 && index === 3 ? 'hall-of-literary-brilliance' : side === -1 && index === 1 ? 'hall-of-mental-cultivation' : null
    palaceBuilding({ id, position: [side * (index % 2 === 0 ? 12.9 : 17.35), 0.34, z], width, depth, height: index % 3 === 0 ? 1.58 : 1.42, roofColor: index % 2 === 0 ? '#2b554c' : '#315e53', wallColor: '#713129', trimColor: '#b9843d', detail: 'light', accent: '#dbad57' })
  }
  for (const [z, index] of [[10.3, 0], [2.25, 1], [-5.8, 2], [-13.2, 3]]) palaceBuilding({ position: [side * 21.05, 0.34, z], width: 3.45, depth: 2.35, height: 1.25, roofColor: '#254b44', wallColor: '#692f29', trimColor: '#a8793b', detail: 'light', accent: '#cfa14e' })
}

courtyard([11.25, 0.28, -15.25], 7.8, 5.4, '#53604c', '#9a875a', 2)
courtyard([-11.25, 0.28, -15.25], 7.8, 5.4, '#53604c', '#9a875a', 2)
palaceBuilding({ id: 'imperial-garden', position: [11.25, 0.38, -15.2], width: 3.55, depth: 2.85, height: 1.28, roofColor: '#2d6656', wallColor: '#74342a', trimColor: '#c3974e', detail: 'full', tiers: 1 })
palaceBuilding({ position: [-11.25, 0.38, -15.2], width: 3.55, depth: 2.85, height: 1.28, roofColor: '#2d6656', wallColor: '#74342a', trimColor: '#c3974e', detail: 'full', tiers: 1 })
chineseRoof({ width: 2.85, depth: 2.85, y: 2.55, color: '#3d795f', ridgeColor: '#d7a950', parent: scene, scale: 0.8 })

const dragonScreen = new THREE.Group()
dragonScreen.name = 'landmark:nine-dragon-wall'
dragonScreen.position.set(17.9, 0.42, 4.8)
dragonScreen.rotation.y = Math.PI / 2
scene.add(dragonScreen)
meshBox([0.7, 2.15, 5.8], '#24585a', [0, 1.35, 0], dragonScreen, { roughness: 0.55, metalness: 0.2 })
for (let index = 0; index < 9; index += 1) {
  const z = -2.2 + index * 0.55
  const color = index % 3 === 0 ? '#d86445' : index % 3 === 1 ? '#d8ae4d' : '#5fafa0'
  const ring = new THREE.Mesh(geometry('dragon-ring', () => new THREE.TorusGeometry(0.28, 0.09, 6, 12, Math.PI * 1.55)), material(color, { roughness: 0.5, metalness: 0.25 }))
  ring.position.set(0.4, 1.35 + Math.sin(index) * 0.2, z)
  ring.rotation.z = Math.PI / 2
  ring.castShadow = true
  dragonScreen.add(ring)
}
for (const z of [-2.5, 2.5]) meshBox([0.9, 2.55, 0.4], '#9c3b2d', [0, 1.35, z], dragonScreen, { roughness: 0.68 })
chineseRoof({ width: 1.15, depth: 6.2, y: 2.7, color: '#2c6c69', ridgeColor: '#d9a54b', parent: dragonScreen })

const lanternPositions = [[-5.6, 10.5], [5.6, 10.5], [-6.2, 2.1], [6.2, 2.1], [-5.4, -6.4], [5.4, -6.4], [-4.7, -12.35], [4.7, -12.35]]
for (const [x, z] of lanternPositions) {
  meshCylinder(0.055, 0.09, 1.12, 6, '#6d4b33', [x, 0.92, z], scene, { roughness: 0.8 })
  meshBox([0.33, 0.18, 0.33], '#c08c3d', [x, 1.54, z], scene, { roughness: 0.55, metalness: 0.2 })
  meshBox([0.23, 0.23, 0.23], '#d89c42', [x, 1.39, z], scene, { roughness: 0.45, emissive: '#8c552a' })
  meshBox([0.34, 0.11, 0.34], '#8d693f', [x, 0.48, z], scene, { roughness: 0.76 })
}

for (const z of [9.1, 3.2, -3.2, -9.1, -14.9]) {
  meshCylinder(0.21, 0.27, 0.32, 8, '#b18b55', [0, 0.58, z], scene, { roughness: 0.7 })
  meshCylinder(0.06, 0.06, 0.12, 8, '#e4bd65', [0, 0.85, z], scene, { roughness: 0.4, metalness: 0.2 })
}

const treePoints = [
  [-22.8, -14.8, 1.12], [-20.8, -13.1, 0.82], [-23.1, -10.6, 0.95], [-20.9, 13.9, 1.02], [-22.9, 11.8, 0.82], [-18.8, 15.2, 0.78],
  [22.5, -14.2, 1.1], [20.5, -12.8, 0.84], [23.2, -9.9, 0.92], [21.8, 14.3, 0.95], [23.5, 11.8, 0.8], [18.7, 15.2, 0.84],
  [-15.8, -14.3, 0.78], [-14.2, -12.2, 0.65], [15.8, -15.1, 0.86], [13.9, -12.3, 0.68], [-15.8, 13.2, 0.76], [15.9, 13.4, 0.72],
]
for (const [x, z, scale] of treePoints) {
  meshCylinder(0.13 * scale, 0.2 * scale, 1.18 * scale, 6, '#553923', [x, 0.55 * scale, z], scene, { roughness: 0.95 })
  const canopy = new THREE.Mesh(geometry('tree-canopy', () => new THREE.IcosahedronGeometry(0.67, 0)), material('#244c3d', { roughness: 0.96 }))
  canopy.position.set(x, 1.37 * scale, z)
  canopy.scale.set(scale, scale * 1.15, scale)
  canopy.castShadow = true
  scene.add(canopy)
  const highlight = new THREE.Mesh(geometry('tree-highlight', () => new THREE.IcosahedronGeometry(0.39, 0)), material('#3d7454', { roughness: 0.92 }))
  highlight.position.set(x + 0.12 * scale, 1.7 * scale, z - 0.1 * scale)
  highlight.scale.setScalar(scale)
  highlight.castShadow = true
  scene.add(highlight)
}

const exporter = new GLTFExporter()
const data = await exporter.parseAsync(scene, { binary: true, onlyVisible: true, trs: true, maxTextureSize: 1024 })
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, Buffer.from(data))
console.log(`Wrote ${outputPath}`)
console.log(`Bytes: ${data.byteLength}`)
console.log(`Landmark groups: ${[...scene.children].filter((child) => child.name.startsWith('landmark:')).map((child) => child.name).join(', ')}`)
