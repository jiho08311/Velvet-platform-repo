// src/shared/observability/failure-severity.ts

export type FailureSeverity = "critical" | "high" | "medium" | "low"

export type CriticalFailureDomain =
  | "financial"
  | "payout"
  | "refund"
  | "settlement"
  | "service_role"
  | "async_job"
  | "media_processing"
  | "moderation"
  | "audit"
  | "notification"
  | "workflow"
  | "system"

export type FailureSeverityClassification = Readonly<{
  severity: FailureSeverity
  domain: CriticalFailureDomain
  reason: string
}>

export const FAILURE_SEVERITY = Object.freeze({
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
} satisfies Record<FailureSeverity, FailureSeverity>)

export function isCriticalFailureSeverity(
  severity: FailureSeverity
): boolean {
  return severity === "critical"
}