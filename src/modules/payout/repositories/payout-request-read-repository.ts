import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PayoutRequestRow } from "@/modules/payout/mappers/build-payout-request-read-model"

export async function findPayoutRequestById(
  payoutRequestId: string
): Promise<PayoutRequestRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payout_request_state")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at"
    )
    .eq("id", payoutRequestId)
    .maybeSingle<PayoutRequestRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function listPayoutRequestsByCreatorId(
  creatorId: string
): Promise<PayoutRequestRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payout_request_state")
    .select("id, creator_id, amount, currency, status, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listAllPayoutRequestRows(): Promise<PayoutRequestRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payout_request_state")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at, rejected_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export type AdminPayoutRequestRow = PayoutRequestRow & {
  rejection_reason: string | null
}

export async function listAdminPayoutRequestRows(): Promise<
  AdminPayoutRequestRow[]
> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_payout_request_state")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at, rejected_at, rejection_reason"
    )
    .order("created_at", { ascending: false })
    .returns<AdminPayoutRequestRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export type ApprovedPayoutRequestShadowRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: "approved"
  approved_at: string
}

export async function findApprovedPayoutRequestShadowRowOrThrow(
  payoutRequestId: string
): Promise<ApprovedPayoutRequestShadowRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_request_state")
    .select("id, creator_id, amount, currency, status, approved_at")
    .eq("id", payoutRequestId)
    .single<ApprovedPayoutRequestShadowRow>()

  if (
    error ||
    !data ||
    data.status !== "approved" ||
    !data.approved_at
  ) {
    throw error ?? new Error("APPROVED_PAYOUT_REQUEST_SHADOW_ROW_NOT_FOUND")
  }

  return data
}
