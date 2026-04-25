import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createAuditLog } from "@/modules/analytics/server/create-audit-log"
type ReverseEarningInput = {
  paymentId: string
  reason?: string
}

type EarningRow = {
  id: string
  payout_id: string | null
  status: "pending" | "available" | "paid_out" | "reversed"
}

export async function reverseEarning({
  paymentId,
}: ReverseEarningInput): Promise<void> {
  const safePaymentId = paymentId.trim()

  if (!safePaymentId) {
    throw new Error("Invalid payment id")
  }

  const { data: earning, error: earningError } = await supabaseAdmin
    .from("earnings")
    .select("id, payout_id, status")
    .eq("payment_id", safePaymentId)
    .maybeSingle<EarningRow>()

  if (earningError) {
    throw earningError
  }

  if (!earning) {
    throw new Error("EARNING_NOT_FOUND")
  }

  if (earning.status === "reversed") {
    return
  }

  if (earning.status === "paid_out") {
    throw new Error("CANNOT_REVERSE_ALREADY_PAID_OUT")
  }

  const { error: updateError } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "reversed",
      reversed_at: new Date().toISOString(),
    })
    .eq("id", earning.id)

  if (updateError) {
    throw updateError
  }
  if (updateError) {
  throw updateError
}

await createAuditLog({
  actorId: null,
  action: "earning_reversed",
  targetType: "earning",
  targetId: earning.id,
  metadata: {
    paymentId: safePaymentId,
    previousStatus: earning.status,
    nextStatus: "reversed",
  },
})
}