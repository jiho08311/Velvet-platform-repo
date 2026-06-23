import { revalidatePath } from "next/cache"

type RevalidatePayoutSurfacesInput = {
  creatorUsername?: string | null
}

export function revalidatePayoutSurfaces(
  input: RevalidatePayoutSurfacesInput = {}
) {
  revalidatePath("/dashboard/payouts")
  revalidatePath("/dashboard")
  revalidatePath("/creator/payout")

  const creatorUsername = input.creatorUsername?.trim()

  if (creatorUsername) {
    revalidatePath(`/creator/${creatorUsername}`)
  }
}
