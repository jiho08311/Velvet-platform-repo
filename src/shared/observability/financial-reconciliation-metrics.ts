import type {
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"
import type {
  RuntimeProvenanceContext,
} from "@/shared/observability/runtime-provenance"
import { logger } from "@/shared/observability/structured-logger"

export type FinancialReconciliationMetricType =
  | "settlement_drift"
  | "refund_drift"
  | "earning_release_drift"
  | "payout_drift"
  | "payout_postcondition_drift"

export type FinancialReconciliationMismatchType =
  | "settlement_earning_creation_mismatch"
  | "refund_earning_reversal_mismatch"
  | "earning_release_count_mismatch"
  | "payout_paid_earning_count_mismatch"
  | "payout_failed_earning_release_mismatch"
  | "payout_postcondition_mismatch"

export type FinancialReconciliationSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical"

export type FinancialReconciliationTargetType =
  | "payment"
  | "earning"
  | "payout"
  | "payout_request"
  | "financial_runtime"

export type FinancialReconciliationTarget = Readonly<{
  type: FinancialReconciliationTargetType
  id?: string | null
}>

export type FinancialReconciliationStateValue =
  | string
  | number
  | boolean
  | null
  | FinancialReconciliationStateValue[]
  | { readonly [key: string]: FinancialReconciliationStateValue }

export type FinancialReconciliationState = Readonly<
  Record<string, FinancialReconciliationStateValue>
>

export type FinancialReconciliationMetric = Readonly<{
  metricId: string
  metricType: FinancialReconciliationMetricType
  mismatchType: FinancialReconciliationMismatchType
  severity: FinancialReconciliationSeverity
  target: FinancialReconciliationTarget
  expectedState: FinancialReconciliationState
  observedState: FinancialReconciliationState
  correlation: AuditCorrelationContext
  provenance?: RuntimeProvenanceContext | null
  observedAt: string
  metadata: AuditMetadata
}>

export type CreateFinancialReconciliationMetricInput = Readonly<{
  metricType: FinancialReconciliationMetricType
  mismatchType: FinancialReconciliationMismatchType
  severity?: FinancialReconciliationSeverity
  target: FinancialReconciliationTarget
  expectedState?: FinancialReconciliationState
  observedState?: FinancialReconciliationState
  correlation?: AuditCorrelationContext | null
  provenance?: RuntimeProvenanceContext | null
  observedAt?: string
  metadata?: AuditMetadata
}>

function createMetricId(): string {
  return crypto.randomUUID()
}

function normalizeTarget(
  target: FinancialReconciliationTarget
): FinancialReconciliationTarget {
  return Object.freeze({
    type: target.type,
    id: target.id ?? null,
  })
}

export function createFinancialReconciliationMetric(
  input: CreateFinancialReconciliationMetricInput
): FinancialReconciliationMetric {
  return Object.freeze({
    metricId: createMetricId(),
    metricType: input.metricType,
    mismatchType: input.mismatchType,
    severity: input.severity ?? "warning",
    target: normalizeTarget(input.target),
    expectedState: Object.freeze(input.expectedState ?? {}),
    observedState: Object.freeze(input.observedState ?? {}),
    correlation: Object.freeze({
      correlationId:
        input.correlation?.correlationId ??
        input.provenance?.correlation.correlationId ??
        crypto.randomUUID(),
      requestId:
        input.correlation?.requestId ??
        input.provenance?.correlation.requestId ??
        null,
      workflowId:
        input.correlation?.workflowId ??
        input.provenance?.correlation.workflowId ??
        input.provenance?.workflow.workflowId ??
        null,
      jobId:
        input.correlation?.jobId ??
        input.provenance?.correlation.jobId ??
        null,
      causationId:
        input.correlation?.causationId ??
        input.provenance?.correlation.causationId ??
        null,
    }),
    provenance: input.provenance ?? null,
    observedAt: input.observedAt ?? new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}

export function createSettlementDriftMetric(input: {
  paymentId: string
  expectedEarningCreated: boolean
  observedEarningId?: string | null
  correlation?: AuditCorrelationContext | null
  provenance?: RuntimeProvenanceContext | null
  metadata?: AuditMetadata
}): FinancialReconciliationMetric {
  return createFinancialReconciliationMetric({
    metricType: "settlement_drift",
    mismatchType: "settlement_earning_creation_mismatch",
    target: {
      type: "payment",
      id: input.paymentId,
    },
    expectedState: {
      earningCreated: input.expectedEarningCreated,
    },
    observedState: {
      earningId: input.observedEarningId ?? null,
    },
    correlation: input.correlation,
    provenance: input.provenance,
    metadata: input.metadata,
  })
}

export function createRefundDriftMetric(input: {
  paymentId: string
  earningId?: string | null
  expectedReversalStatus: string
  observedReversalStatus?: string | null
  correlation?: AuditCorrelationContext | null
  provenance?: RuntimeProvenanceContext | null
  metadata?: AuditMetadata
}): FinancialReconciliationMetric {
  return createFinancialReconciliationMetric({
    metricType: "refund_drift",
    mismatchType: "refund_earning_reversal_mismatch",
    target: {
      type: "payment",
      id: input.paymentId,
    },
    expectedState: {
      earningStatus: input.expectedReversalStatus,
    },
    observedState: {
      earningId: input.earningId ?? null,
      earningStatus: input.observedReversalStatus ?? null,
    },
    correlation: input.correlation,
    provenance: input.provenance,
    metadata: input.metadata,
  })
}

export function createEarningReleaseDriftMetric(input: {
  expectedEarningIds: string[]
  releasedEarningIds: string[]
  correlation?: AuditCorrelationContext | null
  provenance?: RuntimeProvenanceContext | null
  metadata?: AuditMetadata
}): FinancialReconciliationMetric {
  return createFinancialReconciliationMetric({
    metricType: "earning_release_drift",
    mismatchType: "earning_release_count_mismatch",
    target: {
      type: "earning",
      id: null,
    },
    expectedState: {
      earningIds: input.expectedEarningIds,
      count: input.expectedEarningIds.length,
    },
    observedState: {
      earningIds: input.releasedEarningIds,
      count: input.releasedEarningIds.length,
    },
    correlation: input.correlation,
    provenance: input.provenance,
    metadata: input.metadata,
  })
}

export function createPayoutDriftMetric(input: {
  payoutId: string
  targetState: "paid" | "failed"
  mismatchType:
    | "payout_paid_earning_count_mismatch"
    | "payout_failed_earning_release_mismatch"
  linkedEarningIds: string[]
  observedEarningIds: string[]
  correlation?: AuditCorrelationContext | null
  provenance?: RuntimeProvenanceContext | null
  metadata?: AuditMetadata
}): FinancialReconciliationMetric {
  return createFinancialReconciliationMetric({
    metricType: "payout_drift",
    mismatchType: input.mismatchType,
    target: {
      type: "payout",
      id: input.payoutId,
    },
    expectedState: {
      targetState: input.targetState,
      earningIds: input.linkedEarningIds,
      count: input.linkedEarningIds.length,
    },
    observedState: {
      earningIds: input.observedEarningIds,
      count: input.observedEarningIds.length,
    },
    correlation: input.correlation,
    provenance: input.provenance,
    metadata: input.metadata,
  })
}

export function createPayoutPostconditionDriftMetric(input: {
  payoutId: string
  postconditionName: string
  expectedState?: FinancialReconciliationState
  observedState?: FinancialReconciliationState
  correlation?: AuditCorrelationContext | null
  provenance?: RuntimeProvenanceContext | null
  metadata?: AuditMetadata
}): FinancialReconciliationMetric {
  return createFinancialReconciliationMetric({
    metricType: "payout_postcondition_drift",
    mismatchType: "payout_postcondition_mismatch",
    severity: "error",
    target: {
      type: "payout",
      id: input.payoutId,
    },
    expectedState: {
      postconditionName: input.postconditionName,
      ...(input.expectedState ?? {}),
    },
    observedState: input.observedState,
    correlation: input.correlation,
    provenance: input.provenance,
    metadata: input.metadata,
  })
}

function isFinancialReconciliationMetricEnabled(): boolean {
  return process.env.FINANCIAL_RECONCILIATION_METRICS === "1"
}

export function traceFinancialReconciliationMetric(
  metric: FinancialReconciliationMetric
): void {
  if (!isFinancialReconciliationMetricEnabled()) {
    return
  }

  try {
    logger.info({
      event: "observability.financial_reconciliation_metric",
      context: { metric },
    })
  } catch {
    // Reconciliation metrics must never affect financial runtime execution.
  }
}

export function createAndTraceFinancialReconciliationMetric(
  input: CreateFinancialReconciliationMetricInput
): FinancialReconciliationMetric {
  const metric = createFinancialReconciliationMetric(input)
  traceFinancialReconciliationMetric(metric)
  return metric
}
