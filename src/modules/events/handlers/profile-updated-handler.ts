import { rebuildCreatorPublicCardByUserId } from "@/modules/creator/public/rebuild-creator-public-cards"
import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"

type ProfileUpdatedPayload = {
  userId?: string | null
  profileId?: string | null
  version?: number | null
}

function stableHash(input: unknown): string {
  return JSON.stringify(input)
}

export const profileUpdatedHandler: EventHandler = {
  handlerName: "ProfileUpdatedProjectionConsumer",

  eventTypes: ["ProfileUpdated"],

  async handle(event): Promise<EventHandlerResult> {
    const payload = event.payload as ProfileUpdatedPayload
    const userId = payload.userId ?? payload.profileId ?? null

    if (!userId) {
      return {
        status: "skipped",
        reason: "missing_user_id",
      }
    }

    const result = await rebuildCreatorPublicCardByUserId(userId)

    return {
      status: result.status,
      reason: "reason" in result ? result.reason : undefined,
      resultHash: stableHash({
        handlerName: "ProfileUpdatedProjectionConsumer",
        eventId: event.event_id,
        eventType: event.event_type,
        userId,
        version: payload.version ?? null,
        result,
      }),
    }
  },
}