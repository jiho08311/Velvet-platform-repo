import { createClient } from "@/infrastructure/supabase/server"
import { assertValidSubscriptionPrice } from "@/modules/subscription/lib/subscription-price"

type UpdateCreatorSettingsInput = {
  creatorId: string
  subscriptionPrice: number
}

export async function updateCreatorSettings(
  input: UpdateCreatorSettingsInput
) {
  const supabase = await createClient()

  console.log("DEBUG input.creatorId:", input.creatorId)
  console.log(
    "DEBUG input.subscriptionPrice:",
    input.subscriptionPrice
  )

  const { data: debugCreators } = await supabase
    .from("creators")
    .select("id, user_id, subscription_price")
    .limit(5)

  console.log("DEBUG creators table:", debugCreators)

  // ✅ 여기 핵심
  const price = assertValidSubscriptionPrice(input.subscriptionPrice)

  const { data, error } = await supabase
    .from("creators")
    .update({
      subscription_price: price,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.creatorId)
    .select("id, user_id, subscription_price, updated_at")
    .maybeSingle()

  if (error) {
    throw new Error("Failed to update creator settings")
  }

  console.log("DEBUG updated creator row:", data)

  return data
}