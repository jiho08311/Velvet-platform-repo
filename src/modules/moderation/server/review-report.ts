import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ReviewReportStatus =
  | "pending"
  | "reviewed"
  | "dismissed"
  | "actioned"

export type ReviewReportInput = {
  reportId: string
  adminUserId: string
  status: ReviewReportStatus
  resolutionNote?: string
}

export type ReviewedReportResult = {
  reportId: string
  adminUserId: string
  status: ReviewReportStatus
  resolutionNote: string | null
  reviewedAt: string
}

type ReportRow = {
  id: string
  reviewed_by: string | null
  status: ReviewReportStatus
  resolution_note: string | null
  reviewed_at: string | null
}

export async function reviewReport(
  input: ReviewReportInput
): Promise<ReviewedReportResult | null> {
  const reportId = input.reportId.trim()
  const adminUserId = input.adminUserId.trim()
  const resolutionNote = input.resolutionNote?.trim() || null

  if (!reportId || !adminUserId) {
    return null
  }

  const { data, error } = await supabaseAdmin
    .from("reports")
    .update({
      status: input.status,
      reviewed_by: adminUserId,
      resolution_note: resolutionNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select("id, reviewed_by, status, resolution_note, reviewed_at")
    .maybeSingle<ReportRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    reportId: data.id,
    adminUserId: data.reviewed_by ?? adminUserId,
    status: data.status,
    resolutionNote: data.resolution_note,
    reviewedAt: data.reviewed_at ?? new Date().toISOString(),
  }
}