// src/modules/commerce/public/payout-account-contract.ts
import { createPayoutAccount } from "@/modules/payout/public/create-payout-account"

export type ProvisionPayoutAccountInput = {
  creatorId: string
  bankName: string
  accountHolderName: string
  accountNumber: string
}

export async function provisionPayoutAccount(
  input: ProvisionPayoutAccountInput
) {
  return createPayoutAccount(input)
}