import { ContactShadows, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Box, ExternalLink, Image as ImageIcon, Rotate3d, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react"
import * as THREE from "three"

import type { Landmark } from "../data/landmarks"
import { commonsSearchUrl, fetchCommonsPhotos, type CommonsPhoto } from "../lib/commonsPhotos"
import type { Season } from "../store/atlasStore"
import "./building-model-viewer.css"
import { ChineseRoof, SeasonThemeProvider } from "./scene/primitives"

type ViewerLanguage = "en" | "zh"

export type BuildingModelViewerProps = {
  landmark: Landmark | null
  language: ViewerLanguage
  season: Season
  onClose: () => void
}

type ModelFamily = "meridian-gate" | "gate" | "grand-hall" | "square-hall" | "residence" | "garden" | "screen"

type ModelProfile = {
  family: ModelFamily
  roofNote: string
  roofNoteZh: string
  structureNote: string
  structureNoteZh: string
}

const MODEL_PROFILES: Record<string, ModelProfile> = {
  "meridian-gate": {
    family: "meridian-gate",
    roofNote: "Layered gatehouse roof with five ceremonial passages",
    roofNoteZh: "层叠门楼屋顶与五座礼仪门洞",
    structureNote: "Southern threshold · five openings · raised platform",
    structureNoteZh: "南向门槛 · 五座门洞 · 高台基",
  },
  "gate-of-supreme-harmony": {
    family: "gate",
    roofNote: "Single-eave imperial gate roof",
    roofNoteZh: "单檐宫门屋顶",
    structureNote: "Outer Court gate · broad forecourt · axial approach",
    structureNoteZh: "外朝宫门 · 宽阔前庭 · 中轴抵达",
  },
  "gate-of-heavenly-purity": {
    family: "gate",
    roofNote: "Measured gatehouse roof with deep eaves",
    roofNoteZh: "深檐克制门楼屋顶",
    structureNote: "Inner Court threshold · quieter scale",
    structureNoteZh: "内廷门槛 · 更安静的尺度",
  },
  "east-flower-gate": {
    family: "gate",
    roofNote: "Side gatehouse roof with imperial glazed tiles",
    roofNoteZh: "侧门门楼与帝王琉璃瓦",
    structureNote: "Eastern perimeter gate · side-court arrival",
    structureNoteZh: "东侧宫门 · 侧院抵达",
  },
  "hall-of-supreme-harmony": {
    family: "grand-hall",
    roofNote: "Double-eave hip roof · nine-bay ceremonial hall",
    roofNoteZh: "重檐庑殿顶 · 九开间典礼宫殿",
    structureNote: "Three marble terraces · highest ceremonial stage",
    structureNoteZh: "三层汉白玉台基 · 最高典礼台",
  },
  "hall-of-central-harmony": {
    family: "square-hall",
    roofNote: "Compact pyramidal hip roof",
    roofNoteZh: "紧凑攒尖式屋顶",
    structureNote: "Square pause between the two great halls",
    structureNoteZh: "两座大殿之间的方形停驻",
  },
  "hall-of-preserving-harmony": {
    family: "grand-hall",
    roofNote: "Single-eave hip roof with a broad ceremonial span",
    roofNoteZh: "宽阔单檐庑殿顶",
    structureNote: "Northern crown of the Outer Court",
    structureNoteZh: "外朝北端的典礼宫殿",
  },
  "palace-of-heavenly-purity": {
    family: "residence",
    roofNote: "Raised residential hall with a double-eave roof",
    roofNoteZh: "高台双檐居所宫殿",
    structureNote: "Rear Three Palaces · residence and audience",
    structureNoteZh: "后三宫 · 居所与朝见",
  },
  "hall-of-union": {
    family: "square-hall",
    roofNote: "Small square roof at the hinge of the inner court",
    roofNoteZh: "内廷转轴处的小型方殿屋顶",
    structureNote: "Symbolic center · compact imperial interior",
    structureNoteZh: "象征中心 · 紧凑内廷空间",
  },
  "palace-of-earthly-tranquility": {
    family: "residence",
    roofNote: "Single-eave palace roof with a warmer residential scale",
    roofNoteZh: "更偏居住尺度的单檐宫殿屋顶",
    structureNote: "Empress’s palace · northern end of the axial trio",
    structureNoteZh: "皇后宫殿 · 中轴后三宫的北端",
  },
  "imperial-garden": {
    family: "garden",
    roofNote: "Pavilion roof surrounded by cypress and Taihu rock",
    roofNoteZh: "亭台屋顶与古柏、太湖石相伴",
    structureNote: "Landscape ending · irregular garden geometry",
    structureNoteZh: "园林收束 · 自由的景观几何",
  },
  "hall-of-literary-brilliance": {
    family: "residence",
    roofNote: "Quiet side-court hall with green glazed roof",
    roofNoteZh: "静谧侧院宫殿与绿色琉璃瓦",
    structureNote: "Eastern scholarship court · lecture and study",
    structureNoteZh: "东侧文华宫院 · 讲学与文脉",
  },
  "hall-of-mental-cultivation": {
    family: "residence",
    roofNote: "Working palace roof with an intimate courtyard scale",
    roofNoteZh: "工作宫殿与亲密院落尺度",
    structureNote: "Western working palace · daily court machinery",
    structureNoteZh: "西侧工作宫殿 · 日常政务核心",
  },
  "nine-dragon-wall": {
    family: "screen",
    roofNote: "Glazed screen cap with nine symbolic dragon panels",
    roofNoteZh: "琉璃屏顶与九幅象征性龙纹",
    structureNote: "Side-court screen · imperial number nine",
    structureNoteZh: "侧院照壁 · 帝王数字九",
  },
}

const DEFAULT_PROFILE: ModelProfile = {
  family: "residence",
  roofNote: "Imperial glazed-tile roof",
  roofNoteZh: "帝王琉璃瓦屋顶",
  structureNote: "Reference-matched architectural study",
  structureNoteZh: "参考现场影像的建筑研究模型",
}

function getModelProfile(id: string) {
  return MODEL_PROFILES[id] ?? DEFAULT_PROFILE
}

function MarbleTerrace({ width, depth, levels = 2, railings = false }: { width: number; depth: number; levels?: number; railings?: boolean }) {
  return (
    <group>
      {Array.from({ length: levels }, (_, index) => {
        const factor = 1 + (levels - index - 1) * 0.07
        return (
          <mesh key={`terrace-${index}`} castShadow receiveShadow position={[0, 0.11 + index * 0.17, 0]}>
            <boxGeometry args={[width * factor, 0.22, depth * factor]} />
            <meshStandardMaterial color={index === 0 ? "#bdb49f" : index === levels - 1 ? "#e2dac6" : "#cbc2ad"} roughness={0.9} />
          </mesh>
        )
      })}
      <group position={[0, levels * 0.17 + 0.05, depth * 0.57]}>
        {Array.from({ length: 4 }, (_, index) => (
          <mesh key={`front-step-${index}`} castShadow receiveShadow position={[0, -index * 0.09, index * 0.16]}>
            <boxGeometry args={[width * (0.34 + index * 0.05), 0.1, 0.35]} />
            <meshStandardMaterial color="#d8cfbc" roughness={0.9} />
          </mesh>
        ))}
      </group>
      {railings ? (
        <group position={[0, levels * 0.17 + 0.26, 0]}>
          {[-1, 1].map((side) => (
            <group key={`rail-${side}`} position={[0, 0, side * depth * 0.58]}>
              <mesh castShadow position={[0, 0.26, 0]}>
                <boxGeometry args={[width * 0.95, 0.08, 0.08]} />
                <meshStandardMaterial color="#e0d7c3" roughness={0.86} />
              </mesh>
              {Array.from({ length: 8 }, (_, index) => (
                <mesh key={`rail-post-${side}-${index}`} castShadow position={[-width * 0.45 + (index / 7) * width * 0.9, 0.13, 0]}>
                  <boxGeometry args={[0.08, 0.29, 0.08]} />
                  <meshStandardMaterial color="#e0d7c3" roughness={0.86} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ) : null}
    </group>
  )
}

function ArchOpening({ width, height, position, color = "#211713" }: { width: number; height: number; position: [number, number, number]; color?: string }) {
  const geometry = useMemo(() => {
    const radius = width / 2
    const springLine = Math.max(radius + 0.04, height - radius)
    const shape = new THREE.Shape()
    shape.moveTo(-radius, 0)
    shape.lineTo(-radius, springLine)
    shape.absarc(0, springLine, radius, Math.PI, 0, false)
    shape.lineTo(radius, 0)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false, curveSegments: 18 })
  }, [height, width])

  return (
    <mesh geometry={geometry} position={position} castShadow>
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.04} />
    </mesh>
  )
}

function GateBlock({
  width,
  depth,
  height,
  openings,
  roofColor = "#c69b39",
  accent = "#e0b65c",
  position = [0, 0, 0],
  rotation = 0,
}: {
  width: number
  depth: number
  height: number
  openings: number
  roofColor?: string
  accent?: string
  position?: [number, number, number]
  rotation?: number
}) {
  const terraceTop = 0.34
  const openingWidth = Math.min(1.22, width / Math.max(2, openings * 1.55))
  const gap = width / Math.max(1, openings)
  const openingHeight = Math.min(height * 0.82, 2.48)

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <MarbleTerrace width={width + 0.45} depth={depth + 0.35} levels={2} />
      <mesh castShadow receiveShadow position={[0, terraceTop + height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#843229" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, terraceTop + height * 0.84, depth * 0.515]}>
        <boxGeometry args={[width * 0.94, 0.19, 0.13]} />
        <meshStandardMaterial color={accent} roughness={0.54} metalness={0.14} />
      </mesh>
      {Array.from({ length: openings }, (_, index) => {
        const x = (index - (openings - 1) / 2) * gap
        return (
          <group key={`gate-opening-${index}`}>
            <ArchOpening width={openingWidth} height={openingHeight} position={[x, terraceTop + 0.02, depth * 0.508]} />
            <mesh castShadow position={[x, terraceTop + openingHeight * 0.5, depth * 0.53]}>
              <boxGeometry args={[openingWidth * 0.75, openingHeight * 0.82, 0.025]} />
              <meshStandardMaterial color="#4f2422" roughness={0.66} />
            </mesh>
          </group>
        )
      })}
      {Array.from({ length: openings + 1 }, (_, index) => {
        const x = -width * 0.46 + (index / Math.max(1, openings)) * width * 0.92
        return (
          <mesh key={`gate-column-${index}`} castShadow position={[x, terraceTop + height * 0.48, depth * 0.55]}>
            <boxGeometry args={[0.17, height * 0.95, 0.18]} />
            <meshStandardMaterial color="#a84735" roughness={0.62} />
          </mesh>
        )
      })}
      <ChineseRoof width={width + 1.15} depth={depth + 1.02} y={terraceTop + height + 0.2} color={roofColor} ridgeColor={accent} />
    </group>
  )
}

function MeridianGateModel() {
  return (
    <group>
      <GateBlock width={13.2} depth={2.65} height={3.25} openings={5} />
      <mesh castShadow receiveShadow position={[0, 4.24, -0.02]}>
        <boxGeometry args={[5.8, 1.22, 2.12]} />
        <meshStandardMaterial color="#8a342b" roughness={0.78} />
      </mesh>
      <ChineseRoof width={6.55} depth={2.82} y={4.9} color="#c89b3a" ridgeColor="#e5bd65" />
      <group position={[-5.42, 0.28, -1.1]} rotation={[0, 0.2, 0]}>
        <GateBlock width={4.15} depth={2.45} height={2.35} openings={1} />
      </group>
      <group position={[5.42, 0.28, -1.1]} rotation={[0, -0.2, 0]}>
        <GateBlock width={4.15} depth={2.45} height={2.35} openings={1} />
      </group>
    </group>
  )
}

function LatticeWindow({ position, width = 0.62, height = 0.78 }: { position: [number, number, number]; width?: number; height?: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[width, height, 0.045]} />
        <meshStandardMaterial color="#244f47" roughness={0.56} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[width * 0.78, 0.055, 0.018]} />
        <meshStandardMaterial color="#d6a649" roughness={0.52} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <boxGeometry args={[0.055, height * 0.78, 0.018]} />
        <meshStandardMaterial color="#d6a649" roughness={0.52} metalness={0.16} />
      </mesh>
    </group>
  )
}

function HallBuilding({
  width,
  depth,
  height,
  bays,
  doubleEave = false,
  roofColor = "#cba03e",
  trimColor = "#daa94e",
  bodyColor = "#813127",
  terraceLevels = 2,
}: {
  width: number
  depth: number
  height: number
  bays: number
  doubleEave?: boolean
  roofColor?: string
  trimColor?: string
  bodyColor?: string
  terraceLevels?: number
}) {
  const terraceTop = terraceLevels * 0.17 + 0.13
  const columnCount = bays + 1
  const columnGap = width * 0.84 / Math.max(1, bays)
  const lowerRoofY = terraceTop + height + 0.18

  return (
    <group>
      <MarbleTerrace width={width + 0.55} depth={depth + 0.55} levels={terraceLevels} railings={terraceLevels >= 3} />
      <mesh castShadow receiveShadow position={[0, terraceTop + height * 0.5, 0]}>
        <boxGeometry args={[width * 0.8, height, depth * 0.66]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, terraceTop + 0.18, 0]}>
        <boxGeometry args={[width * 0.84, 0.18, depth * 0.72]} />
        <meshStandardMaterial color="#2e5b50" roughness={0.55} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[0, terraceTop + height * 0.88, 0]}>
        <boxGeometry args={[width * 0.87, 0.18, depth * 0.72]} />
        <meshStandardMaterial color={trimColor} roughness={0.57} metalness={0.12} />
      </mesh>
      {Array.from({ length: columnCount }, (_, index) => {
        const x = -width * 0.42 + index * columnGap
        return [-1, 1].map((side) => (
          <mesh key={`hall-column-${index}-${side}`} castShadow position={[x, terraceTop + height * 0.48, side * depth * 0.34]}>
            <boxGeometry args={[0.19, height * 0.95, 0.2]} />
            <meshStandardMaterial color="#a84735" roughness={0.58} />
          </mesh>
        ))
      })}
      {Array.from({ length: Math.max(3, bays) }, (_, index) => {
        const x = -width * 0.31 + (index / Math.max(1, bays - 1)) * width * 0.62
        return (
          <group key={`hall-window-${index}`}>
            <LatticeWindow position={[x, terraceTop + height * 0.56, depth * 0.337]} width={Math.min(0.74, width / (bays * 1.5))} height={height * 0.34} />
            <LatticeWindow position={[x, terraceTop + height * 0.56, -depth * 0.337]} width={Math.min(0.74, width / (bays * 1.5))} height={height * 0.34} />
          </group>
        )
      })}
      {[-1, 1].map((side) => (
        <mesh key={`hall-beam-${side}`} castShadow position={[0, terraceTop + height * 0.64, side * depth * 0.37]}>
          <boxGeometry args={[width * 0.87, 0.17, 0.14]} />
          <meshStandardMaterial color={trimColor} roughness={0.56} metalness={0.12} />
        </mesh>
      ))}
      <mesh castShadow position={[0, terraceTop + height * 0.26, depth * 0.345]}>
        <boxGeometry args={[width * 0.22, height * 0.46, 0.035]} />
        <meshStandardMaterial color="#552520" roughness={0.54} />
      </mesh>
      <ChineseRoof width={width + 1.32} depth={depth + 0.98} y={lowerRoofY} color={roofColor} ridgeColor={trimColor} />
      {doubleEave ? (
        <group position={[0, 0.95, 0]}>
          <mesh castShadow position={[0, lowerRoofY + 0.47, 0]}>
            <boxGeometry args={[width * 0.68, 0.64, depth * 0.55]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} />
          </mesh>
          <ChineseRoof width={width * 0.82} depth={depth * 0.77} y={lowerRoofY + 0.88} color={roofColor} ridgeColor={trimColor} />
        </group>
      ) : null}
    </group>
  )
}

function GardenModel() {
  return (
    <group>
      <MarbleTerrace width={4.8} depth={4.8} levels={1} />
      <mesh castShadow receiveShadow position={[0, 1.16, 0]}>
        <boxGeometry args={[2.85, 1.55, 2.85]} />
        <meshStandardMaterial color="#71342b" roughness={0.82} />
      </mesh>
      {[-1, 1].flatMap((side) => [
        <mesh key={`garden-col-${side}-x`} castShadow position={[side * 1.18, 1.35, 1.48]}>
          <boxGeometry args={[0.14, 1.9, 0.14]} />
          <meshStandardMaterial color="#b24b37" roughness={0.58} />
        </mesh>,
        <mesh key={`garden-col-${side}-z`} castShadow position={[1.48, 1.35, side * 1.18]}>
          <boxGeometry args={[0.14, 1.9, 0.14]} />
          <meshStandardMaterial color="#b24b37" roughness={0.58} />
        </mesh>,
      ])}
      <ChineseRoof width={4.45} depth={4.45} y={2.22} color="#2f6859" ridgeColor="#d4a34e" />
      {[
        [-3.2, 0.12, -2.6, 1.05],
        [3.15, 0.12, -2.35, 0.9],
        [-3.2, 0.12, 2.3, 0.84],
        [3.1, 0.12, 2.65, 1.1],
      ].map(([x, y, z, scale], index) => (
        <group key={`garden-tree-${index}`} position={[x, y, z]} scale={scale}>
          <mesh castShadow position={[0, 1.05, 0]}>
            <cylinderGeometry args={[0.11, 0.15, 2.1, 7]} />
            <meshStandardMaterial color="#5f402c" roughness={0.94} />
          </mesh>
          <mesh castShadow position={[0, 2.12, 0]}>
            <coneGeometry args={[0.7, 1.55, 7]} />
            <meshStandardMaterial color="#405e49" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {[
        [-2.2, 0.46, -0.8],
        [2.1, 0.42, 0.6],
        [-2.55, 0.4, 1.8],
      ].map(([x, y, z], index) => (
        <mesh key={`garden-rock-${index}`} castShadow position={[x, y, z]} scale={[1, 0.68, 0.82]}>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color="#626557" roughness={0.98} />
        </mesh>
      ))}
    </group>
  )
}

function NineDragonWallModel() {
  return (
    <group>
      <MarbleTerrace width={8.2} depth={1.25} levels={1} />
      <mesh castShadow receiveShadow position={[0, 1.72, 0]}>
        <boxGeometry args={[7.6, 2.75, 0.68]} />
        <meshStandardMaterial color="#2b7771" roughness={0.5} metalness={0.12} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => {
        const x = -3.15 + index * 0.79
        const color = index % 3 === 0 ? "#db6b42" : index % 3 === 1 ? "#e2b14e" : "#53a79a"
        return (
          <group key={`dragon-panel-${index}`} position={[x, 1.7 + Math.sin(index * 0.7) * 0.13, 0.39]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.29, 0.08, 7, 16, Math.PI * 1.55]} />
              <meshStandardMaterial color={color} roughness={0.48} metalness={0.18} />
            </mesh>
            <mesh position={[0.19, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.1, 0.28, 5]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          </group>
        )
      })}
      <ChineseRoof width={8.25} depth={1.45} y={3.15} color="#2d6867" ridgeColor="#dda94a" />
    </group>
  )
}

function DetailedBuilding({ landmark, season }: { landmark: Landmark; season: Season }) {
  const profile = getModelProfile(landmark.id)
  let model: ReactElement

  if (profile.family === "meridian-gate") {
    model = <MeridianGateModel />
  } else if (profile.family === "gate") {
    model = <GateBlock width={landmark.id === "gate-of-heavenly-purity" ? 8.8 : 9.6} depth={2.7} height={landmark.id === "gate-of-heavenly-purity" ? 2.55 : 2.8} openings={landmark.id === "east-flower-gate" ? 3 : 4} roofColor="#c69b39" />
  } else if (profile.family === "grand-hall") {
    model = <HallBuilding width={landmark.id === "hall-of-supreme-harmony" ? 10.4 : 9.0} depth={landmark.id === "hall-of-supreme-harmony" ? 6.5 : 5.8} height={landmark.id === "hall-of-supreme-harmony" ? 2.72 : 2.35} bays={landmark.id === "hall-of-supreme-harmony" ? 9 : 7} doubleEave={landmark.id === "hall-of-supreme-harmony"} terraceLevels={landmark.id === "hall-of-supreme-harmony" ? 3 : 2} />
  } else if (profile.family === "square-hall") {
    model = <HallBuilding width={landmark.id === "hall-of-union" ? 4.3 : 5.4} depth={landmark.id === "hall-of-union" ? 4.3 : 5.3} height={landmark.id === "hall-of-union" ? 1.68 : 1.88} bays={4} terraceLevels={2} />
  } else if (profile.family === "garden") {
    model = <GardenModel />
  } else if (profile.family === "screen") {
    model = <NineDragonWallModel />
  } else {
    const doubleEave = landmark.id === "palace-of-heavenly-purity"
    model = <HallBuilding width={landmark.id === "hall-of-mental-cultivation" ? 7.1 : 7.9} depth={landmark.id === "hall-of-mental-cultivation" ? 4.55 : 5.1} height={landmark.id === "palace-of-heavenly-purity" ? 2.35 : 2.05} bays={landmark.id === "palace-of-heavenly-purity" ? 7 : 6} doubleEave={doubleEave} roofColor={landmark.id === "hall-of-literary-brilliance" ? "#2f6659" : "#c59638"} terraceLevels={2} />
  }

  return (
    <SeasonThemeProvider season={season}>
      <group>{model}</group>
    </SeasonThemeProvider>
  )
}

function ModelStage({ landmark, season }: { landmark: Landmark; season: Season }) {
  const modelRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (modelRef.current) modelRef.current.rotation.y += delta * 0.08
  })
  return (
    <>
      <color attach="background" args={["#111715"]} />
      <fog attach="fog" args={["#111715", 26, 58]} />
      <PerspectiveCamera makeDefault position={[14.5, 10.5, 15.5]} fov={32} near={0.1} far={100} />
      <ambientLight intensity={1.25} color="#f0e4d0" />
      <hemisphereLight args={["#d8cfbd", "#1b2925", 1.4]} />
      <directionalLight castShadow color="#ffe1ae" intensity={3.1} position={[9, 17, 12]} shadow-mapSize={[1024, 1024]} shadow-camera-near={1} shadow-camera-far={60} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      <directionalLight color="#8db3ad" intensity={0.65} position={[-12, 8, -9]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#29382f" roughness={0.94} />
      </mesh>
      <gridHelper args={[18, 18, "#7d765e", "#3f4d41"]} position={[0, 0.01, 0]} />
      <group ref={modelRef}>
        <DetailedBuilding landmark={landmark} season={season} />
      </group>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.52} scale={14} blur={2.8} far={8} resolution={512} color="#000000" />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} enablePan minPolarAngle={0.42} maxPolarAngle={1.45} target={[0, 1.8, 0]} />
    </>
  )
}

