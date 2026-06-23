import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { upsertRevenueMetricRollup } from "@/modules/analytics/repositories/revenue-metric-rollup-repository"

type PaymentRow = {
  id: string
  creator_id: string | null
  amount: number | null
  currency: string | null
  status: string | null
  type: string | null
  confirmed_at: string | null
  created_at: string
}

function dayStart(value: string): string {
  const date = new Date(value)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function dayEnd(value: string): string {
  const date = new Date(value)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

function readAmount(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export async function rebuildRevenueRollups(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id, creator_id, amount, currency, status, type, confirmed_at, created_at")
    .eq("status", "succeeded")
    .limit(limit)
    .returns<PaymentRow[]>()

  if (error) throw error

  const payments = data ?? []

  let upsertedCount = 0
  let failedCount = 0
  let skippedCount = 0

  for (const payment of payments) {
    if (!payment.creator_id) {
      skippedCount += 1
      continue
    }

    const occurredAt =
      payment.confirmed_at ?? payment.created_at ?? new Date().toISOString()
    const amount = readAmount(payment.amount)

    try {
      if (!input?.dryRun) {
        const { error: upsertError } = await upsertRevenueMetricRollup({
          creator_id: payment.creator_id,
          period_start: dayStart(occurredAt),
          period_end: dayEnd(occurredAt),
          gross_revenue: amount,
          net_revenue: amount,
          platform_fee: 0,
          refund_amount: 0,
          currency: payment.currency ?? "KRW",
          source_event_id: null,
          idempotency_key: `revenue:rebuild:payment:${payment.id}`,
        })

        if (upsertError) throw upsertError
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    scannedPaymentCount: payments.length,
    upsertedCount,
    skippedCount,
    failedCount,
  }
}