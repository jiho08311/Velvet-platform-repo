"use client"

import Link from "next/link"

type FeedComposerProps = {
  placeholder?: string
}

export function FeedComposer({
  placeholder = "Share something...",
}: FeedComposerProps) {
  return (
    <Link
      href="/post/new"
      className="block rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-zinc-700"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
          +
        </div>

        <div className="flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-400">
          {placeholder}
        </div>
      </div>
    </Link>
  )
}