"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { SignOutButton } from "@/modules/auth/ui/SignOutButton"

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
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        const unread = Array.isArray(data?.notifications)
          ? data.notifications.some((notification: { isRead?: boolean }) => notification.isRead === false)
          : false

        setHasUnread(unread)
      } catch {
        setHasUnread(false)
      }
    }

    fetchUnread()
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/feed" className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="Velvet logo"
              width={36}
              height={24}
              className="rounded-xl"
            />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-white md:text-base">
                {title}
              </span>

              {description ? (
                <p className="hidden truncate text-xs text-zinc-500 md:block">
                  {description}
                </p>
              ) : null}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/feed"
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Feed
            </Link>

            <Link
              href="/search"
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Search
            </Link>

            <Link
              href="/messages"
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Messages
            </Link>

            <Link
              href="/notifications"
              className="relative rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Notifications
              {hasUnread ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              ) : null}
            </Link>
          </nav>

          <Link
            href="/post/new"
            className="inline-flex items-center rounded-full bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
          >
            New post
          </Link>

          <div className="shrink-0">{action ?? <SignOutButton />}</div>
        </div>
      </div>
    </header>
  )
}