import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  createClient,
  createSupabaseServerClient,
} from "@/infrastructure/supabase/server"
import type {
  AdminPaymentRow,
  CreatorPaymentRow,
  ExistingPpvPostPaymentRow,
  FindExistingPpvPostPaymentInput,
  FindSucceededPpvPostPaymentInput,
  ListCreatorPaymentRowsInput,
  ListViewerPurchasedPostTargetRowsInput,
  PaymentCreationRow,
  PaymentDetailsRow,
  PpvPostPaymentRow,
  RecentPaymentRow,
  ViewerPurchasedPostTargetRow,
} from "./payment-read-repository-types"
export {
  listAdminPaymentAnalyticsRows,
  listCreatorAnalyticsMonthlyPaymentRows,
  listCreatorAnalyticsTotalPaymentRows,
  listCreatorDashboardPaymentRows,
  listPlatformPaymentAnalyticsRows,
} from "./payment-analytics-read-repository"
export {
  findPaymentAccessVerificationById,
  findPaymentConfirmationTargetById,
  findPaymentForConfirmById,
  findPaymentForEarningById,
  findPaymentForFailureById,
  findPaymentForParityById,
  findPaymentForRefundById,
  listPaymentRowsForReplay,
} from "./payment-lifecycle-read-repository"
export type {
  AdminPaymentRow,
  CreatorAnalyticsPaymentAmountRow,
  CreatorAnalyticsPaymentRow,
  CreatorDashboardPaymentRow,
  CreatorPaymentRow,
  PaymentAccessVerificationRow,
  PaymentAnalyticsAmountRow,
  PaymentAnalyticsQueryResult,
  PaymentConfirmRow,
  PaymentConfirmationTargetRow,
  PaymentCreationRow,
  PaymentDetailsRow,
  PaymentFailureRow,
  PaymentForEarningRow,
  PaymentParityRow,
  PaymentRefundRow,
  RecentPaymentRow,
  ViewerPurchasedPostTargetRow,
} from "./payment-read-repository-types"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"
import { InfrastructureError } from "@/shared/errors"

export async function findPaymentById(
  paymentId: string
): Promise<PaymentDetailsRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payment_state")
    .select("id, user_id, creator_id, amount, status, created_at")
    .eq("id", paymentId)
    .maybeSingle<PaymentDetailsRow>()

  if (error) throw error

  return data
}

export async function findCreatorNotificationUserId(
  creatorId: string
): Promise<string | null> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  return creator?.userId ?? null
}

export async function findPaymentByProviderReferenceId(
  providerReferenceId: string
): Promise<PaymentCreationRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select(
      "id, user_id, creator_id, type, status, amount, currency, provider, provider_reference_id, target_type, target_id, created_at, updated_at"
    )
    .eq("provider_reference_id", providerReferenceId)
    .maybeSingle<PaymentCreationRow>()

  if (error) {
    throw error
  }

  return data
}

export async function listAdminPaymentRows(): Promise<AdminPaymentRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payment_state")
    .select(
      "id, amount, currency, status, type, created_at, user_id, creator_id"
    )
    .order("created_at", { ascending: false })
    .returns<AdminPaymentRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function listCreatorPaymentRows({
  creatorId,
}: ListCreatorPaymentRowsInput): Promise<CreatorPaymentRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payment_state")
    .select("id, amount, currency, user_id, status, type, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .returns<CreatorPaymentRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function countSucceededPayments(): Promise<number | null> {
  const { count, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("*", { count: "exact", head: true })
    .eq("status", "succeeded")

  if (error) throw error

  return count
}

export async function listRecentPaymentRows(): Promise<
  RecentPaymentRow[] | null
> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, user_id, creator_id, type, status, amount, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<RecentPaymentRow[]>()

  if (error) throw error

  return data
}

export async function findExistingPpvPostPayment({
  userId,
  postId,
}: FindExistingPpvPostPaymentInput): Promise<ExistingPpvPostPaymentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "ppv_post")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("status", "succeeded")
    .maybeSingle<ExistingPpvPostPaymentRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findSucceededPpvPostPayment({
  userId,
  postId,
}: FindSucceededPpvPostPaymentInput): Promise<PpvPostPaymentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, status")
    .eq("user_id", userId)
    .eq("type", "ppv_post")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle<PpvPostPaymentRow>()

  if (error) {
    throw new InfrastructureError(
      "PPV_POST_PAYMENT_LOOKUP_FAILED",
      {
        cause: error,
        metadata: {
          userId,
          postId,
        },
      }
    )
  }

  return data
}
export async function listViewerPurchasedPostTargetRows({
  viewerUserId,
  postIds,
}: ListViewerPurchasedPostTargetRowsInput): Promise<
  ViewerPurchasedPostTargetRow[] | null
> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("target_id")
    .eq("user_id", viewerUserId)
    .eq("target_type", "post")
    .eq("status", "succeeded")
    .in("target_id", postIds)
    .returns<ViewerPurchasedPostTargetRow[]>()

  if (error) {
    throw new InfrastructureError(
      "VIEWER_PURCHASED_POST_TARGET_LOOKUP_FAILED",
      {
        cause: error,
        metadata: {
          viewerUserId,
          postCount: postIds.length,
        },
      }
    )
  }

  return data
}
