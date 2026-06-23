export type DomainAggregateType =
  | "payment"
  | "subscription"
  | "earning"
  | "payout"
  | "post"
  | "comment"
  | "message"
  | "notification"
  | "creator"
  | "profile"
  | "user"
  | "projection"
  | "entitlement"
  | "ledger"
  | "media"
  | "report"
  | "moderation"

export type MediaDomainEventType =
  | "MediaUploaded"
  | "MediaProcessingStarted"
  | "MediaReady"
  | "MediaFailed"
  | "PostMediaBound"
  | "StoryMediaBound"
  | "MessageMediaBound"
  | "MediaAccessEvaluated"

export type PaymentDomainEventType =
  | "PaymentConfirmed"
  | "PaymentConfirmationDuplicated"
  | "PaymentTargetNormalized"
  | "PaymentRefunded"

export type SubscriptionDomainEventType =
  | "SubscriptionActivated"
  | "SubscriptionRenewed"
  | "SubscriptionCancelled"
  | "SubscriptionExpired"

export type PayoutDomainEventType =
  | "EarningCreated"
  | "EarningCreationSkipped"
  | "EarningCreationFailed"
  | "PayoutRequested"
  | "PayoutPaid"
  | "PayoutFailed"

export type NotificationDomainEventType =
  | "NotificationRequested"
  | "NotificationCreated"
  | "NotificationQueued"
  | "NotificationDeliveryAttempted"
  | "NotificationDelivered"
  | "NotificationDeliveryFailed"
  | "NotificationRead"
  | "NotificationHidden"
  | "NotificationRestored"
  | "NotificationDeleted"
  | "AllNotificationsRead"

export type PostDomainEventType =
  | "PostPublished"
  | "PostUpdated"
  | "PostDeleted"
  | "PostLiked"
  | "PostUnliked"
  | "CommentCreated"
  | "CommentLiked"
  | "CommentUnliked"
  | "ContentVisibilityChanged"

export type ProjectionDomainEventType =
  | "FeedProjectionRequested"
  | "SearchProjectionRequested"
  | "AnalyticsRollupRequested"
  | "DashboardSnapshotRequested"
  | "ProjectionRebuildRequested"

export type ShadowDomainEventType =
  | "EntitlementGrantObserved"
  | "EntitlementRevokeObserved"
  | "EntitlementParityChecked"

export type LedgerDomainEventType =
  | "LedgerMutationObserved"
  | "LedgerTransactionCreated"

export type ReportDomainEventType = "ReportSubmitted"

export type IdentityDomainEventType =
  | "UserTrustStateChanged"

export type AnalyticsDomainEventType =
  | "RevenueMetricRecorded"
  | "AudienceMetricRecorded"
  | "ContentMetricRecorded"
  | "ModerationMetricRecorded"

export type ModerationDomainEventType =
  | "ModerationCaseOpened"
  | "ModerationCaseReviewed"
  | "TrustSafetyActionIssued"

export type ProfileDomainEventType = "ProfileUpdated"

export type CreatorDomainEventType = "CreatorActivated"

export type MessageDomainEventType =
  | "message.sent"
  | "PpvMessagePurchased"
  | "MessageAccessGranted"

export type DomainEventType =
  | PaymentDomainEventType
  | SubscriptionDomainEventType
  | PayoutDomainEventType
  | NotificationDomainEventType
  | PostDomainEventType
  | ProjectionDomainEventType
  | ShadowDomainEventType
  | LedgerDomainEventType
  | ReportDomainEventType
  | IdentityDomainEventType
  | AnalyticsDomainEventType
  | ModerationDomainEventType
  | ProfileDomainEventType
  | CreatorDomainEventType
  | MediaDomainEventType
  | MessageDomainEventType

  