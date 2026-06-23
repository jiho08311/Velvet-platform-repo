"use client"

type StoryMusicArtworkProps = {
  artworkUrl?: string | null
  title?: string | null
  imageClassName: string
  fallbackClassName: string
  fallbackLabel: string
}

export function StoryMusicArtwork({
  artworkUrl,
  title,
  imageClassName,
  fallbackClassName,
  fallbackLabel,
}: StoryMusicArtworkProps) {
  if (artworkUrl) {
    return (
      <img
        src={artworkUrl}
        alt={title ?? "Selected music"}
        className={imageClassName}
      />
    )
  }

  return <div className={fallbackClassName}>{fallbackLabel}</div>
}
