import {
  getActiveSubscription as getActiveSubscriptionRuntime,
} from "@/modules/subscription/runtime/get-active-subscription"

export const PUBLIC_CONTRACT = true

export type GetActiveSubscriptionInput = Parameters<
  typeof getActiveSubscriptionRuntime
>[0]
export type ActiveSubscription = Awaited<
  ReturnType<typeof getActiveSubscriptionRuntime>
>

export function getActiveSubscription(
  input: GetActiveSubscriptionInput
): ReturnType<typeof getActiveSubscriptionRuntime> {
  return getActiveSubscriptionRuntime(input)
}
