import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"
import { requestModerationCase } from "@/modules/governance/public/moderation-governance-contract"

type ReportSubmittedPayload = {
  eventId: string
  reportId: string
  reporterId: string
  targetType: "POST" | "STORY" | "MESSAGE" | "PROFILE" | "MEDIA"
  targetId: string
  reasonCode: string
  occurredAt: string
}

function normalizeTargetType(targetType: ReportSubmittedPayload["targetType"]) {
  return targetType.toLowerCase()
}

function readPayload(event: {
  payload: Record<string, unknown> | null
}): ReportSubmittedPayload | null {
  const payload = event.payload

  if (!payload) return null

  if (
    typeof payload.eventId !== "string" ||
    typeof payload.reportId !== "string" ||
    typeof payload.reporterId !== "string" ||
    typeof payload.targetType !== "string" ||
    typeof payload.targetId !== "string" ||
    typeof payload.reasonCode !== "string" ||
    typeof payload.occurredAt !== "string"
  ) {
    return null
  }

  return payload as ReportSubmittedPayload
}

export const reportSubmittedModerationCaseHandler: EventHandler = {
  handlerName: "report-submitted-moderation-case-handler",
  eventTypes: ["ReportSubmitted"],

  async handle(event): Promise<EventHandlerResult> {
    const payload = readPayload(event)

    if (!payload) {
      return {
        status: "skipped",
        reason: "INVALID_REPORT_SUBMITTED_PAYLOAD",
      }
    }

    await requestModerationCase({
      targetType: normalizeTargetType(payload.targetType),
      targetId: payload.targetId,
      reason: payload.reasonCode,
      sourceMetadata: {
        sourceEventId: payload.eventId,
        sourceReportId: payload.reportId,
        reporterId: payload.reporterId,
        occurredAt: payload.occurredAt,
      },
    })

    return {
      status: "completed",
      resultHash: payload.reportId,
    }
  },
}