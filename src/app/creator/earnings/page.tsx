import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { listPayments } from "@/modules/payment/server/list-payments"

type EarningHistoryItem = {
  id: string
  amount: string
  createdAt: string
  type: "subscription" | "tip" | "purchase"
}

type EarningsSummary = {
  grossRevenue: string
  netRevenue: string
  fees: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") {
    return null
  }

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function getNumberValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string") {
      const normalized = Number(value)

      if (Number.isFinite(normalized)) {
        return normalized
      }
    }
  }

  return null
}

function normalizeHistoryItem(item: unknown, index: number): EarningHistoryItem | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const source = item as Record<string, unknown>

  const id = getStringValue(source, ["id", "paymentId"]) ?? `earning_${index + 1}`

  const createdAt =
    getStringValue(source, ["createdAt", "created_at", "paidAt", "paid_at"]) ??
    new Date().toISOString()

  const rawType =
    getStringValue(source, ["type", "paymentType", "kind", "source"]) ?? "subscription"

  const amountNumber =
    getNumberValue(source, ["netAmount", "amount", "grossAmount", "totalAmount"]) ?? 0

  const loweredType = rawType.toLowerCase()

  let type: EarningHistoryItem["type"] = "subscription"

  if (loweredType.includes("tip")) {
    type = "tip"
  } else if (
    loweredType.includes("purchase") ||
    loweredType.includes("ppv") ||
    loweredType.includes("unlock")
  ) {
    type = "purchase"
  }

  return {
    id,
    amount: formatCurrency(amountNumber),
    createdAt,
    type,
  }
}

function normalizeHistory(data: unknown) {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item, index) => normalizeHistoryItem(item, index))
    .filter((item): item is EarningHistoryItem => item !== null)
}

export default async function CreatorEarningsPage() {
  const nextPath = "/creator/earnings"
  const session = await getSession()

  if (!session) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const creator = await getCreatorByUserId(userId)

  if (!creator) {
    redirect(
      buildPathWithNext({
        path: "/become-creator",
        next: nextPath,
      })
    )
  }

  const [analytics, paymentsData] = await Promise.all([
    getCreatorAnalyticsSummary(creator.id),
    listPayments(),
  ])

  const summary: EarningsSummary = {
    grossRevenue: formatCurrency(analytics.revenue.grossRevenue),
    netRevenue: formatCurrency(analytics.revenue.netRevenue),
    fees: formatCurrency(analytics.revenue.fees),
  }
  const earnings = normalizeHistory(paymentsData)

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Creator
          </p>
          <h1 className="text-3xl font-semibold text-white">Earnings</h1>
          <p className="text-sm text-zinc-400">
            Review your revenue summary and recent earning history.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Gross revenue
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {summary.grossRevenue}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Net revenue
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {summary.netRevenue}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Fees
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {summary.fees}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                History
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Earning history
              </h2>
            </div>
          </div>

          {earnings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-12 text-center">
              <h3 className="text-xl font-semibold text-white">
                No earnings yet
              </h3>
              <p className="mt-3 text-sm text-zinc-400">
                Your earnings history will appear here once revenue starts coming in.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {earnings.map((earning) => (
                <article
                  key={earning.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                      {earning.type}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {formatDate(earning.createdAt)}
                    </p>
                  </div>

                  <p className="text-2xl font-semibold text-white">
                    {earning.amount}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
