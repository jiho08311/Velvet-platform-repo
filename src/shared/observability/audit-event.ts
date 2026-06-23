import type {
  AuditActor,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditEventCategory,
  AuditEventSeverity,
  AuditMetadata,
} from "./audit-event-types"

export type AuditEvent = Readonly<{
  id?: string
  category: AuditEventCategory
  severity: AuditEventSeverity
  action: string
  occurredAt: string
  actor: AuditActor
  authorityScope: AuditAuthorityScope
  correlation: AuditCorrelationContext
  metadata: AuditMetadata
}>