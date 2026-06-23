// src/shared/observability/service-role-provenance.ts

export type ServiceRoleAuthorityScope =
  | "db.read"
  | "db.write"
  | "db.rpc"
  | "storage.read"
  | "storage.write"
  | "storage.delete"
  | "storage.sign"
  | "auth.admin"
  | "unknown"

export type ServiceRoleActorType =
  | "user"
  | "admin"
  | "system"
  | "cron"
  | "worker"
  | "workflow"
  | "unknown"

export type ServiceRoleProvenanceMetadataValue =
  | string
  | number
  | boolean
  | null
  | ServiceRoleProvenanceMetadataValue[]
  | { [key: string]: ServiceRoleProvenanceMetadataValue }

export type ServiceRoleProvenanceMetadata = Record<
  string,
  ServiceRoleProvenanceMetadataValue
>

export type ServiceRoleProvenance = {
  actorId: string | null
  actorType: ServiceRoleActorType
  authorityScope: ServiceRoleAuthorityScope
  workflowName: string | null
  operationName: string
  correlationId: string
  causationId: string | null
  requestId: string | null
  sourceFile: string | null
  createdAt: string
  metadata: ServiceRoleProvenanceMetadata
}

export type CreateServiceRoleProvenanceInput = {
  actorId?: string | null
  actorType?: ServiceRoleActorType
  authorityScope?: ServiceRoleAuthorityScope
  workflowName?: string | null
  operationName: string
  correlationId?: string | null
  causationId?: string | null
  requestId?: string | null
  sourceFile?: string | null
  metadata?: ServiceRoleProvenanceMetadata
}

export function createServiceRoleProvenance({
  actorId = null,
  actorType = "unknown",
  authorityScope = "unknown",
  workflowName = null,
  operationName,
  correlationId,
  causationId = null,
  requestId = null,
  sourceFile = null,
  metadata = {},
}: CreateServiceRoleProvenanceInput): ServiceRoleProvenance {
  return {
    actorId,
    actorType,
    authorityScope,
    workflowName,
    operationName,
    correlationId: correlationId ?? crypto.randomUUID(),
    causationId,
    requestId,
    sourceFile,
    createdAt: new Date().toISOString(),
    metadata,
  }
}