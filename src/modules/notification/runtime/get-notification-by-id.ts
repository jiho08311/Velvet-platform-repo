import type { Notification } from "../types"

type GetNotificationByIdParams = {
  notificationId: string
  userId: string


  
}



import { getNotificationVisibilityScope } from "@/modules/notification/policies/notification-visibility-policy"

import {
  findNotificationByIdForOwners,
} from "../repositories/notification-read-repository"

import {
  mapNotificationRow,
} from "../mappers/notification-read-model-mapper"

export async function getNotificationById({
  notificationId,
  userId,
}: GetNotificationByIdParams): Promise<Notification | null> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return null
  }

  const data = await findNotificationByIdForOwners({
    notificationId,
    ownerIds: scope.ownerIds,
  })

  if (!data) {
    return null
  }

  const notification = mapNotificationRow(data)

  return notification
}
