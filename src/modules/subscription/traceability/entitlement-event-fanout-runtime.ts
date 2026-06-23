import { synchronizeEntitlementDriftArbitrationNoThrow } from "./entitlement-drift-arbitration-runtime"
import { synchronizeEntitlementReplayPreservationNoThrow } from "./entitlement-replay-preservation-runtime"
import { synchronizeEntitlementSovereigntyMapNoThrow } from "./entitlement-sovereignty-map-runtime"
import { synchronizeEntitlementSovereigntyPreservationNoThrow } from "./entitlement-sovereignty-preservation-runtime"
import type { CanonicalEntitlementEventInput } from "./entitlement-event-runtime"

export async function synchronizeCanonicalEntitlementEventFanoutNoThrow({
  confidence,
  entitlementEventKey,
  entitlementKind,
  entitlementSurface,
  eventObserved,
  input,
  orderingTimestamp,
}: {
  confidence: string
  entitlementEventKey: string
  entitlementKind: string
  entitlementSurface: string
  eventObserved: boolean
  input: CanonicalEntitlementEventInput
  orderingTimestamp: string
}): Promise<void> {
  await synchronizeEntitlementSovereigntyMapNoThrow({
    subjectUserId: input.subjectUserId,
    issuerCreatorId: input.issuerCreatorId,
    entitlementSurface,
    entitlementKind,
    subscriptionId: input.subscriptionId ?? null,
    paymentId: input.paymentId ?? null,
    sourceTable: input.sourceTable ?? null,
    sourceRowId: input.sourceRowId ?? null,
    orderingTimestamp,
    metadata: {
      ...(input.provenanceMetadata ?? {}),
      entitlementEventKey,
      entitlementRuntimeAuthorityPreserved: true,
    },
  })
  await synchronizeEntitlementReplayPreservationNoThrow({
    entitlementBoundaryKey: "financial.entitlement.runtime_authority",
    replayBoundaryKey: "financial.entitlement.replay_preservation",
    governanceBoundaryKey: "financial.entitlement.governance_advisory",
    subjectUserId: input.subjectUserId,
    issuerCreatorId: input.issuerCreatorId,
    subscriptionId: input.subscriptionId ?? null,
    paymentId: input.paymentId ?? null,
    sourceTable: input.sourceTable ?? null,
    sourceRowId: input.sourceRowId ?? null,
    orderingTimestamp,
    observedEntitlementSignalCount: eventObserved ? 1 : 0,
    expectedEntitlementSignalCount: 1,
    entitlementGapClass: eventObserved ? "none" : "entitlement_replay_gap",
    entitlementGapSeverity: eventObserved ? "none" : "advisory",
    entitlementMetadata: {
      ...(input.provenanceMetadata ?? {}),
      entitlementEventKey,
      entitlementRuntimeAuthorityPreserved: true,
      entitlementReplayAdvisoryOnly: true,
      replayEntitlementMutationAllowed: false,
      governanceEntitlementAuthorityAllowed: false,
      projectionEntitlementExecutionAllowed: false,
    },
    reconstructionMetadata: {
      entitlementReconstructionConfidence: confidence,
      entitlementContinuityValidationObservable: true,
    },
    provenanceMetadata: {
      sourceBrief: "Wave-010-FEL-BR-064",
      advisoryOnly: true,
      replayReadOnly: true,
    },
  })
  await synchronizeEntitlementSovereigntyPreservationNoThrow({
    entitlementBoundaryKey: "financial.entitlement.runtime_authority",
    sovereigntyBoundaryKey: "financial.entitlement.sovereignty_preservation",
    governanceBoundaryKey: "financial.entitlement.governance_advisory",
    rollbackBoundaryKey: "financial.entitlement.rollback_runtime",
    subjectUserId: input.subjectUserId,
    issuerCreatorId: input.issuerCreatorId,
    subscriptionId: input.subscriptionId ?? null,
    paymentId: input.paymentId ?? null,
    sourceTable: input.sourceTable ?? null,
    sourceRowId: input.sourceRowId ?? null,
    orderingTimestamp,
    observedEntitlementSignalCount: eventObserved ? 1 : 0,
    expectedEntitlementSignalCount: 1,
    sovereigntyGapClass: eventObserved
      ? "none"
      : "entitlement_sovereignty_gap",
    sovereigntyGapSeverity: eventObserved ? "none" : "advisory",
    preservationMetadata: {
      ...(input.provenanceMetadata ?? {}),
      entitlementEventKey,
      entitlementRuntimeAuthorityPreserved: true,
      entitlementSovereigntyPreservationAdvisoryOnly: true,
      governanceEntitlementExecutionAllowed: false,
      replayEntitlementMutationAllowed: false,
      projectionEntitlementExecutionAllowed: false,
    },
    reconstructionMetadata: {
      entitlementReconstructionConfidence: confidence,
      entitlementSovereigntyPreservationObservable: true,
    },
    provenanceMetadata: {
      sourceBrief: "Wave-010-FEL-BR-076",
      advisoryOnly: true,
      replayReadOnly: true,
    },
  })
  await synchronizeEntitlementDriftArbitrationNoThrow({
    entitlementBoundaryKey: "financial.entitlement.runtime_authority",
    driftBoundaryKey: "financial.entitlement.drift_arbitration",
    reconciliationBoundaryKey: "financial.entitlement.reconciliation_advisory",
    governanceBoundaryKey: "financial.entitlement.governance_advisory",
    subjectUserId: input.subjectUserId,
    issuerCreatorId: input.issuerCreatorId,
    subscriptionId: input.subscriptionId ?? null,
    paymentId: input.paymentId ?? null,
    sourceTable: input.sourceTable ?? null,
    sourceRowId: input.sourceRowId ?? null,
    orderingTimestamp,
    observedEntitlementSignalCount: eventObserved ? 1 : 0,
    expectedEntitlementSignalCount: 1,
    entitlementDriftClass: eventObserved ? "none" : "entitlement_drift_gap",
    entitlementDriftSeverity: eventObserved ? "none" : "advisory",
    driftMetadata: {
      ...(input.provenanceMetadata ?? {}),
      entitlementEventKey,
      entitlementRuntimeAuthorityPreserved: true,
      entitlementDriftArbitrationAdvisoryOnly: true,
      governanceEntitlementMutationAllowed: false,
      replayEntitlementExecutionAllowed: false,
      projectionEntitlementExecutionAllowed: false,
      reconciliationRepairAllowed: false,
    },
    reconstructionMetadata: {
      entitlementReconstructionConfidence: confidence,
      entitlementDriftArbitrationObservable: true,
    },
    provenanceMetadata: {
      sourceBrief: "Wave-010-FEL-BR-079",
      advisoryOnly: true,
      replayReadOnly: true,
    },
  })
}
