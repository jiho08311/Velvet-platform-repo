import {
  canAccessCreator,
  canAccessPost,
} from "@/modules/commerce/public/entitlement-contract"
import { isCreatorOwner } from "@/modules/creator/public/creator-identity"
import { getPostPurchaseEligibility } from "@/modules/post/policies/can-purchase-post"
import { getPostCommerceState } from "@/modules/post/policies/post-commerce-policy"
import { shadowEvaluateAccessNoThrow } from "@/modules/entitlement/public/shadow-evaluate-access"

import type {
  PostAccessResult,
  PostCommerceState,
  PostStatus,
  PostVisibility,
} from "../types"
import { getPostAccess } from "@/modules/post/policies/get-post-access"

type ResolvePostAccessStateInput = {
  viewerUserId?: string | null
  creatorId: string
  creatorUserId: string
  post: {
    id: string
    title: string | null
    content: string | null
    status: PostStatus
    visibility: PostVisibility
    price: number
    publishedAt: string | null
    createdAt: string
    updatedAt: string
  }
}

export type ResolvedPostAccessState = {
  viewerUserId: string | null
  isOwner: boolean
  isSubscribed: boolean
  hasPurchased: boolean
  canView: boolean
  isLocked: boolean
  lockReason: PostAccessResult["lockReason"]
  access: PostAccessResult
  commerce: PostCommerceState
}

export async function resolvePostAccessEntitlement({
  viewerUserId,
  creatorId,
  creatorUserId,
  post,
}: ResolvePostAccessStateInput): Promise<ResolvedPostAccessState> {
  const resolvedViewerUserId =
    typeof viewerUserId === "string" && viewerUserId.trim().length > 0
      ? viewerUserId.trim()
      : null

  const isOwner = isCreatorOwner({
    viewerUserId: resolvedViewerUserId,
    creatorUserId,
  })

  let isSubscribed = false
  let hasPurchased = false

  if (isOwner) {
    isSubscribed = true
    hasPurchased = post.visibility === "paid"
  } else if (resolvedViewerUserId !== null) {
    const creatorAccess = await canAccessCreator({
      viewerUserId: resolvedViewerUserId,
      creatorId,
    })

    isSubscribed = creatorAccess.decision.allowed

    if (post.visibility === "paid" && post.price > 0) {
      const postAccess = await canAccessPost({
        viewerUserId: resolvedViewerUserId,
        postId: post.id,
      })

  hasPurchased = postAccess.decision.source === "payment"
    }
  }

  const access = await getPostAccess({
    viewerUserId: resolvedViewerUserId,
    post: {
      id: post.id,
      creatorId,
      content: post.content ?? undefined,
      visibility: post.visibility,
      price: post.price,
      createdAt: post.createdAt,
    },
    creator: {
      userId: creatorUserId,
    },
    isSubscribedResult: isSubscribed,
    hasPurchasedResult: hasPurchased,
  })


    await shadowEvaluateAccessNoThrow({
    viewerUserId: resolvedViewerUserId,
    surface: "post_page",
    subject: {
      type: "post",
      postId: post.id,
      creatorId,
      creatorUserId,
      visibility: post.visibility,
      price: post.price,
    },
    legacyDecision: {
      canView: access.canView,
      allowed: access.canView,
      isLocked: access.isLocked,
      lockReason: access.lockReason,
      source: hasPurchased
        ? "payment"
        : isSubscribed
          ? "subscription"
          : isOwner
            ? "owner"
            : post.visibility === "public"
              ? "public"
              : "none",
      reason: access.lockReason,
    },
  })

  const purchaseEligibility = getPostPurchaseEligibility({
    post: {
      id: post.id,
      creatorId,
      title: post.title,
      content: post.content,
      status: post.status,
      visibility: post.visibility,
      price: post.price,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    },
    isOwner,
    hasPurchased,
    isSubscribed,
  })

  return {
    viewerUserId: resolvedViewerUserId,
    isOwner,
    isSubscribed,
    hasPurchased,
    canView: access.canView,
    isLocked: access.isLocked,
    lockReason: access.lockReason,
    access,
    commerce: getPostCommerceState({
      purchaseEligibility,
      hasPurchased,
      isSubscribed,
    }),
  }
}
