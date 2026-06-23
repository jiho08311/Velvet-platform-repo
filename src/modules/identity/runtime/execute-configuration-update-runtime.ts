// src/modules/identity/runtime/execute-creator-configuration-update-runtime.ts
import { updateCreatorConfiguration } from "../repositories/creator-authority-repository"

function assertValidSubscriptionPrice(price: number) {
  if (!Number.isInteger(price)) throw new Error("Invalid subscription price")
  if (price <= 0) throw new Error("Invalid subscription price")
  if (price > 10_000_000) throw new Error("Invalid subscription price")
}

export async function executeCreatorConfigurationUpdate(input: {
  creatorId: string
  status?: "pending" | "active" | "suspended"
  subscriptionPrice?: number
  subscriptionCurrency?: string
}) {
  if (input.subscriptionPrice !== undefined) {
    assertValidSubscriptionPrice(input.subscriptionPrice)
  }

  const { data, error } = await updateCreatorConfiguration({
    creatorId: input.creatorId,
    status: input.status,
    subscriptionPrice: input.subscriptionPrice,
    subscriptionCurrency: input.subscriptionCurrency,
    context: {
      actorType: "creator",
      reason: "creator_configuration_updated",
      sourceSurface: "creator.update",
      sourceSymbol: "executeCreatorConfigurationUpdate",
      occurredAt: new Date().toISOString(),
    },
  })

  if (error || !data?.creator_id || !data.user_id) {
    throw error ?? new Error("CREATOR_UPDATE_FAILED")
  }

  const metadata = data.aggregate_metadata ?? {}

  return {
    id: data.creator_id,
    userId: data.user_id,
    status: data.status,
    subscriptionPrice:
      typeof metadata.subscriptionPrice === "number"
        ? metadata.subscriptionPrice
        : input.subscriptionPrice ?? 0,
    subscriptionCurrency:
      typeof metadata.subscriptionCurrency === "string"
        ? metadata.subscriptionCurrency
        : input.subscriptionCurrency ?? "KRW",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}