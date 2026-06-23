import {
  requireNotificationPageAccess as requireNotificationPageAccessRuntime,
} from "@/modules/notification/runtime/require-notification-page-access"

export const PUBLIC_CONTRACT = true

export type RequireNotificationPageAccessInput = Parameters<
  typeof requireNotificationPageAccessRuntime
>[0]
export type RequireNotificationPageAccessResult = Awaited<
  ReturnType<typeof requireNotificationPageAccessRuntime>
>

export function requireNotificationPageAccess(
  input: RequireNotificationPageAccessInput
): ReturnType<typeof requireNotificationPageAccessRuntime> {
  return requireNotificationPageAccessRuntime(input)
}
