import type { ReactNode } from "react"

type AdminStatCardSize = "default" | "compact"
type AdminStatCardLabelTone = "default" | "muted"

export type AdminStatCardProps = {
  label: string
  value: ReactNode
  helperText?: string
  labelTone?: AdminStatCardLabelTone
  size?: AdminStatCardSize
}

const adminStatCardClassName =
  "rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"

const adminStatCardHelperClassName = "mt-2 text-xs text-zinc-500"

const adminStatCardLabelClassNames = {
  default: "text-sm text-zinc-400",
  muted: "text-sm text-zinc-500",
} satisfies Record<AdminStatCardLabelTone, string>

const adminStatCardValueClassNames = {
  default: "mt-3 text-3xl font-semibold text-white",
  compact: "mt-2 text-2xl font-semibold text-white",
} satisfies Record<AdminStatCardSize, string>

export function AdminStatCard({
  label,
  value,
  helperText,
  labelTone = "default",
  size = "default",
}: AdminStatCardProps) {
  return (
    <div className={adminStatCardClassName}>
      <p className={adminStatCardLabelClassNames[labelTone]}>{label}</p>
      <p className={adminStatCardValueClassNames[size]}>{value}</p>
      {helperText ? (
        <p className={adminStatCardHelperClassName}>{helperText}</p>
      ) : null}
    </div>
  )
}
