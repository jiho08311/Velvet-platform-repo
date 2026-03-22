// src/shared/ui/AppSidebar.tsx
import Link from "next/link"

type SidebarItem = {
  href: string
  label: string
}

const primaryItems: SidebarItem[] = [
  { href: "/feed", label: "Feed" },
  { href: "/explore", label: "Explore" },
  { href: "/search", label: "Search" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/likes", label: "Likes" },
  { href: "/profile", label: "Profile" },
]

const creatorItems: SidebarItem[] = [
  { href: "/creator/studio", label: "Studio" },
  { href: "/creator/analytics", label: "Analytics" },
  { href: "/creator/subscribers", label: "Subscribers" },
  { href: "/creator/earnings", label: "Earnings" },
  { href: "/creator/media", label: "Media" },
  { href: "/creator/settings", label: "Settings" },
]

const adminItems: SidebarItem[] = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/analytics", label: "Analytics" },
]

function SidebarSection({
  title,
  items,
}: {
  title: string
  items: SidebarItem[]
}) {
  return (
    <section className="space-y-2">
      <p className="px-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center rounded-2xl px-3 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 px-4 py-6 text-zinc-100 md:block">
      <div className="flex h-full flex-col gap-6 overflow-y-auto">
        <div className="px-3">
          <Link href="/feed" className="text-lg font-semibold text-white">
            Creator Platform
          </Link>
        </div>

        <SidebarSection title="Main" items={primaryItems} />
        <SidebarSection title="Creator" items={creatorItems} />
        <SidebarSection title="Admin" items={adminItems} />
      </div>
    </aside>
  )
}