import { createReport } from "./create-report"
import type { ReportReason } from "@/modules/report/types"

type ReportPostParams = {
  postId: string
  reason: ReportReason
  description?: string
}

export async function reportPost({
  postId,
  reason,
  description,
}: ReportPostParams) {
  return createReport({
    targetType: "post",
    targetId: postId,
    reason,
    description,
  })
}
