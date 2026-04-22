type StatusBadgeTone =
  | "default"
  | "neutral"
  | "subtle"
  | "info"
  | "success"
  | "warning"
  | "danger"

type StatusBadgeProps = {
  label: string
  tone?: StatusBadgeTone
  className?: string
}

const baseClassName =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"

const toneStyles: Record<StatusBadgeTone, string> = {
  default:
    "border border-zinc-800 bg-zinc-950 text-zinc-300",
  neutral:
    "border border-zinc-700 bg-zinc-900 text-white",
  subtle:
    "border border-zinc-800 bg-zinc-950 text-zinc-400",
  info:
    "bg-[#C2185B] text-white",
  success:
    "border border-emerald-700 bg-emerald-900/40 text-emerald-300",
  warning:
    "border border-yellow-700 bg-yellow-900/40 text-yellow-300",
  danger:
    "border border-red-700 bg-red-900/40 text-red-300",
}

export function StatusBadge({
  label,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span className={`${baseClassName} ${toneStyles[tone]} ${className}`}>
      {label}
    </span>
  )
}