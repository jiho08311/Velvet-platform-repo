import { RestrictedStateShell } from "@/shared/ui/RestrictedStateShell"
import {
  getCreatorSubscriptionStatusState,
  type CreatorSubscriptionDisplayStatus,
} from "@/modules/creator/ui/creator-surface-policy"

type SubscriptionStatusCardProps = {
  status: CreatorSubscriptionDisplayStatus
  currentPeriodEndAt?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function SubscriptionStatusCard({
  status,
  currentPeriodEndAt,
}: SubscriptionStatusCardProps) {
  const formattedEndDate = formatDate(currentPeriodEndAt)
  const state = getCreatorSubscriptionStatusState(status, formattedEndDate)

  return (
    <RestrictedStateShell
      tone={state.tone}
      badgeLabel={state.badgeLabel}
      badgeTone={state.badgeTone}
      title={state.title}
      description={state.description}
    />
  )
}
