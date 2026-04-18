import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type GetPayoutAccountReadinessInput = {
  creatorId: string
}

type PayoutAccountRow = {
  bank_name: string | null
  account_holder_name: string | null
  account_number: string | null
}

type PayoutAccountReadinessState = "ready" | "missing"

function resolvePayoutAccountReadiness(
  input:
    | {
        bankName: string | null
        accountHolderName: string | null
        accountNumber: string | null
      }
    | null
) {
  const isReady = Boolean(
    input?.bankName?.trim() &&
      input?.accountHolderName?.trim() &&
      input?.accountNumber?.trim()
  )

  return {
    state: (isReady ? "ready" : "missing") as PayoutAccountReadinessState,
    isReady,
  }
}

export async function getPayoutAccountReadiness({
  creatorId,
}: GetPayoutAccountReadinessInput) {
  const id = creatorId.trim()

  if (!id) {
    return resolvePayoutAccountReadiness(null)
  }

  const { data, error } = await supabaseAdmin
    .from("payout_accounts")
    .select("bank_name, account_holder_name, account_number")
    .eq("creator_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PayoutAccountRow>()

  if (error) {
    throw error
  }

  return resolvePayoutAccountReadiness(
    data
      ? {
          bankName: data.bank_name,
          accountHolderName: data.account_holder_name,
          accountNumber: data.account_number,
        }
      : null
  )
}