import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { canPaymentUnlockAccess } from "./payment-result-state"

type HasPurchasedPostParams = {
  userId: string
  postId: string
}

type PaymentRow = {
  id: string
  status: "pending" | "succeeded" | "failed" | "refunded"
}

export async function hasPurchasedPost({
  userId,
  postId,
}: HasPurchasedPostParams): Promise<boolean> {
  const safeUserId = userId.trim()
  const safePostId = postId.trim()

  if (!safeUserId || !safePostId) {
    return false
  }

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id, status")
    .eq("user_id", safeUserId)
    .eq("type", "ppv_post")
    .eq("target_type", "post")
    .eq("target_id", safePostId)
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle<PaymentRow>()

  if (error) {
    console.error("[hasPurchasedPost] query error", error)
    throw error
  }

  if (!data) {
    return false
  }

  return canPaymentUnlockAccess(data.status)
}