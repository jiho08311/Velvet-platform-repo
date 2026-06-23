import {
  evaluateAccess,
  type EvaluateAccessDecision,
  type EvaluateAccessInput,
} from "@/modules/entitlement/public/evaluate-access"
import { recordAccessDecisionAudit } from "@/modules/entitlement/repositories/access-decision-audit-repository"
import { InfrastructureError } from "@/shared/errors"
import { logger } from "@/shared/observability/structured-logger"

export type LegacyAccessDecisionSnapshot = {
  allowed?: boolean
  canAccess?: boolean
  canView?: boolean
  isLocked?: boolean
  lockReason?: string | null
  source?: string | null
  reason?: string | null
}

export type ShadowEvaluateAccessInput = EvaluateAccessInput & {
  legacyDecision?: LegacyAccessDecisionSnapshot
  enabled?: boolean
}

export type ShadowEvaluateAccessResult = {
  entitlementDecision: EvaluateAccessDecision | null
  matched: boolean | null
  diff: Record<string, { legacy: unknown; entitlement: unknown }>
}

function normalizeAllowed(
  decision: LegacyAccessDecisionSnapshot
): boolean | null {
  if (typeof decision.allowed === "boolean") return decision.allowed
  if (typeof decision.canAccess === "boolean") return decision.canAccess
  if (typeof decision.canView === "boolean") return decision.canView
  return null
}

function compareDecisions(input: {
  legacyDecision?: LegacyAccessDecisionSnapshot
  entitlementDecision: EvaluateAccessDecision
}): Pick<ShadowEvaluateAccessResult, "matched" | "diff"> {
  if (!input.legacyDecision) {
    return {
      matched: null,
      diff: {},
    }
  }

  const diff: ShadowEvaluateAccessResult["diff"] = {}
  const legacyAllowed = normalizeAllowed(input.legacyDecision)

  if (
    legacyAllowed !== null &&
    legacyAllowed !== input.entitlementDecision.allowed
  ) {
    diff.allowed = {
      legacy: legacyAllowed,
      entitlement: input.entitlementDecision.allowed,
    }
  }

  if (
    typeof input.legacyDecision.canView === "boolean" &&
    input.legacyDecision.canView !== input.entitlementDecision.canView
  ) {
    diff.canView = {
      legacy: input.legacyDecision.canView,
      entitlement: input.entitlementDecision.canView,
    }
  }

  if (
    typeof input.legacyDecision.isLocked === "boolean" &&
    input.legacyDecision.isLocked !== input.entitlementDecision.isLocked
  ) {
    diff.isLocked = {
      legacy: input.legacyDecision.isLocked,
      entitlement: input.entitlementDecision.isLocked,
    }
  }

  if (
    typeof input.legacyDecision.lockReason === "string" &&
    input.legacyDecision.lockReason !== input.entitlementDecision.lockReason
  ) {
    diff.lockReason = {
      legacy: input.legacyDecision.lockReason,
      entitlement: input.entitlementDecision.lockReason,
    }
  }

  return {
    matched: Object.keys(diff).length === 0,
    diff,
  }
}

export async function shadowEvaluateAccess(
  input: ShadowEvaluateAccessInput
): Promise<ShadowEvaluateAccessResult> {
  if (input.enabled === false) {
    return {
      entitlementDecision: null,
      matched: null,
      diff: {},
    }
  }

  try {
    const { decision } = await evaluateAccess(input)
    const comparison = compareDecisions({
      legacyDecision: input.legacyDecision,
      entitlementDecision: decision,
    })

    const shadowResult: ShadowEvaluateAccessResult = {
      entitlementDecision: decision,
      ...comparison,
    }

    await recordAccessDecisionAudit({
      accessInput: input,
      legacyDecision: input.legacyDecision,
      entitlementDecision: decision,
      shadowResult,
      mode: "shadow",
    })

    if (comparison.matched === false) {
      logger.warn({
        event: "entitlement.shadow_access_mismatch",
        context: {
          surface: input.surface,
          subject: input.subject,
          diff: comparison.diff,
        },
      })
    }

    return shadowResult
  } catch (error) {
    throw new InfrastructureError("SHADOW_ACCESS_EVALUATION_FAILED", {
      cause: error,
      metadata: {
        surface: input.surface,
        subject: input.subject,
      },
    })
  }
}

/**
 * @deprecated Use shadowEvaluateAccess in critical paths.
 */
export async function shadowEvaluateAccessNoThrow(
  input: ShadowEvaluateAccessInput
): Promise<ShadowEvaluateAccessResult> {
  return shadowEvaluateAccess(input)
}
