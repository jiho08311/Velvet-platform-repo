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
        const res = await fetch("/api/notifications", { cache: "no-store" })

        if (!res.ok) {
          setIsAuthenticated(false)
          setHasUnread(false)
          return
        }

        setIsAuthenticated(true)

        const data = await res.json()
        const unread =
          typeof data?.hasUnread === "boolean"
            ? data.hasUnread
            : typeof data?.unreadCount === "number"
              ? data.unreadCount > 0
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
    <aside className="w-full">
      <div className="flex flex-col items-center px-2 py-4 md:items-start md:px-10">
        <nav className="flex w-full flex-col items-center gap-2 md:items-start">
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
                className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition ${
                  isActive
                    ? "border-[#C2185B]/40 bg-[#C2185B] text-white"
                    : "border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />

                {item.href === "/notifications" && isAuthenticated && hasUnread ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="mt-6 flex w-full flex-col items-center gap-2 md:items-start">
          {isAuthenticated === null || isCreator === null ? (
            <div className="h-12 w-12 animate-pulse rounded-xl bg-zinc-800" />
          ) : isAuthenticated === false ? (
            <Link
              href="/sign-in?next=%2Fbecome-creator"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C2185B] text-white"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
          ) : isCreator ? (
            <Link
              href="/dashboard"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/become-creator"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C2185B] text-white"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
