import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createPayoutAccount } from "@/modules/payout/server/create-payout-account"

type CreateCreatorProfileInput = {
  userId: string
  instagramUsername?: string
  bankName: string
  accountHolderName: string
  accountNumber: string
}

export async function createCreatorProfile({
  userId,
  instagramUsername,
  bankName,
  accountHolderName,
  accountNumber,
}: CreateCreatorProfileInput) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("createCreatorProfile profile lookup error:", profileError)
    throw profileError
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .insert({
      user_id: userId,
      username: profile.username,
      display_name: profile.display_name ?? profile.username,
      status: "pending",
      subscription_price: 0,
      subscription_currency: "KRW",
      instagram_username: instagramUsername ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("creators")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (existing) {
        return existing
      }
    }

    console.error("createCreatorProfile error:", error)
    throw error
  }

  await createPayoutAccount({
    creatorId: data.id,
    bankName,
    accountHolderName,
    accountNumber,
  })

  return data
}