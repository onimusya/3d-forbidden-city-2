import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../lib/i18n'

export type TimeOfDay = "day" | "night"
export type Season = "spring" | "summer" | "autumn" | "winter"

export type AtlasMoment = {
  season: Season
  timeOfDay: TimeOfDay
}

export type DiscoveryRecord = AtlasMoment & {
  id: string
  discoveredAt: string
}

export type RouteCompletion = AtlasMoment & {
  routeId: string
  completedAt: string
}

export type RouteProgress = {
  routeId: string
  stopIndex: number
}

const SEASON_ORDER: readonly Season[] = ["spring", "summer", "autumn", "winter"]

type AtlasState = {
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: string[]
  discoveryRecords: DiscoveryRecord[]
  completedRoutes: RouteCompletion[]
  routeProgress: RouteProgress | null
  language: Language
  progressOpen: boolean
  helpVisible: boolean
  soundEnabled: boolean
  timeOfDay: TimeOfDay
  season: Season
  resetViewSignal: number
  setSelected: (id: string | null) => void
  setHovered: (id: string | null) => void
  discover: (id: string, moment?: AtlasMoment) => boolean
  completeRoute: (routeId: string, moment?: AtlasMoment) => boolean
  setRouteProgress: (progress: RouteProgress | null) => void
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
      discoveryRecords: [],
      completedRoutes: [],
      routeProgress: null,
      language: 'en',
      progressOpen: false,
      helpVisible: true,
      soundEnabled: true,
      timeOfDay: "day",
      season: "summer",
      resetViewSignal: 0,
      setSelected: (selectedId) => set({ selectedId }),
      setHovered: (hoveredId) => set({ hoveredId }),
      discover: (id, moment = { season: "summer", timeOfDay: "day" }) => {
        const { discoveredIds } = get()
        if (discoveredIds.includes(id)) return false
        set((state) => ({
          discoveredIds: [...discoveredIds, id],
          discoveryRecords: [...state.discoveryRecords, { id, discoveredAt: new Date().toISOString(), ...moment }],
        }))
        return true
      },
      completeRoute: (routeId, moment = { season: "summer", timeOfDay: "day" }) => {
        if (get().completedRoutes.some((route) => route.routeId === routeId)) return false
        set((state) => ({
          completedRoutes: [...state.completedRoutes, { routeId, completedAt: new Date().toISOString(), ...moment }],
        }))
        return true
      },
      setRouteProgress: (routeProgress) => set({ routeProgress }),
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
        discoveryRecords: state.discoveryRecords,
        completedRoutes: state.completedRoutes,
        routeProgress: state.routeProgress,
        language: state.language,
        soundEnabled: state.soundEnabled,
        timeOfDay: state.timeOfDay,
        season: state.season,
      }),
    },
  ),
)
