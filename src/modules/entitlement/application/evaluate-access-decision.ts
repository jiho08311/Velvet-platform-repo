import type { ActiveEntitlementProjectionRow } from "@/modules/entitlement/repositories/entitlement-access-read-repository"

import type {
  EntitlementAccessSubject,
  EvaluateAccessDecision,
} from "./evaluate-access-contract"

export function toGrantDecision(input: {
  subject: EntitlementAccessSubject
  projection: ActiveEntitlementProjectionRow
  source: EvaluateAccessDecision["source"]
  reason: EvaluateAccessDecision["reason"]
}): EvaluateAccessDecision {
  return {
    allowed: true,
    canAccess: true,
    canView: true,
    isLocked: false,
    lockReason: "none",
    source: input.source,
    reason: input.reason,
    subject: input.subject,
    grantId: input.projection.grant_id,
    projectionId: input.projection.id,
    expiresAt: input.projection.expires_at,
    decisionVersion: "entitlement_v1",
    evaluatedAt: new Date().toISOString(),
  }
}

export function toOpenDecision(input: {
  subject: EntitlementAccessSubject
  source: Extract<EvaluateAccessDecision["source"], "owner" | "public">
  reason: Extract<EvaluateAccessDecision["reason"], "owner" | "public">
}): EvaluateAccessDecision {
  return {
    allowed: true,
    canAccess: true,
    canView: true,
    isLocked: false,
    lockReason: "none",
    source: input.source,
    reason: input.reason,
    subject: input.subject,
    grantId: null,
    projectionId: null,
    expiresAt: null,
    decisionVersion: "entitlement_v1",
    evaluatedAt: new Date().toISOString(),
  }
}

export function deny(input: {
  subject: EntitlementAccessSubject
  lockReason: EvaluateAccessDecision["lockReason"]
  reason: EvaluateAccessDecision["reason"]
}): EvaluateAccessDecision {
  return {
    allowed: false,
    canAccess: false,
    canView: false,
    isLocked: input.lockReason !== "none",
    lockReason: input.lockReason,
    source: "none",
    reason: input.reason,
    subject: input.subject,
    grantId: null,
    projectionId: null,
    expiresAt: null,
    decisionVersion: "entitlement_v1",
    evaluatedAt: new Date().toISOString(),
  }
}
