"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type NavigationItem = {
  href: string
  label: string
}

const navigationItems: NavigationItem[] = [
  { href: "/feed", label: "Feed" },
  { href: "/search", label: "Search" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Alerts" },
  { href: "/profile", label: "Profile" },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [hasUnread, setHasUnread] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

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
          ? data.notifications.some((n: any) => n.isRead === false)
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-900 bg-zinc-950/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-3 py-3">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={resolveHref(item.href)}
              className={`relative flex min-h-[56px] items-center justify-center rounded-2xl px-2 text-center text-[11px] font-semibold transition ${
                isActive
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {item.label}

              {item.href === "/notifications" && isAuthenticated && hasUnread ? (
                <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-red-500" />
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}