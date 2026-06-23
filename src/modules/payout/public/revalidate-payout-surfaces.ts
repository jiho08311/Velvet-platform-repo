import {
  revalidatePayoutSurfaces as revalidatePayoutSurfacesRuntime,
} from "@/modules/payout/runtime/revalidate-payout-surfaces"

export const PUBLIC_CONTRACT = true

export type RevalidatePayoutSurfacesInput = Parameters<
  typeof revalidatePayoutSurfacesRuntime
>[0]

export function revalidatePayoutSurfaces(
  input: RevalidatePayoutSurfacesInput
): ReturnType<typeof revalidatePayoutSurfacesRuntime> {
  return revalidatePayoutSurfacesRuntime(input)
}
