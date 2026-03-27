import type { CSSProperties } from "react"

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

  return (
    <div
      className={`relative overflow-hidden bg-zinc-900 ${rounded} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  )
}