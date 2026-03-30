import { createReport } from "./create-report"

type ReportPostParams = {
  postId: string
  reason: string
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