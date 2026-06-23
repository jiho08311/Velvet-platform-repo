import {
  markNotificationRead as markNotificationReadRuntime,
} from "@/modules/notification/runtime/mark-notification-read"

export const PUBLIC_CONTRACT = true

export type MarkNotificationReadInput = Parameters<typeof markNotificationReadRuntime>
export type MarkNotificationReadResult = Awaited<
  ReturnType<typeof markNotificationReadRuntime>
>

export function markNotificationRead(
  ...input: MarkNotificationReadInput
): ReturnType<typeof markNotificationReadRuntime> {
  return markNotificationReadRuntime(...input)
}
