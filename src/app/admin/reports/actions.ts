"use server"

import { revalidatePath } from "next/cache"
import { updateReportStatus } from "@/modules/report/server/update-report-status"

type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected"

export async function updateReportStatusAction(formData: FormData) {
  const reportId = String(formData.get("reportId"))
  const status = String(formData.get("status")) as ReportStatus

  if (!reportId) {
    throw new Error("Report id is required")
  }

  if (!status) {
    throw new Error("Status is required")
  }

  await updateReportStatus({
    reportId,
    status,
  })

  revalidatePath("/admin/reports")
}