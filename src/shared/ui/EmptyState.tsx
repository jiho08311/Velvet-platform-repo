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
    <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-900">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 text-3xl">💗</div>

        <h2 className="text-lg font-semibold text-zinc-900">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {description}
          </p>
        ) : null}

        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-5 inline-flex items-center rounded-md bg-[#C2185B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D81B60]"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}