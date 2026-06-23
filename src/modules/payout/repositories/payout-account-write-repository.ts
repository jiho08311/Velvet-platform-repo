// src/modules/payout/repositories/payout-account-write-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatePayoutAccountRowInput = {
  creatorId: string
  bankName: string
  accountHolderName: string
  accountNumber: string
}

export async function createPayoutAccountRow({
  creatorId,
  bankName,
  accountHolderName,
  accountNumber,
}: CreatePayoutAccountRowInput) {
  const { error } = await supabaseAdmin
    .from("payout_accounts")
    .insert({
      creator_id: creatorId,
      bank_name: bankName,
      account_holder_name: accountHolderName,
      account_number: accountNumber,
    })

  if (error) {
    throw error
  }
}