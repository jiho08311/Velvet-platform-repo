"use server"

import { revalidatePath } from "next/cache"
import { updateReportStatus } from "@/modules/report/server/update-report-status"
import { isReportStatus } from "@/modules/report/types"

export async function updateReportStatusAction(formData: FormData) {
  const reportId = String(formData.get("reportId"))
  const status = String(formData.get("status"))

  if (!reportId) {
    throw new Error("Report id is required")
  }

  if (!isReportStatus(status)) {
    throw new Error("Invalid status")
  }

  await updateReportStatus({
    reportId,
    status,
  })

  revalidatePath("/admin/reports")
}
