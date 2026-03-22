import Link from "next/link"

import type { CreatorSearchResult } from "../types"

type ExploreCreatorCardProps = {
  creator: CreatorSearchResult
}

export function ExploreCreatorCard({
  creator,
}: ExploreCreatorCardProps) {
  const initial = creator.displayName
    ? creator.displayName.slice(0, 1).toUpperCase()
    : "?"

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="group block rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_40px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatarUrl}
              alt={creator.displayName}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
            />
          ) : (
            <span className="text-sm font-semibold text-zinc-300 transition duration-200 group-hover:scale-105">
              {initial}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-white">
              {creator.displayName}
            </p>

            {creator.isVerified ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                Verified
              </span>
            ) : null}
          </div>

          <p className="truncate text-sm text-zinc-400">
            @{creator.username}
          </p>

          {creator.headline ? (
            <p className="mt-2 line-clamp-2 text-sm text-zinc-300">
              {creator.headline}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}