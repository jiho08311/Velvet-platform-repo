import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  CanonicalModerationCaseRow,
  RecordModerationDecisionInput,
  RequestModerationCaseInput,
} from "@/modules/governance/model/moderation-case"

const MODERATION_POLICY_VERSION = "platform_governance.moderation.v1"

function createModerationCaseKey(input: {
  targetType: string
  targetId: string
}) {
  return [
    "moderation",
    input.targetType,
    input.targetId,
    Date.now().toString(),
  ].join(":")
}

export async function insertCanonicalModerationCase(
  input: RequestModerationCaseInput
): Promise<CanonicalModerationCaseRow> {
  const moderationCaseKey = createModerationCaseKey({
    targetType: input.targetType,
    targetId: input.targetId,
  })

  const { data, error } = await supabaseAdmin
    .from("canonical_moderation_cases")
    .insert({
      moderation_case_key: moderationCaseKey,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason ?? null,
      case_status: "pending",
      policy_version: MODERATION_POLICY_VERSION,
      migration_source: "runtime",
      source_metadata: {
        ...(input.sourceMetadata ?? {}),
        sourceSurface: "governance.moderation_case.runtime",
      },
    })
    .select("*")
    .single<CanonicalModerationCaseRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to create canonical moderation case")
  }

  return data
}

export async function listCanonicalModerationCases(): Promise<
  CanonicalModerationCaseRow[]
> {
  const { data, error } = await supabaseAdmin
    .from("canonical_moderation_cases")
    .select("*")
    .eq("serving_authoritative", true)
    .eq("authority_mode", "canonical_authoritative")
    .eq("enforcement_mode", "enforced")
    .order("created_at", { ascending: false })
    .returns<CanonicalModerationCaseRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findLatestCanonicalModerationCaseByTarget(input: {
  targetType: string
  targetId: string
}): Promise<CanonicalModerationCaseRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_moderation_cases")
    .select("*")
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("serving_authoritative", true)
    .eq("authority_mode", "canonical_authoritative")
    .eq("enforcement_mode", "enforced")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CanonicalModerationCaseRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function updateCanonicalModerationCaseDecision(
  input: RecordModerationDecisionInput
): Promise<CanonicalModerationCaseRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_moderation_cases")
    .update({
      case_status: input.decision,
      decision: input.decision,
      provider: input.provider,
      provider_model: input.providerModel,
      flagged: input.flagged,
      score_summary: input.scoreSummary ?? {},
      raw_result: input.rawResult ?? {},
      decision_metadata: {
        sourceSurface: "governance.moderation_case.decision",
        decision: input.decision,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("moderation_case_key", input.moderationCaseKey)
    .select("*")
    .single<CanonicalModerationCaseRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to update canonical moderation case")
  }

  return data
}
