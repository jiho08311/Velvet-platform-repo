import {
  checkSubscription as checkSubscriptionRuntime,
} from "@/modules/subscription/runtime/check-subscription"

export const PUBLIC_CONTRACT = true

export type CheckSubscriptionInput = Parameters<typeof checkSubscriptionRuntime>[0]
export type CheckSubscriptionResult = Awaited<ReturnType<typeof checkSubscriptionRuntime>>

export function checkSubscription(
  input: CheckSubscriptionInput
): ReturnType<typeof checkSubscriptionRuntime> {
  return checkSubscriptionRuntime(input)
}
