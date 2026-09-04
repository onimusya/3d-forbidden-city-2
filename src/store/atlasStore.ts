import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../lib/i18n'

export type TimeOfDay = "day" | "night"
export type Season = "spring" | "summer" | "autumn" | "winter"

const SEASON_ORDER: readonly Season[] = ["spring", "summer", "autumn", "winter"]

type AtlasState = {
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: string[]
  language: Language
  progressOpen: boolean
  helpVisible: boolean
  soundEnabled: boolean
  timeOfDay: TimeOfDay
  season: Season
  resetViewSignal: number
  setSelected: (id: string | null) => void
  setHovered: (id: string | null) => void
  discover: (id: string) => boolean
  setLanguage: (language: Language) => void
  setProgressOpen: (open: boolean) => void
  setHelpVisible: (visible: boolean) => void
  toggleSound: () => void
  toggleTimeOfDay: () => void
  cycleSeason: () => void
  resetView: () => void
}

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set, get) => ({
      selectedId: null,
      hoveredId: null,
      discoveredIds: [],
      language: 'en',
      progressOpen: false,
      helpVisible: true,
      soundEnabled: true,
      timeOfDay: "day",
      season: "summer",
      resetViewSignal: 0,
      setSelected: (selectedId) => set({ selectedId }),
      setHovered: (hoveredId) => set({ hoveredId }),
      discover: (id) => {
        const { discoveredIds } = get()
        if (discoveredIds.includes(id)) return false
        set({ discoveredIds: [...discoveredIds, id] })
        return true
      },
      setLanguage: (language) => set({ language }),
      setProgressOpen: (progressOpen) => set({ progressOpen }),
      setHelpVisible: (helpVisible) => set({ helpVisible }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleTimeOfDay: () => set((state) => ({ timeOfDay: state.timeOfDay === "day" ? "night" : "day" })),
      cycleSeason: () => set((state) => {
        const index = SEASON_ORDER.indexOf(state.season)
        return { season: SEASON_ORDER[(index + 1) % SEASON_ORDER.length] }
      }),
      resetView: () => set((state) => ({ resetViewSignal: state.resetViewSignal + 1 })),
    }),
    {
      name: 'forbidden-city-atlas',
      partialize: (state) => ({
        discoveredIds: state.discoveredIds,
        language: state.language,
        soundEnabled: state.soundEnabled,
        timeOfDay: state.timeOfDay,
        season: state.season,
      }),
    },
  ),
)
