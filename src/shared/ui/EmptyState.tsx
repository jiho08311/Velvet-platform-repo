import Link from "next/link"
import { RestrictedStateShell } from "./RestrictedStateShell"

export type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

const emptyStateActionClassName =
  [
    "inline-flex",
    "min-h-[44px]",
    "items-center",
    "justify-center",
    "rounded-2xl",
    "px-4",
    "py-2",
    "text-sm",
    "font-semibold",
    "transition",
    "whitespace-nowrap",
    "bg-[#C2185B]",
    "text-white",
    "hover:bg-[#D81B60]",
    "active:bg-[#AD1457]",
  ].join(" ")

const emptyStateVisualClassName =
  "h-12 w-12 rounded-2xl bg-zinc-800"

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
        className={emptyStateActionClassName}
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
      visual={<div className={emptyStateVisualClassName} />}
    />
  )
}
