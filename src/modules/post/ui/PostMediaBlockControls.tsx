"use client"

import {
  getComposerMinorCTAClassName,
  resolveComposerToolChipClassName,
} from "./post-composer-ui-state"

export const POST_TEXT_COLOR_SWATCHES = [
  "#FFFFFF",
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
]

export function AddCarouselItemsButton({ onClick }: { onClick: () => void }) {
  return <MinorCTAButton onClick={onClick}>+</MinorCTAButton>
}

export function MinorCTAButton({
  children,
  onClick,
}: {
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={getComposerMinorCTAClassName()}
    >
      {children}
    </button>
  )
}

export function MediaToolChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={resolveComposerToolChipClassName(active)}
    >
      {children}
    </button>
  )
}
