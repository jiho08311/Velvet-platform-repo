import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type {
  NotificationData,
  NotificationListRow,
  NotificationRow,
  NotificationType,
} from "../types"

export type NotificationReadStateRow = Pick<
  NotificationRow,
  "id" | "user_id" | "status" | "read_at"
>

export type NotificationBadgeRow = Pick<
  NotificationRow,
  "status" | "read_at"
>

type CanonicalNotificationItemRow = {
  notification_id: string
  user_id: string | null
  recipient_user_id: string | null
  notification_type: NotificationType | null
  title: string | null
  body: string | null
  payload: NotificationData | null
  created_at: string | null
}

type CanonicalNotificationReadStateRow = {
  notification_id: string
  recipient_user_id: string
  read_state: string | null
  read_at: string | null
}

type CanonicalNotificationVisibilityStateRow = {
  notification_id: string
  recipient_user_id: string
  visibility_state: string | null
  deleted_at: string | null
}

type CanonicalNotificationJoinedRow = CanonicalNotificationItemRow & {
  readState?: CanonicalNotificationReadStateRow | null
  visibilityState?: CanonicalNotificationVisibilityStateRow | null
}

function resolveRecipientUserId(row: CanonicalNotificationItemRow): string {
  return row.recipient_user_id ?? row.user_id ?? ""
}

function toNotificationRow(row: CanonicalNotificationJoinedRow): NotificationRow {
  const readState = row.readState
  const recipientUserId = resolveRecipientUserId(row)

  return {
    id: row.notification_id,
    user_id: recipientUserId,
    type: row.notification_type,
    status: readState?.read_state === "read" ? "read" : "unread",
    title: row.title ?? "",
    body: row.body ?? "",
    data: row.payload ?? {},
    created_at: row.created_at ?? new Date(0).toISOString(),
    read_at: readState?.read_at ?? null,
  } as NotificationRow
}

function toNotificationReadStateRow(
  row: CanonicalNotificationJoinedRow,
): NotificationReadStateRow {
  const readState = row.readState
  const recipientUserId = resolveRecipientUserId(row)

  return {
    id: row.notification_id,
    user_id: recipientUserId,
    status: readState?.read_state === "read" ? "read" : "unread",
    read_at: readState?.read_at ?? null,
  } as NotificationReadStateRow
}

async function listReadStatesByNotificationIds(input: {
  notificationIds: string[]
  ownerIds: string[]
}): Promise<Map<string, CanonicalNotificationReadStateRow>> {
  if (input.notificationIds.length === 0 || input.ownerIds.length === 0) {
    return new Map()
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_notification_read_states")
    .select("notification_id, recipient_user_id, read_state, read_at")
    .in("notification_id", input.notificationIds)
    .in("recipient_user_id", input.ownerIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data ?? []) as CanonicalNotificationReadStateRow[]).map((row) => [
      row.notification_id,
      row,
    ]),
  )
}

async function listVisibilityStatesByNotificationIds(input: {
  notificationIds: string[]
  ownerIds: string[]
}): Promise<Map<string, CanonicalNotificationVisibilityStateRow>> {
  if (input.notificationIds.length === 0 || input.ownerIds.length === 0) {
    return new Map()
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_notification_visibility_states")
    .select("notification_id, recipient_user_id, visibility_state, deleted_at")
    .in("notification_id", input.notificationIds)
    .in("recipient_user_id", input.ownerIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data ?? []) as CanonicalNotificationVisibilityStateRow[]).map((row) => [
      row.notification_id,
      row,
    ]),
  )
}

function isVisible(row: CanonicalNotificationJoinedRow): boolean {
  const visibilityState = row.visibilityState

  if (!visibilityState) {
    return true
  }

  if (visibilityState.deleted_at) {
    return false
  }

  return visibilityState.visibility_state !== "deleted"
}

async function attachStateRows(input: {
  items: CanonicalNotificationItemRow[]
  ownerIds: string[]
}): Promise<CanonicalNotificationJoinedRow[]> {
  const notificationIds = input.items.map((row) => row.notification_id)

  const [readStatesById, visibilityStatesById] = await Promise.all([
    listReadStatesByNotificationIds({
      notificationIds,
      ownerIds: input.ownerIds,
    }),
    listVisibilityStatesByNotificationIds({
      notificationIds,
      ownerIds: input.ownerIds,
    }),
  ])

  return input.items.map((row) => ({
    ...row,
    readState: readStatesById.get(row.notification_id) ?? null,
    visibilityState: visibilityStatesById.get(row.notification_id) ?? null,
  }))
}

export async function findNotificationByIdForOwners(input: {
  notificationId: string
  ownerIds: string[]
}): Promise<NotificationRow | null> {
  if (input.ownerIds.length === 0) {
    return null
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_notification_items")
    .select(
      "notification_id, user_id, recipient_user_id, notification_type, title, body, payload, created_at",
    )
    .eq("notification_id", input.notificationId)
    .in("recipient_user_id", input.ownerIds)
    .maybeSingle<CanonicalNotificationItemRow>()

  if (error || !data) {
    return null
  }

  const [joined] = await attachStateRows({
    items: [data],
    ownerIds: input.ownerIds,
  })

  if (!joined || !isVisible(joined)) {
    return null
  }

  return toNotificationRow(joined)
}

export async function listNotificationRowsForOwners(input: {
  ownerIds: string[]
}): Promise<NotificationRow[]> {
  if (input.ownerIds.length === 0) {
    return []
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_notification_items")
    .select(
      "notification_id, user_id, recipient_user_id, notification_type, title, body, payload, created_at",
    )
    .in("recipient_user_id", input.ownerIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  const joinedRows = await attachStateRows({
    items: (data ?? []) as CanonicalNotificationItemRow[],
    ownerIds: input.ownerIds,
  })

  return joinedRows.filter(isVisible).map(toNotificationRow)
}

export async function listNotificationListRowsForOwners(input: {
  ownerIds: string[]
}): Promise<NotificationListRow[]> {
  const rows = await listNotificationRowsForOwners(input)
  return rows as NotificationListRow[]
}

export async function listNotificationBadgeRowsForOwners(input: {
  ownerIds: string[]
}): Promise<NotificationBadgeRow[]> {
  const rows = await listNotificationRowsForOwners(input)
  return rows.map((row) => ({
    status: row.status,
    read_at: row.read_at,
  }))
}

export async function listUnreadNotificationReadStateRowsForOwners(input: {
  ownerIds: string[]
}): Promise<NotificationReadStateRow[]> {
  const rows = await listNotificationRowsForOwners(input)

  return rows
    .filter((row) => row.read_at === null && row.status !== "read")
    .map((row) => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      read_at: row.read_at,
    }))
}

export async function findNotificationReadStateByIdForOwners(input: {
  notificationId: string
  ownerIds: string[]
}): Promise<NotificationReadStateRow | null> {
  const row = await findNotificationByIdForOwners(input)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    user_id: row.user_id,
    status: row.status,
    read_at: row.read_at,
  }
}

type NotificationIdRow = {
  id: string
}

export async function findNotificationIdByIdForOwners(input: {
  notificationId: string
  ownerIds: string[]
}): Promise<NotificationIdRow | null> {
  const row = await findNotificationByIdForOwners(input)

  if (!row) {
    return null
  }

  return {
    id: row.id,
  }
}

export async function listVisibleNotificationOwnerIds(
  ownerIds: string[],
): Promise<string[]> {
  if (ownerIds.length === 0) {
    return []
  }

  const rows = await listNotificationRowsForOwners({ ownerIds })

  return Array.from(new Set(rows.map((row) => row.user_id)))
}