type AvatarProps = {
  src?: string | null
  alt: string
  fallback: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClassNameMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
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
        className={`${sizeClassName} rounded-full border border-zinc-800 object-cover`}
      />
    )
  }

  return (
    <div
      aria-label={alt}
      className={`${sizeClassName} flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 font-semibold text-white`}
    >
      {label}
    </div>
  )
}