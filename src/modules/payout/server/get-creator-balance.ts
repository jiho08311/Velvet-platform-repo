import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetCreatorBalanceParams = {
  creatorId: string
}

type PaymentRow = {
  amount_cents: number | null
}

type PayoutRow = {
  amount_cents: number | null
}

export type CreatorBalance = {
  creatorId: string
  totalEarningsCents: number
  totalPayoutsCents: number
  availableBalanceCents: number
}

export async function getCreatorBalance({
  creatorId,
}: GetCreatorBalanceParams): Promise<CreatorBalance> {
  const supabase = await createSupabaseServerClient()

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("creator_id", creatorId)
    .eq("status", "succeeded")
    .returns<PaymentRow[]>()

  if (paymentsError) {
    throw paymentsError
  }

  const { data: payouts, error: payoutsError } = await supabase
    .from("payouts")
    .select("amount_cents")
    .eq("creator_id", creatorId)
    .returns<PayoutRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  const totalEarningsCents = (payments ?? []).reduce((sum, payment) => {
    return sum + (payment.amount_cents ?? 0)
  }, 0)

  const totalPayoutsCents = (payouts ?? []).reduce((sum, payout) => {
    return sum + (payout.amount_cents ?? 0)
  }, 0)

  return {
    creatorId,
    totalEarningsCents,
    totalPayoutsCents,
    availableBalanceCents: totalEarningsCents - totalPayoutsCents,
  }
}