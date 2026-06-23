import { createReport } from "./create-report"
import type { ReportReason } from "@/modules/report/types"

type ReportUserParams = {
  targetUserId: string
  reason: ReportReason
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
