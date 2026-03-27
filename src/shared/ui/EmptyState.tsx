import Link from "next/link"

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
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center text-white">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 h-12 w-12 rounded-2xl bg-zinc-800" />

        <h2 className="text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>

        {description ? (
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {description}
          </p>
        ) : null}

        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex min-h-[44px] items-center rounded-2xl bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}