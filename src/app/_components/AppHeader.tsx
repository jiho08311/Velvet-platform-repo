"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const [hasUnread, setHasUnread] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const nextParam = useMemo(
    () => encodeURIComponent(pathname || "/feed"),
    [pathname]
  )

  function resolveHref(href: string) {
    if (isAuthenticated === false) {
      return `/sign-in?next=${encodeURIComponent(href)}`
    }

    return href
  }

  useEffect(() => {
    async function fetchAuthAndUnread() {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        })

        if (!res.ok) {
          setIsAuthenticated(false)
          setHasUnread(false)
          return
        }

        setIsAuthenticated(true)

        const data = await res.json()
        const unread = Array.isArray(data?.notifications)
          ? data.notifications.some(
              (notification: { isRead?: boolean }) =>
                notification.isRead === false
            )
          : false

        setHasUnread(unread)
      } catch {
        setIsAuthenticated(false)
        setHasUnread(false)
      }
    }

    fetchAuthAndUnread()
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={resolveHref("/feed")} className="flex items-center gap-3">
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

        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            About
          </Link>

          <Link
            href={resolveHref("/post/new")}
            className="inline-flex items-center rounded-full bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
          >
            New post
          </Link>

          <div className="shrink-0">
            {action ??
              (isAuthenticated ? (
                <SignOutButton />
              ) : (
                <Link
                  href={`/sign-in?next=${nextParam}`}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-900"
                >
                  Sign in
                </Link>
              ))}
          </div>
        </div>
      </div>
    </header>
  )
}