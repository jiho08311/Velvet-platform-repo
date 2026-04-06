import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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