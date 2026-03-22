import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatePpvPostPaymentInput = {
  userId: string
  creatorId: string
  postId: string
  amount: number
  currency: string
}

type PaymentRow = {
  id: string
}

export async function createPpvPostPayment({
  userId,
  creatorId,
  postId,
  amount,
  currency,
}: CreatePpvPostPaymentInput) {
  // ✅ 이미 구매했는지 확인
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "ppv_post")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("status", "succeeded")
    .maybeSingle<PaymentRow>()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return existing
  }

  // ✅ 없으면 생성
  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: userId,
      creator_id: creatorId,
      type: "ppv_post",
      target_type: "post",
      target_id: postId,
      amount_cents: amount,
      currency,
      status: "succeeded",
      provider: "mock",
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}