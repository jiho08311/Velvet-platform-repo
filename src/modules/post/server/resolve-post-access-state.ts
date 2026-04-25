import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { getPostPurchaseEligibility } from "@/modules/post/lib/can-purchase-post"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"
import type {
  PostAccessResult,
  PostPurchaseEligibility,
  PostStatus,
  PostVisibility,
} from "../types"
import { getPostAccess } from "./get-post-access"

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
  access: PostAccessResult
  purchaseEligibility: PostPurchaseEligibility
}

export async function resolvePostAccessState({
  viewerUserId,
  creatorId,
  creatorUserId,
  post,
}: ResolvePostAccessStateInput): Promise<ResolvedPostAccessState> {
  const resolvedViewerUserId =
    typeof viewerUserId === "string" && viewerUserId.trim().length > 0
      ? viewerUserId.trim()
      : null

  const isOwner =
    resolvedViewerUserId !== null && resolvedViewerUserId === creatorUserId

  let isSubscribed = false
  let hasPurchased = false

  if (isOwner) {
    isSubscribed = true
    hasPurchased = post.visibility === "paid"
  } else if (resolvedViewerUserId !== null) {
    const viewerSubscription = await getViewerSubscription(
      resolvedViewerUserId,
      creatorId,
    )

    isSubscribed = viewerSubscription.isActive

    if (post.visibility === "paid" && post.price > 0) {
      hasPurchased = await hasPurchasedPost({
        userId: resolvedViewerUserId,
        postId: post.id,
      })
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

  return {
    viewerUserId: resolvedViewerUserId,
    isOwner,
    isSubscribed,
    hasPurchased,
    access,
    purchaseEligibility: getPostPurchaseEligibility({
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
    }),
  }
}
