import Link from "next/link"
import {
  CREATOR_PAGE_PRESENTATION,
  getCreatorSubscriptionPresentation,
  SubscribeButton,
} from "@/modules/creator/public/creator-page-ui"
import { formatPrice } from "./creator-page-format"

export function CreatorActionSection({
  creatorId,
  creatorUserId,
  creatorUsername,
  currentUserId,
  displayName,
  isOwner,
  subscriptionPrice,
}: {
  creatorId: string
  creatorUserId: string
  creatorUsername: string
  currentUserId?: string
  displayName: string
  isOwner: boolean
  subscriptionPrice: number
}) {
  const subscriptionPresentation =
    getCreatorSubscriptionPresentation(displayName)

  if (isOwner) {
    return (
      <div className="flex w-full flex-col gap-4 sm:w-auto sm:items-end">
        <Link
          href="/profile/edit"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-800 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 sm:w-auto"
        >
          {CREATOR_PAGE_PRESENTATION.ownerEditLabel}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:w-auto sm:items-end">
      <div className="text-left sm:text-right">
        <p className="text-lg font-semibold text-white">
          {formatPrice(subscriptionPrice)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {subscriptionPresentation.pricePeriodLabel}
        </p>
      </div>

      <div className="w-full sm:min-w-[220px]">
        <SubscribeButton
          creatorId={creatorId}
          creatorUserId={creatorUserId}
          currentUserId={currentUserId}
          creatorUsername={creatorUsername}
        />
      </div>
    </div>
  )
}
