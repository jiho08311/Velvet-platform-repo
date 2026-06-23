import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue }

export type AuditMetadata = Record<string, AuditMetadataValue>

export async function insertAuditLogProjection(input: {
  actorId?: string | null
  action: string
  targetType: string
  targetId: string
  metadata?: AuditMetadata
}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: input.actorId ?? null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }
}
