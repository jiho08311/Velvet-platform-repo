"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/admin/admins", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 p-4">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "rounded-xl bg-zinc-800 px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}