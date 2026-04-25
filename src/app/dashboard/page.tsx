import Link from "next/link"
import {
  formatCreatorAnalyticsSummaryMetricValue,
  getCreatorAnalyticsSummaryMetric,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"
import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { readCreatorOperationalReadiness } from "@/modules/creator/server/read-creator-operational-readiness"
import { updateCreatorSettings } from "@/modules/creator/server/update-creator-settings"
import { createPayoutRequest } from "@/modules/payout/server/create-payout-request"
import { getPayoutSummary } from "@/modules/payout/server/get-payout-summary"
import { listCreatorPayouts } from "@/modules/payout/server/list-creator-payouts"
import { revalidatePayoutSurfaces } from "@/modules/payout/server/revalidate-payout-surfaces"
import { SUBSCRIPTION_PRICES } from "@/modules/subscription/lib/subscription-price"

import { PayoutEmptyState } from "@/modules/payout/ui/PayoutEmptyState"
import { PayoutList } from "@/modules/payout/ui/PayoutHistoryList"

import { Card } from "@/shared/ui/Card"

function formatPrice(amount: number, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
  }).format(amount)
}

async function requestPayoutAction(formData: FormData) {
  "use server"

  const { user } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payouts",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    throw new Error("Creator is not active")
  }

  const currencyValue = formData.get("currency")
  const currency =
    typeof currencyValue === "string" && currencyValue.trim()
      ? currencyValue
      : "KRW"

  await createPayoutRequest({
    creatorId: readiness.creator.id,
    currency,
  })

  revalidatePayoutSurfaces({
    creatorUsername: readiness.creator.username,
  })
}

async function updateSubscriptionPriceAction(formData: FormData) {
  "use server"

  const price = Number(formData.get("price"))

  if (!Number.isFinite(price)) {
    throw new Error("Invalid subscription price")
  }

  const { user, creator } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payouts",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    throw new Error("Creator is not active")
  }

  await updateCreatorSettings({
    creatorId: user.id,
    subscriptionPrice: price,
  })

  revalidatePayoutSurfaces({
    creatorUsername: creator.username,
  })
}

export default async function PayoutsPage() {
  const { user } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payouts",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-white">
            승인 대기중입니다
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            현재 크리에이터 신청이 검토 중입니다. 승인 후 기능을 이용할 수 있습니다.
          </p>
        </div>
      </main>
    )
  }

  const { creator } = readiness

  const [summary, payouts, analyticsSummary] = await Promise.all([
    getPayoutSummary(creator.id),
    listCreatorPayouts({ creatorId: creator.id }),
    getCreatorAnalyticsSummary(creator.id),
  ])

  if (!summary) {
    return <PayoutEmptyState />
  }

  const requestableBalance = summary.requestableBalance
  const requestedPayoutAmount = summary.requestedPayoutAmount
  const subscribersMetric = getCreatorAnalyticsSummaryMetric(
    analyticsSummary,
    "subscribers"
  )

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">정산</h1>
          <p className="mt-1 text-sm text-zinc-500">
            수익 확인 및 출금을 관리하세요
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-sm text-zinc-500">구독 가격</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPrice(creator.subscriptionPrice)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              월 구독 가격을 설정하세요
            </p>

            <form
              action={updateSubscriptionPriceAction}
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {SUBSCRIPTION_PRICES.map((price) => {
                const isActive = creator.subscriptionPrice === price
                const isLongPrice = price >= 10000

                return (
                  <button
                    key={price}
                    type="submit"
                    name="price"
                    value={price}
                    className={
                      isActive
                        ? "w-full rounded-2xl border border-[#C2185B] bg-[#C2185B] px-4 py-2 text-left text-sm font-semibold text-white"
                        : "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-left text-sm font-semibold text-white transition hover:bg-zinc-900"
                    }
                  >
                    <span
                      className={
                        isLongPrice
                          ? "-translate-x-1 inline-block"
                          : "inline-block"
                      }
                    >
                      ₩{price.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </form>
          </Card>

          <Card>
            <p className="text-sm text-zinc-500">출금 가능 금액</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPrice(requestableBalance, summary.currency)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              현재 출금 가능한 전액 기준으로 요청됩니다.
            </p>

            <form action={requestPayoutAction} className="mt-4">
              <input type="hidden" name="currency" value={summary.currency} />
              <button
                type="submit"
                disabled={requestableBalance === 0}
                className="w-full rounded-2xl bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                전액 출금 요청
              </button>
            </form>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <p className="text-sm text-zinc-500">출금 요청 중 금액</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPrice(requestedPayoutAmount, summary.currency)}
            </p>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <Link
              href="/dashboard/subscribers"
              className="block rounded-2xl p-4 transition hover:bg-zinc-900"
            >
              <p className="text-sm text-zinc-500">구독자 관리</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatCreatorAnalyticsSummaryMetricValue(subscribersMetric)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                구독자 목록 확인 및 메시지 보내기
              </p>
            </Link>
          </Card>
        </div>

        <Card>
          <div className="mb-4">
            <p className="text-lg font-semibold text-white">출금 내역</p>
            <p className="text-sm text-zinc-500">
              전체 출금 기록을 확인하세요
            </p>
          </div>

          {payouts.length === 0 ? (
            <PayoutEmptyState />
          ) : (
            <PayoutList payouts={payouts} />
          )}
        </Card>
      </div>
    </main>
  )
}
