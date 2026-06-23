import {
  getCreatorSubscriptionPresentation,
  SubscribeButton,
} from "@/modules/creator/public/creator-page-ui"
import { RestrictedStateShell } from "@/shared/ui/RestrictedStateShell"
import type { CreatorPageData } from "./creator-page-data"
import { formatPrice } from "./creator-page-format"

export function CreatorPageAside({ data }: { data: CreatorPageData }) {
  if (data.isOwner) return null

  const subscriptionPresentation =
    getCreatorSubscriptionPresentation(data.displayName)

  return (
    <aside className="hidden lg:block w-full max-w-[378px] mx-auto lg:mx-0">
      <div className="space-y-4 lg:sticky lg:top-24">
        <RestrictedStateShell
          title={formatPrice(data.creator.subscriptionPrice)}
          description={subscriptionPresentation.unlockDescription}
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              {subscriptionPresentation.pricePeriodLabel}
            </p>

            <SubscribeButton
              creatorId={data.creator.id}
              creatorUserId={data.creator.userId}
              currentUserId={data.userId ?? undefined}
              creatorUsername={data.creator.username}
            />
          </div>
        </RestrictedStateShell>
      </div>
    </aside>
  )
}
