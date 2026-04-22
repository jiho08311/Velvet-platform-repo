import Link from "next/link"
import { RestrictedStateShell } from "./RestrictedStateShell"

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  const action =
    actionLabel && actionHref ? (
      <Link
        href={actionHref}
        className="inline-flex min-h-[44px] items-center rounded-2xl bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
      >
        {actionLabel}
      </Link>
    ) : null

  return (
    <RestrictedStateShell
      align="center"
      title={title}
      description={description}
      action={action}
      visual={<div className="h-12 w-12 rounded-2xl bg-zinc-800" />}
    />
  )
}