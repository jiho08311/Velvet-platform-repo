import { listCreatorSubscribers } from "@/modules/commerce/public/subscription-contract"

type CreatorSubscriber = Awaited<
  ReturnType<typeof listCreatorSubscribers>
>["items"][number]

export type DashboardSubscriberItem = CreatorSubscriber & {
  displayName: string
  avatarInitial: string
  displaySubscribedAt: string
  messageHref: string
}

export type DashboardSubscribersReadModel = {
  subscribers: DashboardSubscriberItem[]
}

function formatSubscribedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function toDashboardSubscriberItem(
  subscriber: CreatorSubscriber
): DashboardSubscriberItem {
  const displayName = subscriber.displayName || subscriber.username || "User"

  return {
    ...subscriber,
    displayName,
    avatarInitial: displayName.slice(0, 1).toUpperCase(),
    displaySubscribedAt: formatSubscribedAt(subscriber.subscribedAt),
    messageHref: `/messages?userId=${subscriber.viewerUserId}`,
  }
}

export async function getDashboardSubscribersReadModel(
  creatorId: string
): Promise<DashboardSubscribersReadModel> {
 const { items } = await listCreatorSubscribers({
  creatorId,
  limit: 50,
})

  return {
    subscribers: items.map(toDashboardSubscriberItem),
  }
}
