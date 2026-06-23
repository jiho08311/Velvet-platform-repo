"use client"

import SubscribeButton from "@/modules/creator/public/creator-surface-ui"
import type { PostCommerceState } from "@/modules/post/types"
import { getPostCommerceCtaDecision } from "@/modules/post/public/get-post-commerce-cta-decision"
import PostPurchaseButton from "./PostPurchaseButton"
import type { PostCardCreator } from "./PostCard"

type PostCardLockedActionProps = {
  postId?: string
  isLocked: boolean
  lockReason: "none" | "subscription" | "purchase"
  commerce: PostCommerceState
  price?: number
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  creator: PostCardCreator
}

export function PostCardLockedAction({
  postId,
  isLocked,
  lockReason,
  commerce,
  price,
  creatorId,
  creatorUserId,
  currentUserId,
  creator,
}: PostCardLockedActionProps) {
  const ctaDecision = getPostCommerceCtaDecision({
    isLocked,
    lockReason,
    commerce,
  })

  if (ctaDecision.showSubscribeCta) {
    return (
      <div onClick={(event) => event.stopPropagation()}>
        <SubscribeButton
          creatorId={creatorId}
          creatorUserId={creatorUserId}
          currentUserId={currentUserId}
          creatorUsername={creator.username}
          embedded
        />
      </div>
    )
  }

  if (ctaDecision.showPurchaseCta && postId) {
    return (
      <div onClick={(event) => event.stopPropagation()}>
        <PostPurchaseButton
          postId={postId}
          price={price}
          creatorUsername={creator.username}
          embedded
        />
      </div>
    )
  }

  return null
}
