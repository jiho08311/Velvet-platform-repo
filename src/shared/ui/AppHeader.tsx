import Link from "next/link"
import Image from "next/image"

type AppHeaderProps = {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function AppHeader({
  title = "Velvet",
  description,
  action,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <Link href="/feed" className="flex items-center gap-2">
            <Image
              src="/logo-mark.png"
              alt="Velvet logo"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-base font-semibold text-zinc-900">
              {title}
            </span>
          </Link>

          {description ? (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/feed"
            className="hidden rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 sm:inline-flex"
          >
            Feed
          </Link>
          <Link
            href="/dashboard"
            className="hidden rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 sm:inline-flex"
          >
            Dashboard
          </Link>
          <Link
            href="/search"
            className="hidden rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 sm:inline-flex"
          >
            Search
          </Link>
          <Link
            href="/notifications"
            className="hidden rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 sm:inline-flex"
          >
            Notifications
          </Link>
          {action}
        </div>
      </div>
    </header>
  )
}