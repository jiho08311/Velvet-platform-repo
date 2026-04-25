import {
  isReportReason,
  isReportTargetType,
  type ReportCreationPayload,
  type ReportTriggerPayload,
} from "@/modules/report/types"

export const reportFormFieldNames = {
  targetType: "targetType",
  targetId: "targetId",
  reason: "reason",
  description: "description",
  pathname: "pathname",
} as const

export type ParsedReportForm = {
  payload: ReportCreationPayload
  pathname: string
}

export function parseReportFormData(formData: FormData): ParsedReportForm {
  const targetType = String(formData.get(reportFormFieldNames.targetType))
  const targetId = String(formData.get(reportFormFieldNames.targetId))
  const reason = String(formData.get(reportFormFieldNames.reason))
  const description = String(formData.get(reportFormFieldNames.description) ?? "")
  const pathname = String(formData.get(reportFormFieldNames.pathname) ?? "/")

  if (!isReportTargetType(targetType)) {
    throw new Error("Invalid target type")
  }

  if (!targetId) {
    throw new Error("Target id is required")
  }

  if (!isReportReason(reason)) {
    throw new Error("Invalid reason")
  }

  return {
    payload: {
      targetType,
      targetId,
      reason,
      description,
    },
    pathname,
  }
}

export function toReportFormHiddenFields(payload: ReportTriggerPayload) {
  return [
    {
      name: reportFormFieldNames.targetType,
      value: payload.targetType,
    },
    {
      name: reportFormFieldNames.targetId,
      value: payload.targetId,
    },
    {
      name: reportFormFieldNames.pathname,
      value: payload.pathname,
    },
  ]
}
