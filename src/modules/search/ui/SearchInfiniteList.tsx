"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { CreatorSearchResult } from "../types"

type SearchInfiniteListProps = {
  query: string
  initialCreators: CreatorSearchResult[]
  initialCursor: string | null
}

export function SearchInfiniteList({
  query,
  initialCreators,
  initialCursor,
}: SearchInfiniteListProps) {
  const [creators, setCreators] = useState(initialCreators)
  const [cursor, setCursor] = useState(initialCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(Boolean(initialCursor))
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore || isLoading) return

    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (!cursor) return

        try {
          setIsLoading(true)

          const response = await fetch(
            `/api/search?query=${encodeURIComponent(query)}&limit=20&cursor=${encodeURIComponent(cursor)}`,
            {
              method: "GET",
              cache: "no-store",
            }
          )

          if (!response.ok) {
            return
          }

          const data = await response.json()
          const nextCreators = Array.isArray(data.creators) ? data.creators : []

          setCreators((prev) => {
            const existingIds = new Set(prev.map((item) => item.id))
            const merged = [...prev]

            for (const item of nextCreators) {
              if (!existingIds.has(item.id)) {
                merged.push(item)
              }
            }

            return merged
          })

          setCursor(data.nextCursor ?? null)
          setHasMore(Boolean(data.nextCursor))
        } finally {
          setIsLoading(false)
        }
      },
      { rootMargin: "400px 0px" }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [cursor, hasMore, isLoading, query])

  return (
    <>
      <div className="grid gap-2">
        {creators.map((creator) => (
      <Link
  key={creator.id}
  href={`/creator/${creator.username}`}
  className="group flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800"
>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
              {(creator.displayName ?? creator.username)
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {creator.displayName ?? creator.username}
              </p>
              <p className="truncate text-xs text-zinc-400">
                @{creator.username}
              </p>
            </div>
        </Link>
        ))}
      </div>

      {hasMore ? <div ref={sentinelRef} className="h-1 w-full" /> : null}

      {isLoading ? (
        <div className="mt-3 grid gap-2">
  <div className="h-[72px] animate-pulse rounded-2xl bg-zinc-900" />
<div className="h-[72px] animate-pulse rounded-2xl bg-zinc-900" />
        </div>
      ) : null}
    </>
  )
}
