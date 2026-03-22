import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type HasPurchasedPostParams = {
  userId: string;
  postId: string;
};

type PaymentRow = {
  id: string;
};

export async function hasPurchasedPost({
  userId,
  postId,
}: HasPurchasedPostParams): Promise<boolean> {
  const safeUserId = userId.trim();
  const safePostId = postId.trim();

  if (!safeUserId || !safePostId) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("user_id", safeUserId)
    .eq("type", "ppv_post")
    .eq("target_type", "post")
    .eq("target_id", safePostId)
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle<PaymentRow>();

  if (error) {
    console.error("[hasPurchasedPost] query error", error);
    throw error;
  }

  return Boolean(data);
}