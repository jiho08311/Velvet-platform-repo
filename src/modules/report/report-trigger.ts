import type { ReportTargetType, ReportTriggerPayload } from "@/modules/report/types"

type BuildReportTriggerPayloadParams = {
  targetType: ReportTargetType
  targetId: string
  pathname: string
}

export function buildReportTriggerPayload({
  targetType,
  targetId,
  pathname,
}: BuildReportTriggerPayloadParams): ReportTriggerPayload {
  return {
    targetType,
    targetId,
    pathname,
  }
}
