# DESIGN.md: Forbidden City Atlas

## Source

- Reference direction: [Daniel's Design & Dev Architectural Studio](https://www.daniels-architects.com/)
- Reference implementation: [andrewwoan/daniels-home-office-portfolio](https://github.com/andrewwoan/daniels-home-office-portfolio)
- Capture date: 2026-08-28
- Evidence: Firecrawl branding/images capture, public source README, and screenshot capture in `.firecrawl/`

## Reference Screenshot

![Reference architecture portfolio screenshot](./.firecrawl/daniels-reference.png)

The reference is a sparse, full-viewport black canvas with a very small white home glyph and minimal white type. The atlas should preserve that confidence and negative space while introducing a warmer, legible field-guide system around the map.

## Design Summary

The map is the hero: an editorial, isometric miniature of the Forbidden City floating in a near-black atmospheric field. UI is a quiet layer of navigation tools rather than a competing website frame. Use thin rules, mono metadata, serif display type, translucent panels, and a restrained imperial palette: ink, aged jade, oxidized teal, vermilion, and muted gold.

## Design Tokens

### Colors

- `ink`: `#0D1110` — full-bleed background
- `panel`: `rgba(17, 22, 20, .82)` — translucent controls and inspector
- `paper`: `#E9E7DD` — primary type
- `muted`: `#8F9893` — secondary copy and metadata
- `gold`: `#E2AE53` — selected landmarks, rules, progress
- `vermilion`: `#D86445` — discovery, gates, live state
- `jade`: `#78B2A1` — water, navigation, secondary status
- Reference inferred: source branding reports a black background, white type, zero radius, and Plus Jakarta Sans / Times New Roman signals; exact visual values are approximate because the page is mostly rendered content.

### Typography

- Display: `Playfair Display`, fallback Georgia; use for the title and landmark names.
- UI: `Manrope`, fallback system sans; use for controls and body copy.
- Metadata: `DM Mono`, fallback monospace; use for coordinates, labels, and progress.
- Use compact uppercase labels with increased tracking, 12–13px body copy, and oversized but short display lines.

### Spacing And Layout

- Full-screen viewport, no page scroll on the map route.
- 4px base rhythm, 1px hairlines, 0–18px corner radius only where a panel needs softness.
- Keep the 3D canvas visually dominant; desktop overlays live at the top edge, lower-left and right edge. On mobile, collapse to a top bar, bottom inspector sheet, and a compact discovery rail.
- Prefer glass panels with 18–24px blur and very soft inset highlights over heavy shadows.

## Components

- Top bar: compact brand mark, route labels, language toggle, progress entry point.
- Atlas hero: short field-guide kicker, serif title, one sentence of context, map status.
- 3D map: orthographic camera, OrbitControls, tiered imperial roofs, axial courtyards, moat, trees, gates, beacons, hover labels.
- Inspector: selected landmark detail, Chinese name, era, fact, and a discover action.
- Discovery rail: collected count and nearby/featured landmarks.
- Progress page: visible round history, screenshot comparison framing, critic verdicts, gaps, and improvement timeline.
- Interaction hint: drag/rotate/zoom guidance that can be dismissed.

## Page Patterns

1. The initial state is instantly legible: map silhouette, title, discovery count, and interaction hint are visible without a tutorial modal.
2. Hover raises a landmark and reveals its name; click selects it and opens the inspector with a small, tactile camera emphasis.
3. Discovering a landmark adds it to the persistent field notes count and shows a brief confirmation.
4. Progress opens as a full-screen editorial drawer, preserving the map context beneath a dark veil.
5. Mobile keeps the 3D map prominent while converting side panels to bottom sheets and keeping buttons thumb-sized.

## Content Style

Use concise, sensory copy: historical facts should be specific, but the interface should feel like an invitation to wander. Labels use English with Chinese names as a visual anchor. CTAs are direct and exploratory: `ENTER THE ATLAS`, `DISCOVER SITE`, `OPEN FIELD NOTES`, `RESET VIEW`.

## Agent Build Instructions

- Keep all geometry procedural so the experience has no fragile asset dependency.
- Use R3F mesh pointer events for landmark interaction and OrbitControls for drag, rotate, pan, and zoom.
- Keep DOM overlays pointer-safe: controls should be clickable, and the canvas should remain available as the primary interaction surface.
- Use GSAP only for meaningful transitions (selection/camera emphasis, inspector entrance, progress drawer), with a reduced-motion fallback.
- Persist only user-facing preferences and discoveries; never hide the first-use map behind onboarding.

## Rerun Inputs

workflow: firecrawl-website-design-clone
source_url: https://www.daniels-architects.com/
target_stack: React, TypeScript, Vite, Three.js, React Three Fiber, Drei, GSAP, Tailwind CSS, Zustand
output: DESIGN.md
