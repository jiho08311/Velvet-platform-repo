import {
  getViewerSubscription as getViewerSubscriptionRuntime,
} from "@/modules/subscription/runtime/get-viewer-subscription"

export const PUBLIC_CONTRACT = true

export type GetViewerSubscriptionInput = Parameters<
  typeof getViewerSubscriptionRuntime
>
export type ViewerSubscription = Awaited<
  ReturnType<typeof getViewerSubscriptionRuntime>
>

export function getViewerSubscription(
  ...input: GetViewerSubscriptionInput
): ReturnType<typeof getViewerSubscriptionRuntime> {
  return getViewerSubscriptionRuntime(...input)
}
