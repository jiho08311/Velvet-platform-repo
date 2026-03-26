import Link from "next/link"

export function AppSidebar() {
  return (
    <aside className="hidden md:block w-72 shrink-0 px-4 py-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <Link
            href="/feed"
            className="block rounded-xl bg-[#C2185B] px-4 py-3 text-sm text-white"
          >
            Home
          </Link>

          <Link
            href="/messages"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Message
          </Link>

          <Link
            href="/search"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Search
          </Link>

          <Link
            href="/explore-tab"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Explore Tab
          </Link>

          <Link
            href="/notifications"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Notification
          </Link>

          <Link
            href="/post/new"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Post
          </Link>

          <Link
            href="/profile"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Profile
          </Link>

          <Link
            href="/settings"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Settings
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/become-creator"
            className="block rounded-xl bg-[#C2185B] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
          >
            Become creator
          </Link>
        </div>
      </div>
    </aside>
  )
}