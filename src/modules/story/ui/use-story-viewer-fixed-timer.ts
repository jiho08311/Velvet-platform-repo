import { useCallback, useEffect, useRef } from "react"

type UseStoryViewerFixedTimerInput = {
  currentIndex: number
  durationMs: number
  enabled: boolean
  isPaused: boolean
  open: boolean
  progress: number
  storyId?: string
  onComplete: () => void
  onProgressChange: (progress: number) => void
}

export function useStoryViewerFixedTimer({
  currentIndex,
  durationMs,
  enabled,
  isPaused,
  open,
  progress,
  storyId,
  onComplete,
  onProgressChange,
}: UseStoryViewerFixedTimerInput) {
  const timerRef = useRef<number | null>(null)
  const timerStartedAtRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    timerStartedAtRef.current = null
  }, [])

  useEffect(() => {
    if (!open || !storyId) return

    clearTimer()
    onProgressChange(0)
  }, [clearTimer, onProgressChange, open, storyId])

  useEffect(() => {
    if (!open || !storyId) return
    if (!enabled) return

    if (isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (timerStartedAtRef.current === null) {
      timerStartedAtRef.current = Date.now() - (progress / 100) * durationMs
    }

    timerRef.current = window.setInterval(() => {
      if (timerStartedAtRef.current === null) return

      const elapsed = Date.now() - timerStartedAtRef.current
      const nextProgress = Math.min(100, (elapsed / durationMs) * 100)

      onProgressChange(nextProgress)

      if (nextProgress >= 100) {
        clearTimer()
        onComplete()
      }
    }, 50)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    clearTimer,
    currentIndex,
    durationMs,
    enabled,
    isPaused,
    onComplete,
    onProgressChange,
    open,
    progress,
    storyId,
  ])

  return {
    clearTimer,
  }
}
