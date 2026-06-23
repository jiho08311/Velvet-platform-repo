import {
  deleteNotification as deleteNotificationRuntime,
} from "@/modules/notification/runtime/delete-notification"

export const PUBLIC_CONTRACT = true

export type DeleteNotificationInput = Parameters<typeof deleteNotificationRuntime>[0]

export function deleteNotification(
  input: DeleteNotificationInput
): ReturnType<typeof deleteNotificationRuntime> {
  return deleteNotificationRuntime(input)
}
