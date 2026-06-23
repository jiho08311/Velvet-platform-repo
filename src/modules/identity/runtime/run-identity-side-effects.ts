// src/modules/identity/server/run-identity-side-effects.ts
import { provisionPayoutAccount } from "@/modules/commerce/public/payout-account-contract"
import type { IdentitySideEffect } from "../contracts/identity-side-effect-contract"

export async function runIdentitySideEffects(
  sideEffects: IdentitySideEffect[]
) {
  for (const effect of sideEffects) {
    if (effect.type === "payout_account_provisioning_requested") {
      await provisionPayoutAccount({
        creatorId: effect.creatorId,
        bankName: effect.bankName,
        accountHolderName: effect.accountHolderName,
        accountNumber: effect.accountNumber,
      })
    }
  }
}
