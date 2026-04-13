"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Mail, Search, User, Sparkles, LayoutDashboard } from "lucide-react"

type NavigationItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/messages", label: "Messages", icon: Mail },
  // ❌ Alerts 제거
  { href: "/profile", label: "Profile", icon: User },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [isCreator, setIsCreator] = useState<boolean | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  function resolveHref(href: string) {
    if (isAuthenticated === false) {
      return `/sign-in?next=${encodeURIComponent(href)}`
    }
    return href
  }

  useEffect(() => {
    async function fetchAuth() {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        })

        if (!res.ok) {
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
      }
    }

    fetchAuth()
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-900 bg-zinc-950/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-3 py-2">

        {/* 기존 4개 */}
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
            </Link>
          )
        })}

        {/* 🔥 Creator 버튼 */}
        {isAuthenticated === null || isCreator === null ? (
          <div className="flex min-h-[60px] items-center justify-center">
            <div className="h-5 w-5 animate-pulse rounded bg-zinc-700" />
          </div>
        ) : isAuthenticated === false ? (
          <Link
            href="/sign-in?next=%2Fbecome-creator"
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl bg-[#C2185B]/15 text-[10px] font-semibold text-[#F472B6] hover:bg-[#C2185B]/25"
          >
          <Sparkles
  className={`h-5 w-5 ${
    pathname.startsWith("/become-creator")
      ? "text-zinc-950"
      : "text-zinc-500"
  }`}
/>
            Creator
          </Link>
        ) : isCreator ? (
          <Link
            href="/dashboard"
className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-[10px] font-semibold transition ${
  pathname.startsWith("/dashboard") || pathname.startsWith("/become-creator")
    ? "bg-zinc-100"
    : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
}`}
          >
        <LayoutDashboard
  className={`h-5 w-5 ${
    pathname.startsWith("/dashboard")
      ? "text-zinc-950"
      : "text-zinc-500"
  }`}
/>
            Dashboard
          </Link>
        ) : (
          <Link
            href="/become-creator"
className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold ${
  pathname.startsWith("/become-creator")
    ? "bg-[#C2185B] text-white"
    : "bg-[#C2185B]/15 text-[#F472B6] hover:bg-[#C2185B]/25"
}`}
          >
   <Sparkles
  className={`h-5 w-5 ${
    pathname.startsWith("/become-creator")
      ? "text-zinc-950"
      : "text-zinc-500"
  }`}
/>
            Creator
          </Link>
        )}

      </div>
    </nav>
  )
}