// src/shared/ui/Avatar.tsx
type AvatarProps = {
  src?: string | null
  alt: string
  fallback: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClassNameMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
}: AvatarProps) {
  const sizeClassName = sizeClassNameMap[size]
  const label = fallback.trim().slice(0, 1).toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClassName} rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      aria-label={alt}
      className={`${sizeClassName} flex items-center justify-center rounded-full bg-zinc-800 font-semibold text-white`}
    >
      {label}
    </div>
  )
}