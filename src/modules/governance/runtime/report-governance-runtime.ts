import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import { requireActiveSession } from "@/modules/auth/public/require-active-session"
import {
  isReportReason,
  isReportTargetType,
  type ReportCreationPayload,
} from "@/modules/report/types"
import {
  insertCanonicalReportCase,
} from "@/modules/governance/repositories/report-case-repository"
import { buildReportSubmittedEnvelope } from "./report-submitted-event"

export {
  executeGetReportCaseRuntime,
  executeListReportCasesForReviewRuntime,
  executeUpdateReportCaseStatusRuntime,
} from "./report-governance-review-runtime"


export async function executeCreateReportCaseRuntime(
  payload: ReportCreationPayload
) {
  const session = await requireActiveSession()

  if (!isReportTargetType(payload.targetType)) {
    throw new Error("Invalid target type")
  }

  if (!payload.targetId) {
    throw new Error("Target id is required")
  }

  if (!isReportReason(payload.reason)) {
    throw new Error("Invalid reason")
  }

  const reportCase = await insertCanonicalReportCase({
    reporterProfileId: session.userId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    description: payload.description,
  })

  await writeDomainEventWithOutbox(
    buildReportSubmittedEnvelope({
      reportCaseKey: reportCase.report_case_key,
      reporterId: session.userId,
      targetType: reportCase.target_type,
      targetId: reportCase.target_id,
      reasonCode: reportCase.reason,
      occurredAt: reportCase.created_at,
    })
  )

  return reportCase
}