function FieldReference({ landmark, language }: { landmark: Landmark; language: ViewerLanguage }) {
  const [photo, setPhoto] = useState<CommonsPhoto | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading")
  const isChinese = language === "zh"

  useEffect(() => {
    const controller = new AbortController()
    setPhoto(null)
    setStatus("loading")
    fetchCommonsPhotos(landmark.title, landmark.chineseName, controller.signal)
      .then((photos) => {
        if (controller.signal.aborted) return
        setPhoto(photos[0] ?? null)
        setStatus(photos.length ? "ready" : "empty")
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error")
      })
    return () => controller.abort()
  }, [landmark.chineseName, landmark.id, landmark.title])

  return (
    <section className="building-model-viewer__reference" aria-label={isChinese ? "现场参考照片" : "Field reference photograph"}>
      <div className="building-model-viewer__reference-heading">
        <span className="micro"><ImageIcon size={12} strokeWidth={1.5} aria-hidden="true" /> {isChinese ? "现场参考" : "Field reference"}</span>
        <span>{isChinese ? "Wikimedia Commons" : "Wikimedia Commons"}</span>
      </div>
      {status === "loading" ? <div className="building-model-viewer__reference-loading" aria-hidden="true" /> : null}
      {photo ? (
        <a className="building-model-viewer__reference-photo" href={photo.sourceUrl} target="_blank" rel="noreferrer">
          <img src={photo.imageUrl} alt={photo.alt} />
          <span className="building-model-viewer__reference-open"><ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" /> {isChinese ? "查看原图" : "Open source"}</span>
        </a>
      ) : null}
      {status === "empty" || status === "error" ? (
        <a className="building-model-viewer__reference-empty" href={commonsSearchUrl(landmark.title)} target="_blank" rel="noreferrer">
          {isChinese ? "打开公开图像档案" : "Open the public image archive"} <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
        </a>
      ) : null}
      {photo ? (
        <p className="building-model-viewer__reference-credit">{photo.year ?? (isChinese ? "年代未知" : "Date unknown")} · {photo.artist} · {photo.license}</p>
      ) : null}
    </section>
  )
}

