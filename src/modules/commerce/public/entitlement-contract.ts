import type {
  CommerceContext,
  EntitlementDecision,
  EntitlementSubject,
} from "./types"

import { canAccessCreatorUseCase } from "@/modules/commerce/application/entitlement/can-access-creator-use-case"

export async function canAccessCreator(
  input: CanAccessCreatorInput
): Promise<EntitlementAccessResult> {
  return canAccessCreatorUseCase(input)
}

import { canAccessPostUseCase } from "@/modules/commerce/application/entitlement/can-access-post-use-case"

export async function canAccessPost(
  input: CanAccessPostInput
): Promise<EntitlementAccessResult> {
  return canAccessPostUseCase(input)
}

export type ResolveViewerEntitlementInput = {
  viewerUserId: string | null
  subject: EntitlementSubject
  context?: CommerceContext
}

export type ResolveViewerEntitlementResult = {
  decision: EntitlementDecision
}

export type CanAccessCreatorInput = {
  viewerUserId: string | null
  creatorId: string
  context?: CommerceContext
}

export type CanAccessPostInput = {
  viewerUserId: string | null
  postId: string
  context?: CommerceContext
}

export type CanAccessMessageInput = {
  viewerUserId: string | null
  messageId: string
  context?: CommerceContext
}

export type EntitlementAccessResult = {
  decision: EntitlementDecision
}

export type ListViewerPurchasedPostTargetsInput = {
  viewerUserId: string
  creatorId?: string
}

export type PurchasedPostTarget = {
  postId: string
  paymentId: string
  purchasedAt: string
}

export type ListViewerPurchasedPostTargetsResult = {
  targets: PurchasedPostTarget[]
}