import { createReport } from "./create-report"

type ReportUserParams = {
  targetUserId: string
  reason: string
  description?: string
}

export async function reportUser({
  targetUserId,
  reason,
  description,
}: ReportUserParams) {
  return createReport({
    targetType: "user",
    targetId: targetUserId,
    reason,
    description,
  })
}