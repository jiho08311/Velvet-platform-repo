import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type TrustSafetyActionType =
  | "HIDE_CONTENT"
  | "REMOVE_CONTENT"
  | "LIMIT_VISIBILITY"
  | "SUSPEND_USER"
  | "BAN_USER"
  | "WARN_USER"

export type TrustSafetyActionTargetType =
  | "POST"
  | "STORY"
  | "MEDIA"
  | "USER"
  | "CREATOR"

export type InsertTrustSafetyActionInput = {
  actionId: string
  actionType: TrustSafetyActionType
  targetType: TrustSafetyActionTargetType
  targetId: string
  sourceCaseId: string
  reason?: string | null
  payload?: Record<string, unknown>
}

export async function insertTrustSafetyAction(
  input: InsertTrustSafetyActionInput
): Promise<void> {
  const { error } = await supabaseAdmin.from("trust_safety_actions").insert({
    action_id: input.actionId,
    action_type: input.actionType,
    target_type: input.targetType,
    target_id: input.targetId,
    source_case_id: input.sourceCaseId,
    action_status: "issued",
    reason: input.reason ?? null,
    payload: input.payload ?? {},
  })

  if (error) {
    throw error
  }
}