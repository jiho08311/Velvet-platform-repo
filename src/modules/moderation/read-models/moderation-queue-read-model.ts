import {
  getModerationQueueStatusBadge,
  type ModerationQueueStatus,
  type ModerationQueueStatusBadge,
} from "@/modules/moderation/policies/moderation-queue-status-policy"

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

type ModerationQueueSourceItem = {
  id: string
  targetType: ModerationQueueTargetType
  targetId: string
  targetReference: ModerationQueueTargetReference
  reason: string
  status: ModerationQueueStatus
  createdAt: string
}

type ModerationQueueDisplayFields = {
  statusBadge: ModerationQueueStatusBadge
  createdDateTimeLabel: string
}

export type ModerationQueueItem =
  ModerationQueueSourceItem & ModerationQueueDisplayFields

function buildModerationQueueTargetReference(
  row: Pick<ModerationQueueRow, "target_type" | "target_id">
): ModerationQueueTargetReference {
  return {
    type: row.target_type,
    id: row.target_id,
  }
}

function formatCreatedDateTimeLabel(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function buildModerationQueueDisplayFields(
  item: ModerationQueueSourceItem
): ModerationQueueDisplayFields {
  return {
    statusBadge: getModerationQueueStatusBadge(item.status),
    createdDateTimeLabel: formatCreatedDateTimeLabel(item.createdAt),
  }
}

export function buildModerationQueueItem(
  row: ModerationQueueRow
): ModerationQueueItem {
  const targetReference = buildModerationQueueTargetReference(row)

  const item: ModerationQueueSourceItem = {
    id: row.id,
    targetType: targetReference.type,
    targetId: targetReference.id,
    targetReference,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  }

  return {
    ...item,
    ...buildModerationQueueDisplayFields(item),
  }
}
