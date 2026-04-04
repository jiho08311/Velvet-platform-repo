"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Bell,
  Home,
  Mail,
  PlusSquare,
  Search,
  Settings,
  User,
  LayoutDashboard,
  Sparkles,
} from "lucide-react"

const navigationItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/post/new", label: "Post", icon: PlusSquare },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isCreator, setIsCreator] = useState<boolean | null>(null)
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

  useEffect(() => {
    async function checkCreator() {
      if (isAuthenticated === false) {
        setIsCreator(false)
        return
      }

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
  }, [isAuthenticated])

  return (
    <aside className="hidden w-24 shrink-0 xl:block">
      <div className="sticky top-[73px] flex h-[calc(100vh-73px)] flex-col items-center px-3 py-6">
        <nav className="flex w-full flex-col items-center gap-3">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/feed" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={resolveHref(item.href)}
                aria-label={item.label}
                title={item.label}
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition ${
                  isActive
                    ? "border-[#C2185B]/40 bg-[#C2185B] text-white shadow-sm"
                    : "border-transparent bg-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />

                {item.href === "/notifications" && isAuthenticated && hasUnread ? (
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex w-full flex-col items-center gap-3">
          {isAuthenticated === null || isCreator === null ? (
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-zinc-800" />
          ) : isAuthenticated === false ? (
            <Link
              href="/sign-in?next=%2Fbecome-creator"
              aria-label="Become creator"
              title="Become creator"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C2185B] text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
          ) : isCreator ? (
            <Link
              href="/dashboard"
              aria-label="Creator dashboard"
              title="Creator dashboard"
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/become-creator"
              aria-label="Become creator"
              title="Become creator"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C2185B] text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}