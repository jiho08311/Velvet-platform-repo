import {
  getNotificationById as getNotificationByIdRuntime,
} from "@/modules/notification/runtime/get-notification-by-id"

export const PUBLIC_CONTRACT = true

export type GetNotificationByIdInput = Parameters<typeof getNotificationByIdRuntime>[0]
export type NotificationDetail = Awaited<
  ReturnType<typeof getNotificationByIdRuntime>
>

export function getNotificationById(
  input: GetNotificationByIdInput
): ReturnType<typeof getNotificationByIdRuntime> {
  return getNotificationByIdRuntime(input)
}
