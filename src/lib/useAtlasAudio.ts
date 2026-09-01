import { useCallback, useEffect, useRef } from 'react'

export type AtlasSound = 'select' | 'open' | 'discover' | 'close'

type AudioAsset = {
  mp3: string
  ogg: string
  volume: number
}

const audioUrl = (fileName: string) => `${import.meta.env.BASE_URL}audio/${fileName}`

const AUDIO_ASSETS: Record<AtlasSound, AudioAsset> = {
  select: {
    mp3: audioUrl('kenney/click_001.mp3'),
    ogg: audioUrl('kenney/click_001.ogg'),
    volume: 0.18,
  },
  open: {
    mp3: audioUrl('kenney/open_001.mp3'),
    ogg: audioUrl('kenney/open_001.ogg'),
    volume: 0.2,
  },
  discover: {
    mp3: audioUrl('kenney/confirmation_001.mp3'),
    ogg: audioUrl('kenney/confirmation_001.ogg'),
    volume: 0.24,
  },
  close: {
    mp3: audioUrl('kenney/close_001.mp3'),
    ogg: audioUrl('kenney/close_001.ogg'),
    volume: 0.17,
  },
}

const BGM_ASSET = {
  mp3: audioUrl('heavenly-loop.mp3'),
  ogg: audioUrl('heavenly-loop.ogg'),
}

function createAudio(asset: AudioAsset | typeof BGM_ASSET) {
  const audio = new Audio()
  audio.preload = 'auto'
  const supportsOgg = audio.canPlayType('audio/ogg; codecs="vorbis"') !== ''
  audio.src = supportsOgg ? asset.ogg : asset.mp3
  if ('volume' in asset) audio.volume = asset.volume
  return audio
}

/**
 * Keeps audio opt-in from the browser's point of view: the first real gesture
 * unlocks the quiet loop, while every effect remains independently muteable.
 */
export function useAtlasAudio(soundEnabled: boolean) {
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const sfxRef = useRef<Partial<Record<AtlasSound, HTMLAudioElement>>>({})
  const enabledRef = useRef(soundEnabled)
  const startedRef = useRef(false)

  const startBgm = useCallback((allowWhenDisabled = false) => {
    const bgm = bgmRef.current
    if (!bgm || (!enabledRef.current && !allowWhenDisabled) || !bgm.paused) return

    const playback = bgm.play()
    startedRef.current = true
    void playback.catch(() => {
      startedRef.current = false
    })
  }, [])

  useEffect(() => {
    enabledRef.current = soundEnabled
    const bgm = bgmRef.current
    if (!bgm) return

    if (!soundEnabled) {
      bgm.pause()
      return
    }

    if (startedRef.current) {
      void bgm.play().catch(() => {
        startedRef.current = false
      })
    }
  }, [soundEnabled])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return

    const bgm = createAudio(BGM_ASSET)
    bgm.loop = true
    bgm.volume = 0.14
    bgmRef.current = bgm

    return () => {
      bgm.pause()
      bgm.src = ''
      bgmRef.current = null
      Object.values(sfxRef.current).forEach((sound) => {
        sound?.pause()
        if (sound) sound.src = ''
      })
      sfxRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const startFromGesture = () => startBgm()
    const capture = { capture: true }
    const touchCapture = { capture: true, passive: true }

    window.addEventListener('pointerdown', startFromGesture, capture)
    window.addEventListener('keydown', startFromGesture, capture)
    window.addEventListener('touchstart', startFromGesture, touchCapture)

    return () => {
      window.removeEventListener('pointerdown', startFromGesture, capture)
      window.removeEventListener('keydown', startFromGesture, capture)
      window.removeEventListener('touchstart', startFromGesture, touchCapture)
    }
  }, [startBgm])

  const playSfx = useCallback((soundName: AtlasSound) => {
    if (!enabledRef.current) return

    startBgm()
    const existingSound = sfxRef.current[soundName]
    const sound = existingSound ?? createAudio(AUDIO_ASSETS[soundName])
    sfxRef.current[soundName] = sound
    sound.currentTime = 0
    void sound.play().catch(() => undefined)
  }, [startBgm])

  return { playSfx, startBgm }
}
