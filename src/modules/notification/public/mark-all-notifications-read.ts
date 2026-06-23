import {
  markAllNotificationsRead as markAllNotificationsReadRuntime,
} from "@/modules/notification/runtime/mark-all-notifications-read"

export const PUBLIC_CONTRACT = true

export type MarkAllNotificationsReadInput = Parameters<
  typeof markAllNotificationsReadRuntime
>[0]

export function markAllNotificationsRead(
  input: MarkAllNotificationsReadInput
): ReturnType<typeof markAllNotificationsReadRuntime> {
  return markAllNotificationsReadRuntime(input)
}
