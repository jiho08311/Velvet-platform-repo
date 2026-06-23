import {
  listNotificationItems as listNotificationItemsRuntime,
  listNotificationReadStates as listNotificationReadStatesRuntime,
  listNotifications as listNotificationsRuntime,
} from "@/modules/notification/runtime/list-notifications"

export const PUBLIC_CONTRACT = true

export type ListNotificationsInput = Parameters<typeof listNotificationsRuntime>[0]
export type ListNotificationsResult = Awaited<
  ReturnType<typeof listNotificationsRuntime>
>
export type ListNotificationItemsInput = Parameters<
  typeof listNotificationItemsRuntime
>[0]
export type NotificationItem = Awaited<
  ReturnType<typeof listNotificationItemsRuntime>
>[number]
export type ListNotificationReadStatesInput = Parameters<
  typeof listNotificationReadStatesRuntime
>[0]
export type NotificationReadState = Awaited<
  ReturnType<typeof listNotificationReadStatesRuntime>
>[number]

export function listNotifications(
  input: ListNotificationsInput
): ReturnType<typeof listNotificationsRuntime> {
  return listNotificationsRuntime(input)
}

export function listNotificationItems(
  input: ListNotificationItemsInput
): ReturnType<typeof listNotificationItemsRuntime> {
  return listNotificationItemsRuntime(input)
}

export function listNotificationReadStates(
  input: ListNotificationReadStatesInput
): ReturnType<typeof listNotificationReadStatesRuntime> {
  return listNotificationReadStatesRuntime(input)
}
