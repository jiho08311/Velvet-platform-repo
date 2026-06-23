import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { upsertTrustSafetyMetricRollup } from "@/modules/analytics/repositories/trust-safety-metric-rollup-repository"

type TrustSafetyActionRow = {
  action_id: string
  action_type: string | null
  created_at: string
}

function dayStart(value: string): string {
  const date = new Date(value)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function dayEnd(value: string): string {
  const date = new Date(value)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

function isContentRemovalAction(actionType: string | null): boolean {
  return actionType === "remove_content" || actionType === "content_removed"
}

function isUserSuspensionAction(actionType: string | null): boolean {
  return actionType === "suspend_user" || actionType === "ban_user"
}

export async function rebuildModerationRollups(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const { data, error } = await supabaseAdmin
    .from("trust_safety_actions")
    .select("action_id, action_type, created_at")
    .limit(limit)
    .returns<TrustSafetyActionRow[]>()

  if (error) {
    throw error
  }

  const actions = data ?? []

  let upsertedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const action of actions) {
    if (!action.action_id) {
      skippedCount += 1
      continue
    }

    const occurredAt = action.created_at ?? new Date().toISOString()

    try {
      if (!input?.dryRun) {
        const { error: upsertError } = await upsertTrustSafetyMetricRollup({
          period_start: dayStart(occurredAt),
          period_end: dayEnd(occurredAt),
          reports_received: 0,
          cases_reviewed: 0,
          actions_issued: 1,
          content_removed: isContentRemovalAction(action.action_type) ? 1 : 0,
          users_suspended: isUserSuspensionAction(action.action_type) ? 1 : 0,
          source_event_id: null,
          idempotency_key: `moderation:rebuild:trust_safety_action:${action.action_id}`,
        })

        if (upsertError) throw upsertError
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    scannedTrustSafetyActionCount: actions.length,
    upsertedCount,
    skippedCount,
    failedCount,
  }
}