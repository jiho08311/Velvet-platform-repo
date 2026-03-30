"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const navigationItems = [
  { href: "/feed", label: "Home" },
  { href: "/messages", label: "Messages" },
  { href: "/search", label: "Search" },
  { href: "/notifications", label: "Notifications" },
  { href: "/post/new", label: "Post" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isCreator, setIsCreator] = useState<boolean | null>(null)
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        })

        if (!res.ok) return

        const data = await res.json()

        const unread = Array.isArray(data?.notifications)
          ? data.notifications.some((n: any) => n.isRead === false)
          : false

        setHasUnread(unread)
      } catch {
        setHasUnread(false)
      }
    }

    fetchUnread()
  }, [])

  useEffect(() => {
    async function checkCreator() {
      try {
        const res = await fetch("/api/creator/me", {
          cache: "no-store",
        })

        if (!res.ok) {
          setIsCreator(false)
          return
        }

        const data = await res.json()
        setIsCreator(Boolean(data?.creator))
      } catch {
        setIsCreator(false)
      }
    }

    checkCreator()
  }, [])

  return (
    <aside className="hidden w-72 shrink-0 md:block">
      <div className="sticky top-[73px] px-4 py-6">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-[48px] items-center rounded-2xl px-4 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#C2185B] text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.label}

                {item.href === "/notifications" && hasUnread ? (
                  <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="mt-6">
          {isCreator === null ? (
            <div className="h-[48px] w-full animate-pulse rounded-2xl bg-zinc-800" />
          ) : isCreator ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Creator dashboard
            </Link>
          ) : (
            <Link
              href="/become-creator"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#C2185B] px-4 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              Become creator
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}