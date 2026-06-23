import {
  createMessageReceivedNotification as createMessageReceivedNotificationRuntime,
} from "@/modules/notification/runtime/create-message-received-notification"

export const PUBLIC_CONTRACT = true

export type CreateMessageReceivedNotificationInput = Parameters<
  typeof createMessageReceivedNotificationRuntime
>[0]
export type CreateMessageReceivedNotificationResult = Awaited<
  ReturnType<typeof createMessageReceivedNotificationRuntime>
>

export function createMessageReceivedNotification(
  input: CreateMessageReceivedNotificationInput
): ReturnType<typeof createMessageReceivedNotificationRuntime> {
  return createMessageReceivedNotificationRuntime(input)
}
