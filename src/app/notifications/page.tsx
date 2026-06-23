import { listNotificationItems } from "@/modules/notification/public/list-notifications"
import { requireNotificationPageAccess } from "@/modules/notification/public/require-notification-page-access"

import { NotificationListSurface } from "@/modules/notification/public/notification-ui"
import { getNotificationBadgeSummary } from "@/modules/notification/public/get-notification-badge-summary"
export default async function NotificationsPage() {
  const nextPath = "/notifications"
const session = await requireNotificationPageAccess("/notifications")

  const notificationItems = await listNotificationItems({
    userId: session.userId,
  })

const badgeSummary =
  await getNotificationBadgeSummary({
    userId: session.userId,
  })

const unreadCount =
  badgeSummary.unreadCount

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <NotificationListSurface
          notifications={notificationItems}
          unreadCount={unreadCount}
        />
      </div>
    </main>
  )
}
