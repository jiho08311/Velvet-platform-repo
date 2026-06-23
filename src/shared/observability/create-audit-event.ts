import type { AuditEvent } from "./audit-event"
import type {
  AuditActor,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditEventCategory,
  AuditEventSeverity,
  AuditMetadata,
} from "./audit-event-types"

type CreateAuditEventInput = Readonly<{
  category: AuditEventCategory
  severity: AuditEventSeverity
  action: string
  actor: AuditActor
  authorityScope: AuditAuthorityScope
  correlation?: AuditCorrelationContext
  metadata?: AuditMetadata
  occurredAt?: string
}>

function assertNonEmptyString(value: string, errorCode: string): string {
  const safeValue = value.trim()

  if (!safeValue) {
    throw new Error(errorCode)
  }

  return safeValue
}

/**
 * Pure canonical audit event builder.
 *
 * This function is intentionally side-effect free:
 * - no DB writes
 * - no console logging
 * - no network calls
 * - no authority promotion
 * - no runtime behavior mutation
 */
export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  const action = assertNonEmptyString(
    input.action,
    "AUDIT_EVENT_ACTION_REQUIRED"
  )

  const authority = assertNonEmptyString(
    input.authorityScope.authority,
    "AUDIT_EVENT_AUTHORITY_REQUIRED"
  )

  return Object.freeze({
    category: input.category,
    severity: input.severity,
    action,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    actor: Object.freeze({
      type: input.actor.type,
      id: input.actor.id ?? null,
    }),
    authorityScope: Object.freeze({
      ...input.authorityScope,
      authority,
    }),
    correlation: Object.freeze(input.correlation ?? {}),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}