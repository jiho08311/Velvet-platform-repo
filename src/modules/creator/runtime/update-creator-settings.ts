// src/modules/creator/runtime/update-creator-settings.ts
import { executeCreatorConfigurationUpdate } from "@/modules/identity/public/creator-authority"


export async function updateCreatorSettings(input: {
  creatorId: string
  userId?: string
  subscriptionPrice: number
  subscriptionCurrency?: string
}) {
  const creator = await executeCreatorConfigurationUpdate({
    creatorId: input.creatorId,
    subscriptionPrice: input.subscriptionPrice,
    subscriptionCurrency: input.subscriptionCurrency ?? "KRW",
  })


}