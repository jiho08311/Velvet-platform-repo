import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type AuditAction =
  | "payment_confirmed"
  | "earning_created"
  | "earning_reversed"
  | "payout_requested"
  | "payout_approved"
  | "payout_paid"

type CreateAuditLogInput = {
  actorId?: string | null
  action: AuditAction
  targetType: "payment" | "earning" | "payout" | "payout_request"
  targetId: string
  metadata?: Record<string, any>
}

export async function createAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: CreateAuditLogInput): Promise<void> {
  if (!targetId) {
    throw new Error("AUDIT_TARGET_REQUIRED")
  }

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId ?? null,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata ?? {},
    created_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }
}