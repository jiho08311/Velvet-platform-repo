type Tone = "default" | "success" | "warning" | "danger" | "info"

type StatusBadgeProps = {
  label: string
  tone?: Tone
}

const toneClassNameMap: Record<Tone, string> = {
  default: "border-zinc-200 bg-zinc-100 text-zinc-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-[#C2185B]/20 bg-[#C2185B]/10 text-[#C2185B]",
}

function getToneFromLabel(label: string): Tone {
  const value = label.toLowerCase()

  if (value === "pending") return "warning"
  if (value === "paid" || value === "success") return "success"
  if (value === "failed" || value === "error") return "danger"
  if (value === "unread") return "info"
  if (value === "read") return "default"

  return "default"
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const resolvedTone: Tone = tone ?? getToneFromLabel(label)

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium capitalize tracking-wide ${toneClassNameMap[resolvedTone]}`}
    >
      {label}
    </span>
  )
}