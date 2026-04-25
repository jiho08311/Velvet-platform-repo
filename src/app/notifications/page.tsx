import { redirect } from "next/navigation"

import { listNotifications } from "@/modules/notification/server/list-notifications"
import { requireNotificationPageAccess } from "@/modules/notification/server/require-notification-page-access"
import { getUnreadNotificationCount } from "@/modules/notification/types"
import { NotificationListSurface } from "@/modules/notification/ui/NotificationListSurface"

export default async function NotificationsPage() {
  const nextPath = "/notifications"
  const user = await requireNotificationPageAccess(nextPath)

  const notifications = await listNotifications({
    userId: user.id,
  })

  const unreadCount = getUnreadNotificationCount(notifications)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <NotificationListSurface
          notifications={notifications}
          unreadCount={unreadCount}
        />
      </div>
    </main>
  )
}
