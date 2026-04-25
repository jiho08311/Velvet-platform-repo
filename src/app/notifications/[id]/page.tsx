import { redirect } from "next/navigation"

import { getNotificationById } from "@/modules/notification/server/get-notification-by-id"
import { listNotifications } from "@/modules/notification/server/list-notifications"
import { requireNotificationPageAccess } from "@/modules/notification/server/require-notification-page-access"
import { getUnreadNotificationCount } from "@/modules/notification/types"
import { NotificationListSurface } from "@/modules/notification/ui/NotificationListSurface"

type NotificationsPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { id } = await params
  const nextPath = `/notifications/${id}`
  const user = await requireNotificationPageAccess(nextPath)
  const selectedNotification = await getNotificationById({
    notificationId: id,
    userId: user.id,
  })

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
          selectedNotificationId={selectedNotification?.id ?? null}
        />
      </div>
    </main>
  )
}
