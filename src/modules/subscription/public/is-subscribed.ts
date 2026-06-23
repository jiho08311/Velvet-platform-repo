import {
  isSubscribed as isSubscribedRuntime,
} from "@/modules/subscription/runtime/is-subscribed"

export const PUBLIC_CONTRACT = true

export type IsSubscribedInput = Parameters<typeof isSubscribedRuntime>[0]

export function isSubscribed(
  input: IsSubscribedInput
): ReturnType<typeof isSubscribedRuntime> {
  return isSubscribedRuntime(input)
}
