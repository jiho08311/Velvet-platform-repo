"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Bell, Home, Mail, Search, User } from "lucide-react"

type NavigationItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-900 bg-zinc-950/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-3 py-2">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={resolveHref(item.href)}
              className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-[10px] font-semibold transition ${
             isActive
  ? "bg-zinc-100"
  : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
              }`}
            >
           <Icon
  className={`h-5 w-5 ${
    isActive ? "text-zinc-950" : "text-zinc-500"
  }`}
/>
            <span className={isActive ? "text-zinc-950" : "text-zinc-500"}>
  {item.label}
</span>

              {item.href === "/notifications" && isAuthenticated && hasUnread ? (
                <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-red-500" />
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}