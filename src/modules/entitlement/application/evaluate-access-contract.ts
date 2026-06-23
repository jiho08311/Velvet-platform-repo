export type EntitlementAccessSubject =
  | {
      type: "creator"
      creatorId: string
    }
  | {
      type: "post"
      postId: string
      creatorId: string
      creatorUserId: string
      visibility: "public" | "subscribers" | "paid"
      price?: number | null
    }
  | {
      type: "message"
      messageId: string
      conversationId?: string | null
      senderUserId?: string | null
      viewerIsConversationParticipant?: boolean
      isPaid?: boolean
    }

export type EvaluateAccessSurface =
  | "creator_page"
  | "post_page"
  | "feed"
  | "search"
  | "message_list"
  | "message_media"
  | "subscription_check"
  | "payment_confirm"

export type EvaluateAccessInput = {
  viewerUserId: string | null
  subject: EntitlementAccessSubject
  surface: EvaluateAccessSurface
  correlationId?: string
}

export type EvaluateAccessDecision = {
  allowed: boolean
  canAccess: boolean
  canView: boolean
  isLocked: boolean
  lockReason:
    | "none"
    | "unauthenticated"
    | "subscription"
    | "purchase"
    | "message_purchase"
    | "not_participant"
    | "not_found"
  source:
    | "owner"
    | "public"
    | "creator_membership_grant"
    | "content_access_grant"
    | "message_access_grant"
    | "none"
  reason:
    | "owner"
    | "public"
    | "active_creator_membership"
    | "active_content_access"
    | "active_message_access"
    | "unauthenticated"
    | "not_subscribed"
    | "not_purchased"
    | "message_not_purchased"
    | "not_participant"
    | "unsupported"
  subject: EntitlementAccessSubject
  grantId: string | null
  projectionId: string | null
  expiresAt: string | null
  decisionVersion: "entitlement_v1"
  evaluatedAt: string
}
