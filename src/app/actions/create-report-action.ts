"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createReportCase } from "@/modules/governance/public/report-governance-contract"
import { parseReportFormData } from "@/modules/report/report-form"

export async function createReportAction(formData: FormData) {
  const { payload, pathname } = parseReportFormData(formData)

  await createReportCase(payload)

  revalidatePath(pathname)

  redirect(pathname)
}
