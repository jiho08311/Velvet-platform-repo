import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type AuditAction =
  | "payment_confirmed"
  | "earning_created"
  | "earning_reversed"
  | "payout_requested"
  | "payout_approved"
  | "payout_paid"

type AuditTargetType = "payment" | "earning" | "payout" | "payout_request"

type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue }

type AuditMetadata = Record<string, AuditMetadataValue>

type CreateAuditLogInput = {
  actorId?: string | null
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  metadata?: AuditMetadata
}

/**
 * Canonical audit log writer.
 *
 * Write boundary:
 * - use this helper after the audited state change has succeeded
 * - prefer calling this from the domain write source of truth
 * - do not create admin audit read surfaces from this file
 *
 * Read boundary:
 * - audit admin read surface is intentionally absent unless explicitly provided
 */
export async function createAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: CreateAuditLogInput): Promise<void> {
  const safeTargetId = targetId.trim()

  if (!safeTargetId) {
    throw new Error("AUDIT_TARGET_REQUIRED")
  }

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId ?? null,
    action,
    target_type: targetType,
    target_id: safeTargetId,
    metadata: metadata ?? {},
    created_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }
}