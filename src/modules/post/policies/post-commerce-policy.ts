import type {
  PostAccessLockReason,
  PostCommerceState,
  PostPurchaseBlockingReason,
  PostPurchaseEligibility,
} from "../types"

type PostCommerceCtaDecisionInput = {
  isLocked: boolean
  lockReason?: PostAccessLockReason
  commerce: PostCommerceState
}

export type PostCommerceCtaDecision = {
  showPurchaseCta: boolean
  showSubscribeCta: boolean
}

type BlockedPostCommerceStateInput = {
  blockingReason: PostPurchaseBlockingReason
  hasPurchased: boolean
  isSubscribed: boolean
}

type PostCommerceStateInput = {
  purchaseEligibility: PostPurchaseEligibility
  hasPurchased: boolean
  isSubscribed: boolean
}

type PostPurchaseCtaVisibilityInput = {
  isLocked: boolean
  purchaseEligibility: PostPurchaseEligibility
}

function getPostPurchaseCtaVisibility({
  isLocked,
  purchaseEligibility,
}: PostPurchaseCtaVisibilityInput): boolean {
  if (!isLocked) {
    return false
  }

  return purchaseEligibility.canPurchase
}

export function getPostCommerceState({
  purchaseEligibility,
  hasPurchased,
  isSubscribed,
}: PostCommerceStateInput): PostCommerceState {
  return {
    purchaseEligibility,
    hasPurchased,
    isSubscribed,
  }
}

export function getBlockedPostCommerceState({
  blockingReason,
  hasPurchased,
  isSubscribed,
}: BlockedPostCommerceStateInput): PostCommerceState {
  return getPostCommerceState({
    purchaseEligibility: {
      canPurchase: false,
      blockingReason,
    },
    hasPurchased,
    isSubscribed,
  })
}

export function getPostCommerceCtaDecision({
  isLocked,
  lockReason,
  commerce,
}: PostCommerceCtaDecisionInput): PostCommerceCtaDecision {
  return {
    showPurchaseCta: getPostPurchaseCtaVisibility({
      isLocked,
      purchaseEligibility: commerce.purchaseEligibility,
    }),
    showSubscribeCta:
      isLocked &&
      lockReason === "subscription" &&
      commerce.isSubscribed === false,
  }
}