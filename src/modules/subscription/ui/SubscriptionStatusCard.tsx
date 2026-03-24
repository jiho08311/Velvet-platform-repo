import { StatusBadge } from "@/shared/ui/StatusBadge"

type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "expired"

type SubscriptionStatusCardProps = {
  status: SubscriptionStatus
  currentPeriodEnd?: string | null
}

function getLabel(status: SubscriptionStatus) {
  if (status === "active") return "Active"
  if (status === "canceled") return "Canceled"
  return "Inactive"
}

export function SubscriptionStatusCard({
  status,
  currentPeriodEnd,
}: SubscriptionStatusCardProps) {
  return (
    <section className="border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            Subscription status
          </p>
          {currentPeriodEnd ? (
            <p className="mt-1 text-xs text-zinc-500">
              Until {new Date(currentPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}
        </div>

        <StatusBadge label={getLabel(status)} />
      </div>
    </section>
  )
}