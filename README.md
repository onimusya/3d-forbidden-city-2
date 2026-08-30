# Forbidden City Atlas

An interactive isometric 3D atlas of Beijing’s Forbidden City. Explore the imperial axis, rotate and pan the grounds, zoom into thresholds, hover landmarks, and open detailed site records.

## Stack

- React + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- GSAP for interface and camera motion
- Zustand for exploration state
- Tailwind CSS through the Vite plugin

## Getting started

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The development server also accepts `*.trycloudflare.com` hosts for tunnel testing.

## Commands

```bash
pnpm dev              # Start the Vite development server
pnpm typecheck        # Run TypeScript project checks
pnpm build            # Create the production bundle in dist/
pnpm preview          # Preview the production bundle locally
pnpm generate:model   # Regenerate the Forbidden City GLB asset
```

## 3D model

The static Forbidden City geometry is served from [`public/models/forbidden-city-atlas.glb`](public/models/forbidden-city-atlas.glb) and loaded at runtime with Drei’s `useGLTF`.

The checked-in GLB is generated from [`scripts/generate-forbidden-city-glb.mjs`](scripts/generate-forbidden-city-glb.mjs). After changing the source geometry in that generator, run:

```bash
pnpm generate:model
```

The React scene keeps the interactive landmark beacons, hover labels, lighting effects, camera controls, and detail cards separate from the static GLB. A procedural scene is retained as a loading fallback.

## Interaction model

- Drag to orbit the isometric view.
- Shift-drag or right-drag to pan across the grounds.
- Scroll or pinch to zoom.
- Hover a building marker to reveal its name and category.
- Click a marker or building to open the matching site record.
- Mark discoveries from the detail card and track progress in the atlas.

## Project layout

```text
src/
  components/
    MapScene.tsx                    R3F canvas, camera, and controls
    scene/ForbiddenCityWorld.tsx    GLB loader, fallback, markers, atmosphere
    scene/primitives.tsx            Procedural fallback geometry and beacons
  data/landmarks.ts                 Landmark content and coordinates
  store/atlasStore.ts               Zustand exploration state
public/models/                      Deployable GLB asset
scripts/                            Asset generation scripts
```

## Production

Build the app with `pnpm build`, then serve the generated `dist/` directory from a static host. The GLB under `dist/models/` is copied from `public/models/` during the Vite build.
