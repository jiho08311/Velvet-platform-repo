import {
  createNotification as createNotificationRuntime,
} from "@/modules/notification/runtime/create-notification"

export const PUBLIC_CONTRACT = true

export type CreateNotificationInput = Parameters<typeof createNotificationRuntime>[0]
export type CreateNotificationResult = Awaited<
  ReturnType<typeof createNotificationRuntime>
>

export function createNotification(
  input: CreateNotificationInput
): ReturnType<typeof createNotificationRuntime> {
  return createNotificationRuntime(input)
}
