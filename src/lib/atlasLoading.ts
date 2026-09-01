import { useSyncExternalStore } from 'react'

export type AtlasLoadingSnapshot = {
  active: boolean
  progress: number
  item: string
  loaded: number
  total: number
  errors: string[]
}

type LoadingManagerLike = {
  onStart?: (url: string, loaded: number, total: number) => void
  onLoad?: () => void
  onProgress?: (url: string, loaded: number, total: number) => void
  onError?: (url: string) => void
}

const initialSnapshot: AtlasLoadingSnapshot = {
  active: false,
  progress: 0,
  item: '',
  loaded: 0,
  total: 0,
  errors: [],
}

let snapshot = initialSnapshot
const listeners = new Set<() => void>()
let managerRegistered = false

function publish(next: Partial<AtlasLoadingSnapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

function progressFor(loaded: number, total: number) {
  return total > 0 ? Math.round((loaded / total) * 100) : 0
}

export function registerAtlasLoadingManager(manager: LoadingManagerLike) {
  if (managerRegistered) return
  managerRegistered = true

  const previousOnStart = manager.onStart
  const previousOnLoad = manager.onLoad
  const previousOnProgress = manager.onProgress
  const previousOnError = manager.onError

  manager.onStart = (url, loaded, total) => {
    publish({
      active: true,
      item: url,
      loaded,
      total,
      progress: progressFor(loaded, total),
    })
    previousOnStart?.(url, loaded, total)
  }

  manager.onLoad = () => {
    publish({ active: false, progress: 100 })
    previousOnLoad?.()
  }

  manager.onProgress = (url, loaded, total) => {
    publish({
      active: true,
      item: url,
      loaded,
      total,
      progress: progressFor(loaded, total),
    })
    previousOnProgress?.(url, loaded, total)
  }

  manager.onError = (url) => {
    publish({ errors: [...snapshot.errors, url] })
    previousOnError?.(url)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return snapshot
}

export function useAtlasLoading() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
