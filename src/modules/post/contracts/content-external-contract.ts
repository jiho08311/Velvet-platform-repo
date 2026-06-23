export type ContentIdentityContract = {
  readCreatorPublicIdentity(input: {
    creatorId: string
  }): Promise<{
    creatorId: string
    userId: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    creatorLifecycleState: string | null
    creatorVisibilityState: string | null
    profileLifecycleState: string | null
    identityVisibilityState: string | null
  } | null>
}

export type ContentMediaContract = {
  createMediaForPostBlock(input: {
    ownerUserId: string
    postId: string
    file: File
    blockProjectionKey: string
  }): Promise<{
    mediaId: string
    moderationStatus: "pending" | "approved" | "rejected" | "needs_review" | null
    processingStatus: "processing" | "ready" | "failed" | null
  }>

  createSignedPostMediaUrl(input: {
    mediaId: string
    viewerId: string | null
    accessMode: "full" | "locked_preview"
  }): Promise<string | null>
}

export type ContentModerationContract = {
  resolvePostModerationDecision(input: {
    postId: string
    mediaModerationStatuses: Array<
      "pending" | "approved" | "rejected" | "needs_review" | null
    >
  }): Promise<{
    outcome: "approved" | "rejected" | "needs_review"
    rejectionReason?: string | null
  }>
}

export type ContentPaymentContract = {
  hasPurchasedPost(input: {
    postId: string
    userId: string
  }): Promise<boolean>
}

export type ContentSubscriptionContract = {
  hasActiveCreatorSubscription(input: {
    creatorId: string
    userId: string
  }): Promise<boolean>
}

export type ContentNotificationContract = {
  emitContentInteractionNotification(input: {
    type: "post_liked" | "comment_created" | "comment_liked"
    actorUserId: string
    recipientUserId: string
    postId?: string
    commentId?: string
  }): Promise<void>
}