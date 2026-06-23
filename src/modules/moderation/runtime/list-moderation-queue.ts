import { requireAdmin } from "@/modules/admin/public/require-admin"
import { listModerationCases } from "@/modules/governance/public/moderation-governance-contract"
import {
  buildModerationQueueItem,
  type ModerationQueueItem,
  type ModerationQueueRow,
  type ModerationQueueTargetType,
} from "@/modules/moderation/read-models/moderation-queue-read-model"
import type { ModerationQueueStatus } from "@/modules/moderation/policies/moderation-queue-status-policy"

export async function listModerationQueue(): Promise<ModerationQueueItem[]> {
  await requireAdmin()

  const rows = await listModerationCases()

  return rows.map((row) =>
    buildModerationQueueItem({
      id: row.moderation_case_key,
      target_type: row.target_type as ModerationQueueTargetType,
      target_id: row.target_id,
      reason: row.reason ?? "moderation",
      status: row.case_status as ModerationQueueStatus,
      created_at: row.created_at,
    } satisfies ModerationQueueRow)
  )
}