// src/shared/ui/MobileNavigation.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-2 py-2">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[56px] items-center justify-center rounded-2xl px-2 text-center text-xs font-medium transition ${
                isActive
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}