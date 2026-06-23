import { getCanonicalSubscriptionById } from "@/modules/commerce/internal/adapters/subscription-adapter"
import { buildSubscriptionReadModel } from "@/modules/subscription/public/subscription-read-model"
import type {
  GetSubscriptionInput,
  GetSubscriptionResult,
} from "@/modules/commerce/public/subscription-contract"
import type {
  SubscriptionAccessState,
  SubscriptionDisplayState,
  SubscriptionState,
} from "@/modules/commerce/public/types"

function hasSubscriptionId(
  input: GetSubscriptionInput
): input is { subscriptionId: string } {
  return "subscriptionId" in input
}

function toAccessState(hasAccess: boolean): SubscriptionAccessState {
  return hasAccess ? "active" : "inactive"
}

function toDisplayState(
  state: "active" | "ending" | "expired" | "inactive"
): SubscriptionDisplayState {
  return state
}

function toSubscriptionState(row: NonNullable<Awaited<ReturnType<typeof getCanonicalSubscriptionById>>>): SubscriptionState {
  const readModel = buildSubscriptionReadModel({
    id: row.id,
    user_id: row.user_id,
    creator_id: row.creator_id,
    status: row.status,
    current_period_start: row.current_period_start,
    current_period_end: row.current_period_end,
    cancel_at_period_end: row.cancel_at_period_end ?? false,
    canceled_at: row.canceled_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  })

  return {
    subscriptionId: readModel.id,
    subscriberUserId: readModel.userId,
    creatorId: readModel.creatorId,
    status: readModel.status,
    accessState: toAccessState(readModel.hasAccess),
    displayState: toDisplayState(readModel.state),
    hasAccess: readModel.hasAccess,
    cancelAtPeriodEnd: readModel.cancelAtPeriodEnd,
    currentPeriodStart: readModel.currentPeriodStartAt,
    currentPeriodEnd: readModel.currentPeriodEndAt,
    canceledAt: readModel.canceledAt,
    createdAt: readModel.createdAt,
    updatedAt: readModel.updatedAt,
  }
}

export async function getSubscriptionUseCase(
  input: GetSubscriptionInput
): Promise<GetSubscriptionResult> {
  if (!hasSubscriptionId(input)) {
    throw new Error("GET_SUBSCRIPTION_BY_USER_AND_CREATOR_NOT_WIRED")
  }

  const subscription = await getCanonicalSubscriptionById(input.subscriptionId)

  return {
    subscription: subscription ? toSubscriptionState(subscription) : null,
  }
}