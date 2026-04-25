import type { ReportStatus, ReportTargetType } from "@/modules/report/types"

export type AdminReportDetail = {
  id: string
  targetType: ReportTargetType
  reason: string
  status: ReportStatus
  createdAt: string
  reporter: {
    username: string
    displayName: string
    email: string
  } | null
}

export async function getReportById(
  reportId: string
): Promise<AdminReportDetail | null> {
  // TODO: replace with real database query

  if (!reportId) {
    return null
  }

  return {
    id: reportId,
    targetType: "post",
    reason: "Reported for possible harassment and policy-violating language.",
    status: "pending",
    createdAt: new Date().toISOString(),
    reporter: {
      username: "alex",
      displayName: "Alex Kim",
      email: "alex@example.com",
    },
  }
}
