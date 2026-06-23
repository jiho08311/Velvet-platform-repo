// src/modules/identity/runtime/execute-creator-authority-creation-runtime.ts
import type { IdentityRuntimeResult } from "../contracts/identity-side-effect-contract"
import {
  createCreatorAuthority,
  readCreatorAuthorityByUserId,
} from "../repositories/creator-authority-repository"

export type ExecuteCreatorAuthorityCreationInput = {
  userId: string
  instagramUsername?: string | null
  bankName: string
  accountHolderName: string
  accountNumber: string
}

export type CreatorAuthorityCreationData = {
  id: string
  userId: string
  status: "pending" | "active" | "suspended"
  subscriptionPrice: number
  subscriptionCurrency: string
  instagramUsername: string | null
  createdAt: string
  updatedAt: string
}

export async function executeCreatorAuthorityCreation(
  input: ExecuteCreatorAuthorityCreationInput,
): Promise<IdentityRuntimeResult<CreatorAuthorityCreationData>> {
  const { data: existing, error: existingError } =
    await readCreatorAuthorityByUserId(input.userId)

  if (existingError) throw existingError

  if (existing?.creator_id && existing.user_id) {
    return {
      data: {
        id: existing.creator_id,
        userId: existing.user_id,
        status: existing.status,
        subscriptionPrice:
          typeof existing.aggregate_metadata?.subscriptionPrice === "number"
            ? existing.aggregate_metadata.subscriptionPrice
            : 0,
        subscriptionCurrency:
          typeof existing.aggregate_metadata?.subscriptionCurrency === "string"
            ? existing.aggregate_metadata.subscriptionCurrency
            : "KRW",
        instagramUsername:
          typeof existing.aggregate_metadata?.instagramUsername === "string"
            ? existing.aggregate_metadata.instagramUsername
            : input.instagramUsername ?? null,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at,
      },
      sideEffects: [],
    }
  }

  const { data, error } = await createCreatorAuthority({
    profileId: input.userId,
    userId: input.userId,
    instagramUsername: input.instagramUsername ?? null,
    subscriptionPrice: 0,
    subscriptionCurrency: "KRW",
    context: {
      actorType: "user",
      reason: "creator_authority_created",
      sourceSurface: "creator.onboarding",
      sourceSymbol: "executeCreatorAuthorityCreation",
      occurredAt: new Date().toISOString(),
    },
  })

  if (error || !data?.creator_id || !data.user_id) {
    throw error ?? new Error("CREATOR_CREATE_FAILED")
  }

  return {
    data: {
      id: data.creator_id,
      userId: data.user_id,
      status: data.status,
      subscriptionPrice: 0,
      subscriptionCurrency: "KRW",
      instagramUsername: input.instagramUsername ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    sideEffects: [
      {
        type: "payout_account_provisioning_requested",
        creatorId: data.creator_id,
        bankName: input.bankName,
        accountHolderName: input.accountHolderName,
        accountNumber: input.accountNumber,
      },
    ],
  }
}