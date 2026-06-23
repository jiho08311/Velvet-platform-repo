import {
  getNotificationBadgeSummary as getNotificationBadgeSummaryRuntime,
} from "@/modules/notification/runtime/get-notification-badge-summary"

export const PUBLIC_CONTRACT = true

export type GetNotificationBadgeSummaryInput = Parameters<
  typeof getNotificationBadgeSummaryRuntime
>[0]
export type NotificationBadgeSummary = Awaited<
  ReturnType<typeof getNotificationBadgeSummaryRuntime>
>

export function getNotificationBadgeSummary(
  input: GetNotificationBadgeSummaryInput
): ReturnType<typeof getNotificationBadgeSummaryRuntime> {
  return getNotificationBadgeSummaryRuntime(input)
}
