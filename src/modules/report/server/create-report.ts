export type ReportTargetType = "post" | "profile" | "message"

export type CreateReportInput = {
  reporterUserId: string
  targetType: ReportTargetType
  targetId: string
  reason: string
}

export type CreatedReport = {
  id: string
  reporterUserId: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  createdAt: string
}

export async function createReport(
  input: CreateReportInput
): Promise<CreatedReport> {
  const reporterUserId = input.reporterUserId.trim()
  const targetId = input.targetId.trim()
  const reason = input.reason.trim()

  if (!reporterUserId) {
    throw new Error("Reporter user id is required")
  }

  if (!targetId) {
    throw new Error("Target id is required")
  }

  if (!reason) {
    throw new Error("Reason is required")
  }

  return {
    id: crypto.randomUUID(),
    reporterUserId,
    targetType: input.targetType,
    targetId,
    reason,
    createdAt: new Date().toISOString(),
  }
}