import { createClient } from "@/infrastructure/supabase/server"

type UpdateCreatorSettingsInput = {
  creatorId: string
  subscriptionPrice: number
}

export async function updateCreatorSettings(
  input: UpdateCreatorSettingsInput
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("creators")
    .update({
      subscription_price: input.subscriptionPrice,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.creatorId)
    .select("id, user_id, subscription_price, updated_at")
    .maybeSingle()

  if (error) {
    throw new Error("Failed to update creator settings")
  }

  return data
}