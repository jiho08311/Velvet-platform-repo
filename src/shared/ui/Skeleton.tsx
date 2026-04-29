import type { CSSProperties } from "react"

const skeletonBaseClassName = "relative overflow-hidden bg-zinc-900"
const skeletonPulseClassName =
  "absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-zinc-800 to-transparent"

export type SkeletonProps = {
  width?: number | string
  height?: number | string
  className?: string
  rounded?: string
}

export function Skeleton({
  width = "100%",
  height = 16,
  className = "",
  rounded = "rounded-xl",
}: SkeletonProps) {
  const style: CSSProperties = {
    width,
    height,
  }
  const skeletonClassName = `${skeletonBaseClassName} ${rounded} ${className}`

  return (
    <div
      className={skeletonClassName}
      style={style}
      aria-hidden="true"
    >
      <div className={skeletonPulseClassName} />
    </div>
  )
}
