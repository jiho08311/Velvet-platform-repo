import {
  listModerationQueue as listModerationQueueRuntime,
} from "@/modules/moderation/runtime/list-moderation-queue"

export const PUBLIC_CONTRACT = true

export type ModerationQueueItem = Awaited<
  ReturnType<typeof listModerationQueueRuntime>
>[number]

export function listModerationQueue(): ReturnType<typeof listModerationQueueRuntime> {
  return listModerationQueueRuntime()
}
