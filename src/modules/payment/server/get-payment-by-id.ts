import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type PaymentDetails = {
  id: string
  viewerUserId: string
  creatorId: string | null
  amountCents: number
  status: "pending" | "succeeded" | "failed" | "refunded"
  createdAt: string
}

export async function getPaymentById(
  paymentId: string
): Promise<PaymentDetails | null> {
  const id = paymentId.trim()
  if (!id) return null

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payments")
    .select("id, user_id, creator_id, amount_cents, status, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    viewerUserId: data.user_id,
    creatorId: data.creator_id,
    amountCents: data.amount_cents,
    status: data.status,
    createdAt: data.created_at,
  }
}