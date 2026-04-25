"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createReport } from "@/modules/report/server/create-report"
import { parseReportFormData } from "@/modules/report/report-form"

export async function createReportAction(formData: FormData) {
  const { payload, pathname } = parseReportFormData(formData)

  await createReport(payload)

  revalidatePath(pathname)

  redirect(pathname)
}
