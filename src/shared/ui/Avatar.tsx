type AvatarSize = "sm" | "md" | "lg" | "xl"

type AvatarProps = {
  src?: string | null
  alt: string
  fallback: string
  size?: AvatarSize
}

const sizeClassNameMap: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
}

const avatarBaseClassName = "rounded-full border border-zinc-800"
const avatarImageClassName = `${avatarBaseClassName} object-cover`
const avatarFallbackClassName = `${avatarBaseClassName} flex items-center justify-center bg-zinc-900 font-semibold text-white`

function getFallbackLabel(fallback: string) {
  return fallback.trim().slice(0, 1).toUpperCase()
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
}: AvatarProps) {
  const sizeClassName = sizeClassNameMap[size]
  const label = getFallbackLabel(fallback)

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClassName} ${avatarImageClassName}`}
      />
    )
  }

  return (
    <div
      aria-label={alt}
      className={`${sizeClassName} ${avatarFallbackClassName}`}
    >
      {label}
    </div>
  )
}
