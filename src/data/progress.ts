export type ProgressStatus = 'complete' | 'current'

export interface ProgressEntry {
  id: string
  round: number
  title: string
  date: string
  status: ProgressStatus
  summary: string
  comparison: string
  criticVerdict: string
  remainingGaps: string[]
  improvements: string[]
}

export const PROGRESS_HISTORY: ProgressEntry[] = [
  {
    id: 'round-01-axis',
    round: 1,
    title: 'Establish the axis',
    date: '2026-08-12',
    status: 'complete',
    summary: 'A first navigable massing study for the imperial north-south route.',
    comparison: 'Moved from a flat site plan to a readable sequence of twelve spatial targets.',
    criticVerdict: 'The central idea landed immediately; the scene still felt like one long corridor.',
    remainingGaps: ['Side-court destinations', 'Clear outer-to-inner court transition', 'A visual reason to pause'],
    improvements: ['Set the Three Great Halls as the first scale hierarchy', 'Reserved a continuous camera path through the axis'],
  },
  {
    id: 'round-02-courts',
    round: 2,
    title: 'Calibrate the courts',
    date: '2026-08-16',
    status: 'complete',
    summary: 'East and west destinations now pull the viewer away from the central spine.',
    comparison: 'Compared with Round 01, side-court targets read as destinations instead of background props.',
    criticVerdict: 'The plan gained depth and choice; the east-west balance needs a stronger counterweight.',
    remainingGaps: ['Western court discovery cue', 'Consistent landmark naming', 'A compact overview state'],
    improvements: ['Added Literary Brilliance and Mental Cultivation as lateral anchors', 'Separated gate, court, and garden categories'],
  },
  {
    id: 'round-03-hierarchy',
    round: 3,
    title: 'Give the roofs hierarchy',
    date: '2026-08-20',
    status: 'complete',
    summary: 'Scale, color, and elevation now distinguish ceremonial power from domestic quiet.',
    comparison: 'The Hall of Supreme Harmony is now the visual peak, while the Inner Court recedes into a calmer rhythm.',
    criticVerdict: 'The hierarchy is convincing at a glance; factual context is doing more work than ornament.',
    remainingGaps: ['More restrained color on the southern approach', 'Historical dates in the detail view', 'A meaningful “locked” state'],
    improvements: ['Introduced warm vermilion and muted jade accents', 'Gave featured landmarks a distinct discovery label'],
  },
  {
    id: 'round-04-discovery',
    round: 4,
    title: 'Make discovery legible',
    date: '2026-08-24',
    status: 'complete',
    summary: 'The atlas began to explain where the visitor is, what is nearby, and why it matters.',
    comparison: 'Compared with Round 03, the experience now supports browsing as well as a guided first journey.',
    criticVerdict: 'The interface feels quieter and more assured; the progress story should be as specific as the architecture.',
    remainingGaps: ['Live build comparison', 'Bilingual shell copy', 'A final pass on mobile density'],
    improvements: ['Added concise facts and eras to every landmark', 'Defined language-safe labels for exploration and progress states'],
  },
  {
    id: 'round-05-live-atlas',
    round: 5,
    title: 'Current build · quiet confidence',
    date: '2026-08-28',
    status: 'complete',
    summary: 'The content layer is ready to power a bilingual, navigable Forbidden City atlas.',
    comparison: 'The current pass holds the axis, side courts, discovery states, and progress history in one coherent system.',
    criticVerdict: 'The map now invites orbit, zoom, and discovery; the next gain is even quieter mobile guidance.',
    remainingGaps: ['Refine the sub-360px touch discovery cue', 'Tune low-power WebGL framing and texture memory', 'Add deeper focus restoration to the landmark inspector'],
    improvements: ['Typed landmark and progress contracts', 'Localized shell vocabulary in English and simplified Chinese', 'Pointer-safe controls, modal focus behavior, and lazy scene loading'],
  },
  {
    id: 'round-06-expedition-focus',
    round: 6,
    title: 'Make the landmark feel entered',
    date: '2026-09-05',
    status: 'complete',
    summary: 'Selecting a site now glides the visitor into a closer isometric field view while the atlas stays legible around it.',
    comparison: 'Compared with Round 05, the selected building has a stronger visual claim on desktop and mobile, with a clear path back to the overview.',
    criticVerdict: 'The expedition view now rewards a click: the building, marker, and field note read as one moment instead of three separate layers.',
    remainingGaps: ['Guide a north-to-south route between nearby sites', 'Turn discoveries into a richer collectible archive', 'Tune low-power WebGL framing and texture memory'],
    improvements: ['Added cinematic camera focus with a closer isometric zoom', 'Added a pulsing focus frame around the selected building', 'Restored the atlas view when the inspector closes', 'Hardened scene marker hit targets for reliable pointer activation'],
  },
  {
    id: 'round-07-procession',
    round: 7,
    title: 'Guide the procession',
    date: '2026-09-05',
    status: 'current',
    summary: 'Curated routes now turn the model into a sequence of stops, with the camera, map, and field notes moving together.',
    comparison: 'Compared with Round 06, the atlas now gives the visitor a reason to move from one landmark to the next instead of choosing isolated points.',
    criticVerdict: 'The route layer adds momentum without taking the map away; the next gain is persistence and a richer sense of collection.',
    remainingGaps: ['Persist route progress between visits', 'Turn discoveries into a richer collectible archive', 'Tune low-power WebGL framing and texture memory'],
    improvements: ['Added three curated processions across the central axis, inner court, and living flanks', 'Synced route stops with cinematic camera focus and landmark detail cards', 'Added a mobile route entry point and responsive stacked expedition layout'],
  },
]
