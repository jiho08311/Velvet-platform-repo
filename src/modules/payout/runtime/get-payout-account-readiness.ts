import { findLatestPayoutAccountByCreatorId } from "@/modules/payout/repositories/payout-account-read-repository"

type GetPayoutAccountReadinessInput = {
  creatorId: string
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

  const data = await findLatestPayoutAccountByCreatorId(id)

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