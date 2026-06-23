import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  CanonicalReportCaseRow,
  CreateReportCaseInput,
  UpdateReportCaseStatusInput,
} from "@/modules/governance/model/report-case"

const REPORT_POLICY_VERSION = "platform_governance.report.v1"

function createReportCaseKey(input: {
  reporterProfileId: string
  targetType: string
  targetId: string
}) {
  return [
    "report",
    input.reporterProfileId,
    input.targetType,
    input.targetId,
    Date.now().toString(),
  ].join(":")
}

export async function insertCanonicalReportCase(
  input: CreateReportCaseInput
): Promise<CanonicalReportCaseRow> {
  const reportCaseKey = createReportCaseKey({
    reporterProfileId: input.reporterProfileId,
    targetType: input.targetType,
    targetId: input.targetId,
  })

  const { data, error } = await supabaseAdmin
    .from("canonical_report_cases")
    .insert({
      report_case_key: reportCaseKey,
      reporter_profile_id: input.reporterProfileId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      description: input.description?.trim() || null,
      case_status: "pending",
      policy_version: REPORT_POLICY_VERSION,
      migration_source: "runtime",
      source_metadata: {
        sourceSurface: "governance.report_case.runtime",
      },
    })
    .select("*")
    .single<CanonicalReportCaseRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to create canonical report case")
  }

  return data
}

export async function listCanonicalReportCases(input: {
  limit: number
  cursor?: string
}): Promise<CanonicalReportCaseRow[]> {
  let query = supabaseAdmin
    .from("canonical_report_cases")
    .select("*")
    .eq("serving_authoritative", true)
    .eq("authority_mode", "canonical_authoritative")
    .eq("enforcement_mode", "enforced")
    .order("created_at", { ascending: false })
    .limit(input.limit)

  if (input.cursor) {
    query = query.lt("created_at", input.cursor)
  }

  const { data, error } = await query.returns<CanonicalReportCaseRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findCanonicalReportCaseByKey(
  reportCaseKey: string
): Promise<CanonicalReportCaseRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_report_cases")
    .select("*")
    .eq("report_case_key", reportCaseKey)
    .eq("serving_authoritative", true)
    .eq("authority_mode", "canonical_authoritative")
    .eq("enforcement_mode", "enforced")
    .maybeSingle<CanonicalReportCaseRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function findCanonicalReportCaseBySourceReportId(
  sourceReportId: string
): Promise<CanonicalReportCaseRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_report_cases")
    .select("*")
    .eq("source_report_id", sourceReportId)
    .eq("serving_authoritative", true)
    .eq("authority_mode", "canonical_authoritative")
    .eq("enforcement_mode", "enforced")
    .maybeSingle<CanonicalReportCaseRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function updateCanonicalReportCaseStatus({
  reportCaseKey,
  status,
  reviewedByProfileId,
}: UpdateReportCaseStatusInput): Promise<CanonicalReportCaseRow> {
  const reviewedAt =
    status === "resolved" || status === "rejected"
      ? new Date().toISOString()
      : null

  const { data, error } = await supabaseAdmin
    .from("canonical_report_cases")
    .update({
      case_status: status,
      reviewed_by_profile_id: reviewedByProfileId,
      reviewed_at: reviewedAt,
      updated_at: new Date().toISOString(),
      decision_metadata: {
        sourceSurface: "governance.report_case.status_transition",
        status,
      },
    })
    .eq("report_case_key", reportCaseKey)
    .select("*")
    .single<CanonicalReportCaseRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to update canonical report case")
  }

  return data
}
