export type AuditEventCategory =
  | "financial"
  | "access"
  | "moderation"
  | "service_role"
  | "workflow"
  | "admin"
  | "system"

export type AuditEventSeverity =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical"

export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { readonly [key: string]: AuditMetadataValue }

export type AuditMetadata = Readonly<Record<string, AuditMetadataValue>>

export type AuditActorType =
  | "user"
  | "admin"
  | "service_role"
  | "system"
  | "cron"
  | "worker"
  | "unknown"

export type AuditActor = Readonly<{
  type: AuditActorType
  id?: string | null
}>

export type AuditCorrelationContext = Readonly<{
  correlationId?: string | null
  requestId?: string | null
  workflowId?: string | null
  jobId?: string | null
  causationId?: string | null
}>

export type AuditAuthorityScope = Readonly<{
  authority: string
  resourceType?: string | null
  resourceId?: string | null
}>