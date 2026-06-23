import { useEffect, type RefObject } from "react"

type UseStoryViewerAudioInput = {
  audioRef: RefObject<HTMLAudioElement>
  currentIndex: number
  musicPreviewUrl: string | null
  open: boolean
  onAudioErrorChange: (hasError: boolean) => void
}

export function useStoryViewerAudio({
  audioRef,
  currentIndex,
  musicPreviewUrl,
  open,
  onAudioErrorChange,
}: UseStoryViewerAudioInput) {
  useEffect(() => {
    onAudioErrorChange(false)
  }, [currentIndex, musicPreviewUrl, onAudioErrorChange, open])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    if (!open || !musicPreviewUrl) {
      audio.pause()
      audio.currentTime = 0
      onAudioErrorChange(false)
      return
    }

    onAudioErrorChange(false)
    audio.currentTime = 0

    void audio.play().catch(() => {
      onAudioErrorChange(true)
    })

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [audioRef, currentIndex, musicPreviewUrl, onAudioErrorChange, open])
}
