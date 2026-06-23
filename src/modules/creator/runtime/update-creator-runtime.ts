// src/modules/creator/runtime/update-creator-runtime.ts
export type UpdateCreatorInput = {
  creatorId: string
  status?: "pending" | "active" | "suspended"
  subscriptionPrice?: number
  subscriptionCurrency?: string
}

export {
  executeCreatorConfigurationUpdate as updateCreatorRuntime,
} from "@/modules/identity/public/creator-authority"