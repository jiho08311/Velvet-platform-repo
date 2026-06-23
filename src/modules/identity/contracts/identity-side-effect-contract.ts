// src/modules/identity/contracts/identity-side-effect-contract.ts
export type IdentitySideEffect =
  | {
      type: "payout_account_provisioning_requested"
      creatorId: string
      bankName: string
      accountHolderName: string
      accountNumber: string
    }

export type IdentityRuntimeResult<TData> = {
  data: TData
  sideEffects: IdentitySideEffect[]
}