import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getPayoutSummary } from "@/modules/payout/server/get-payout-summary"
import { listCreatorPayouts } from "@/modules/payout/server/list-creator-payouts"
import { PayoutList } from "@/modules/payout/ui/PayoutHistoryList"
import { Card } from "@/shared/ui/Card"

function formatPrice(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

export default async function DashboardPayoutsPage() {
  let user: Awaited<ReturnType<typeof requireUser>>

  try {
    user = await requireUser()
  } catch {
    redirect("/sign-in?next=/dashboard/payouts")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    redirect("/become-creator")
  }

  const [payoutSummary, payouts] = await Promise.all([
    getPayoutSummary(creator.id),
    listCreatorPayouts({ creatorId: creator.id }),
  ])

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] p-6 sm:p-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                Payouts
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Payout history
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">
                Review your payout balance, pending payouts, and completed payout
                history.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Paid payouts
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {formatPrice(payoutSummary?.availableBalance ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Pending payouts
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {formatPrice(payoutSummary?.pendingAmount ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
              History
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Recent payouts
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Track payout status across pending, paid, and failed transfers.
            </p>
          </div>

          <PayoutList
            payouts={payouts.map((payout) => ({
              id: payout.id,
              amountCents: payout.amount_cents,
              currency: payout.currency,
              status: payout.status,
              createdAt: payout.created_at,
              paidAt: payout.paid_at,
              failureReason: payout.failure_reason,
            }))}
          />
        </section>
      </div>
    </main>
  )
}