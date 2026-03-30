"use server"

import { revalidatePath } from "next/cache"
import { createReport } from "@/modules/report/server/create-report"

type ReportTargetType = "post" | "message" | "user" | "creator"

export async function createReportAction(formData: FormData) {
  const targetType = String(formData.get("targetType")) as ReportTargetType
  const targetId = String(formData.get("targetId"))
  const reason = String(formData.get("reason"))
  const description = String(formData.get("description") ?? "")
  const pathname = String(formData.get("pathname") ?? "/")

  if (!targetType) {
    throw new Error("Target type is required")
  }

  if (!targetId) {
    throw new Error("Target id is required")
  }

  if (!reason.trim()) {
    throw new Error("Reason is required")
  }

  await createReport({
    targetType,
    targetId,
    reason,
    description,
  })

  revalidatePath(pathname)
}