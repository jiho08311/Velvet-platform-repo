import { notFound } from "next/navigation"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getPayoutSummary } from "@/modules/payout/server/get-payout-summary"
import { listPayouts } from "@/modules/payout/server/list-payouts"

type PayoutSummaryView = {
  availableAmountCents?: number
  pendingAmountCents?: number
  currency?: string
} | null

type PayoutView = {
  id: string
  amountCents?: number
  currency?: string
  status: string
  createdAt: string
}

export default async function CreatorPayoutPage() {
  const user = await requireUser()
  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    notFound()
  }

  const [summaryResult, payoutsResult] = await Promise.all([
    getPayoutSummary(creator.id),
    listPayouts({ creatorId: creator.id }),
  ])

  const summary = summaryResult as PayoutSummaryView
  const payouts = payoutsResult as PayoutView[]

  const currency = summary?.currency?.toUpperCase() ?? "KRW"
  const availableAmountCents = summary?.availableAmountCents ?? 0
  const pendingAmountCents = summary?.pendingAmountCents ?? 0

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h1 className="text-2xl font-semibold">Payout</h1>
        <p className="mt-2 text-sm text-white/60">
          Review your payout balance and payout history.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Available balance</p>
          <p className="mt-2 text-2xl font-semibold">
        {availableAmountCents} {currency}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Pending payout</p>
          <p className="mt-2 text-2xl font-semibold">
          {pendingAmountCents} {currency}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Request payout</p>
          <form action="/api/payout/request" method="post" className="mt-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Request payout
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
        <div className="border-b border-white/10 px-5 py-4 text-white">
          <h2 className="text-lg font-semibold">Payout history</h2>
          <p className="mt-1 text-sm text-white/50">
            Review your recent payout requests and statuses.
          </p>
        </div>

        {payouts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-medium text-white">No payouts yet</p>
            <p className="mt-2 text-sm text-white/60">
              Your payout requests will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_140px_180px] gap-4 border-b border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/50">
              <span>Amount</span>
              <span>Status</span>
              <span>Created</span>
            </div>

            <ul className="divide-y divide-white/10">
              {payouts.map((payout) => (
                <li
                  key={payout.id}
                  className="grid grid-cols-[1fr_140px_180px] gap-4 px-5 py-4 text-white"
                >
                  <div className="text-sm font-medium">
                   ₩{(payout.amountCents ?? 0).toLocaleString()}
                  </div>

                  <div>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium capitalize text-white/70">
                      {payout.status}
                    </span>
                  </div>

                  <div className="text-sm text-white/60">
                    {new Date(payout.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}