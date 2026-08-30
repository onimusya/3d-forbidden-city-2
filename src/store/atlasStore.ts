import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../lib/i18n'

type AtlasState = {
  selectedId: string | null
  hoveredId: string | null
  discoveredIds: string[]
  language: Language
  progressOpen: boolean
  helpVisible: boolean
  soundEnabled: boolean
  resetViewSignal: number
  setSelected: (id: string | null) => void
  setHovered: (id: string | null) => void
  discover: (id: string) => boolean
  setLanguage: (language: Language) => void
  setProgressOpen: (open: boolean) => void
  setHelpVisible: (visible: boolean) => void
  toggleSound: () => void
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
      resetView: () => set((state) => ({ resetViewSignal: state.resetViewSignal + 1 })),
    }),
    {
      name: 'forbidden-city-atlas',
      partialize: (state) => ({
        discoveredIds: state.discoveredIds,
        language: state.language,
        soundEnabled: state.soundEnabled,
      }),
    },
  ),
)
