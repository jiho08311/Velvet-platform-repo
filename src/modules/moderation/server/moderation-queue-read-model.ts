import {
  getModerationQueueStatusBadge,
  type ModerationQueueStatus,
  type ModerationQueueStatusBadge,
} from "@/modules/moderation/lib/moderation-queue-status-policy"

export type ModerationQueueTargetType = "post" | "message" | "profile"

export type ModerationQueueRow = {
  id: string
  target_type: ModerationQueueTargetType
  target_id: string
  reason: string
  status: ModerationQueueStatus
  created_at: string
}

export type ModerationQueueTargetReference = {
  type: ModerationQueueTargetType
  id: string
}

export type ModerationQueueItem = {
  id: string
  targetType: ModerationQueueTargetType
  targetId: string
  targetReference: ModerationQueueTargetReference
  reason: string
  status: ModerationQueueStatus
  statusBadge: ModerationQueueStatusBadge
  createdAt: string
}

export function buildModerationQueueItem(
  row: ModerationQueueRow
): ModerationQueueItem {
  const targetReference = {
    type: row.target_type,
    id: row.target_id,
  }

  return {
    id: row.id,
    targetType: targetReference.type,
    targetId: targetReference.id,
    targetReference,
    reason: row.reason,
    status: row.status,
    statusBadge: getModerationQueueStatusBadge(row.status),
    createdAt: row.created_at,
  }
}
