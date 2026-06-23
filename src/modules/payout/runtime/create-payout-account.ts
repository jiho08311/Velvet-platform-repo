// src/modules/payout/runtime/create-payout-account.ts

import { createPayoutAccountRow } from "@/modules/payout/repositories/payout-account-write-repository"

type CreatePayoutAccountInput = {
  creatorId: string
  bankName: string
  accountHolderName: string
  accountNumber: string
}

export async function createPayoutAccount({
  creatorId,
  bankName,
  accountHolderName,
  accountNumber,
}: CreatePayoutAccountInput) {
  await createPayoutAccountRow({
    creatorId,
    bankName,
    accountHolderName,
    accountNumber,
  })
}