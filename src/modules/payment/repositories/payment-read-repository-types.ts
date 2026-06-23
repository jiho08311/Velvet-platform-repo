import type {
  PaymentProvider,
  PaymentStatus,
  PaymentTargetType,
  PaymentType,
} from "@/modules/payment/types"

export type PaymentDetailsRow = {
  id: string
  user_id: string
  creator_id: string | null
  amount: number
  status: PaymentStatus
  created_at: string
}

export type PaymentCreationRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  amount: number
  currency: string
  provider: PaymentProvider
  provider_reference_id: string | null
  target_type: PaymentTargetType
  target_id: string | null
  created_at: string
  updated_at: string
}

export type FindSucceededPpvPostPaymentInput = {
  userId: string
  postId: string
}

export type PpvPostPaymentRow = {
  id: string
  status: PaymentStatus
}

export type FindExistingPpvPostPaymentInput = {
  userId: string
  postId: string
}

export type ExistingPpvPostPaymentRow = {
  id: string
}

export type AdminPaymentRow = {
  id: string
  amount: number | null
  status: PaymentStatus
  type: PaymentType | null
  created_at: string
  user_id: string | null
  creator_id: string | null
  currency: string | null
}

export type ListCreatorPaymentRowsInput = {
  creatorId: string
}

export type CreatorPaymentRow = {
  id: string
  amount: number | null
  currency: string | null
  user_id: string | null
  status: PaymentStatus
  type: PaymentType
  created_at: string
}

export type RecentPaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: string
  status: string
  amount: number
  currency: string
  created_at: string
}

export type PaymentConfirmRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  amount: number
  currency: string
  provider: PaymentProvider
  provider_reference_id: string | null
  target_type: PaymentTargetType
  target_id: string | null
  confirmed_at: string | null
}

export type PaymentRefundRow = {
  id: string
  status: PaymentStatus
  user_id: string
  creator_id: string | null
  type: PaymentType
  amount: number
  currency: string
  provider: PaymentProvider
  target_type: PaymentTargetType
  target_id: string | null
}

export type PaymentFailureRow = PaymentRefundRow

export type PaymentConfirmationTargetRow = {
  id: string
  user_id: string
  type: PaymentType | null
  target_type: PaymentTargetType
  target_id: string | null
  provider: PaymentProvider
}

export type PaymentForEarningRow = {
  id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  currency: string | null
  amount: number | null
  confirmed_at: string | null
}

export type PaymentParityRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  amount: number
  currency: string
  provider: PaymentProvider
  target_type: PaymentTargetType
  target_id: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

export type PaymentAccessVerificationRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  target_type: PaymentTargetType
  target_id: string | null
}

export type PaymentAnalyticsQueryResult<T> = {
  data: T[] | null
  error: unknown
}

export type CreatorAnalyticsPaymentAmountRow = {
  amount: number | string | null
}

export type CreatorAnalyticsPaymentRow = CreatorAnalyticsPaymentAmountRow & {
  id: string
  type: string | null
  created_at: string | null
}

export type ListCreatorAnalyticsMonthlyPaymentRowsInput = {
  creatorId: string
  periodStart: string
}

export type PaymentAnalyticsAmountRow = {
  amount: number | null
}

export type CreatorDashboardPaymentRow = {
  amount: number | string | null
  created_at?: string | null
  currency: string | null
}

export type ListCreatorDashboardPaymentRowsInput = {
  creatorId: string
  monthStart: string
}

export type ViewerPurchasedPostTargetRow = {
  target_id: string | null
}

export type ListViewerPurchasedPostTargetRowsInput = {
  viewerUserId: string
  postIds: string[]
}

export type ListPaymentRowsForReplayInput = {
  windowStart?: string | null
  windowEnd?: string | null
  limit: number
}
