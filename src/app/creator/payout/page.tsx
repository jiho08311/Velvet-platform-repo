import { requireCreatorReadyUser } from "@/modules/creator/public/require-creator-ready-user"
import {
  createPayoutRequest,
  getCreatorPayoutSummary,
  listCreatorPayoutExecutions,
} from "@/modules/commerce/public/payout-contract"
import { formatPayoutAmountWithCurrencyCode } from "@/modules/payout/formatters/payout-display-format"
import { revalidatePayoutSurfaces } from "@/modules/payout/public/revalidate-payout-surfaces"
import { PayoutList as PayoutHistoryList } from "@/modules/payout/public/payout-dashboard-ui"
import { canRequestPayout } from "@/modules/authorization/public"


type PayoutSummary = Awaited<ReturnType<typeof getCreatorPayoutSummary>>
type CreatorPayout = Awaited<
  ReturnType<typeof listCreatorPayoutExecutions>
>[number]

async function requestPayoutAction(formData: FormData) {
  "use server"

  const { user, creator } = await requireCreatorReadyUser({
    signInNext: "/creator/payout",
  })

  
 const payoutPermission = await canRequestPayout({
    actorId: user.id,
    creatorId: creator.id,
  })

  

  const currencyValue = formData.get("currency")
  const currency =
    typeof currencyValue === "string" && currencyValue.trim()
      ? currencyValue
      : "KRW"

  await createPayoutRequest({
    creatorId: creator.id,
    currency,
  })

  revalidatePayoutSurfaces({
    creatorUsername: creator.username,
  })
}

export default async function CreatorPayoutPage() {
  const { user, creator } = await requireCreatorReadyUser({
    signInNext: "/creator/payout",
  })

  const payoutAccessPermission = await canRequestPayout({
    actorId: user.id,
    creatorId: creator.id,
  })

  if (!payoutAccessPermission.allowed) {
    throw new Error("PAYOUT_ACCESS_NOT_ALLOWED")
  }

  const [summaryResult, payoutsResult] = await Promise.all([
    getCreatorPayoutSummary(creator.id),
    listCreatorPayoutExecutions({ creatorId: creator.id }),
  ])

  const summary: PayoutSummary | null = summaryResult
  const payouts: CreatorPayout[] = payoutsResult

  const currency = summary?.currency?.toUpperCase() ?? "KRW"
  const requestableBalance = summary?.requestableBalance ?? 0
  const requestedPayoutAmount = summary?.requestedPayoutAmount ?? 0
  const requestEligibility = summary?.requestEligibility ?? {
    isEligible: false,
    state: "invalid_amount",
  }

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
            {formatPayoutAmountWithCurrencyCode(requestableBalance, currency)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Pending requests</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPayoutAmountWithCurrencyCode(
              requestedPayoutAmount,
              currency
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Request payout</p>
          <form action={requestPayoutAction} className="mt-3">
            <input type="hidden" name="currency" value={currency} />
            <button
              type="submit"
              disabled={!requestEligibility.isEligible}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-black/40"
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
            Review your recent payout statuses.
          </p>
        </div>

        <div className="p-5">
          <PayoutHistoryList
            payouts={payouts}
            emptyTitle="No payouts yet"
            emptyDescription="Your payout history will appear here."
          />
        </div>
      </section>
    </main>
  )
}