export function BuildingModelViewer({ landmark, language, season, onClose }: BuildingModelViewerProps) {
  const titleId = useId()
  const profile = landmark ? getModelProfile(landmark.id) : DEFAULT_PROFILE
  const isChinese = language === "zh"

  useEffect(() => {
    if (!landmark) return undefined
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [landmark, onClose])

  if (!landmark) return null

  return createPortal(
    <div className="building-model-viewer">
      <button className="building-model-viewer__backdrop" type="button" aria-label={isChinese ? "关闭建筑模型" : "Close building model"} onClick={onClose} />
      <section className="building-model-viewer__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="building-model-viewer__header">
          <div>
            <span className="micro">{isChinese ? "建筑研究模型 /" : "Architectural study /"} {landmark.chineseName}</span>
            <h2 id={titleId} className="display-serif">{isChinese ? landmark.chineseName : landmark.title}</h2>
            <p>{isChinese ? "基于现场影像与故宫建筑比例的可旋转重建。" : "A rotatable reconstruction informed by field photography and Forbidden City proportions."}</p>
          </div>
          <button className="icon-button" type="button" autoFocus aria-label={isChinese ? "关闭建筑模型" : "Close building model"} onClick={onClose}>
            <X size={17} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="building-model-viewer__body">
          <div className="building-model-viewer__stage">
            <Canvas shadows dpr={[1, 1.6]} camera={{ position: [14.5, 10.5, 15.5], fov: 32, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
              <ModelStage landmark={landmark} season={season} />
            </Canvas>
            <div className="building-model-viewer__stage-label"><Rotate3d size={13} strokeWidth={1.5} aria-hidden="true" /> {isChinese ? "拖动旋转 · 滚轮缩放" : "Drag to orbit · scroll to zoom"}</div>
          </div>
          <aside className="building-model-viewer__notes">
            <div className="building-model-viewer__note-heading">
              <Box size={15} strokeWidth={1.5} aria-hidden="true" />
              <span className="micro">{isChinese ? "形制拆解" : "Form study"}</span>
            </div>
            <h3 className="display-serif">{isChinese ? landmark.chineseName : landmark.title}</h3>
            <p className="building-model-viewer__model-note">{isChinese ? profile.roofNoteZh : profile.roofNote}</p>
            <div className="building-model-viewer__specs">
              <div><span className="micro">{isChinese ? "结构" : "Structure"}</span><strong>{isChinese ? profile.structureNoteZh : profile.structureNote}</strong></div>
              <div><span className="micro">{isChinese ? "朝向" : "Orientation"}</span><strong>{isChinese ? "南北中轴 / 礼制秩序" : "North–south axis / ritual order"}</strong></div>
              <div><span className="micro">{isChinese ? "重建" : "Reconstruction"}</span><strong>{isChinese ? "比例化程序模型" : "Proportional procedural model"}</strong></div>
            </div>
            <FieldReference landmark={landmark} language={language} />
          </aside>
        </div>

        <footer className="building-model-viewer__footer">
          <span><span className="status-dot" aria-hidden="true" /> {isChinese ? "参考现实建筑，而非抽象占位体量" : "Grounded in the real building, not an abstract placeholder mass"}</span>
          <button type="button" onClick={onClose}>{isChinese ? "返回地标详情" : "Return to site details"} <span aria-hidden="true">↗</span></button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
