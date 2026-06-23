import { createPayoutRequest } from "@/modules/commerce/public/payout-contract"
import { readCreatorOperationalReadiness } from "@/modules/creator/public/read-creator-operational-readiness"
import { requireCreatorReadyUser } from "@/modules/creator/public/require-creator-ready-user"
import { updateCreatorSettings } from "@/modules/creator/public/update-creator-settings"
import { revalidatePayoutSurfaces } from "@/modules/payout/public/revalidate-payout-surfaces"

export async function requestPayoutAction(formData: FormData) {
  "use server"

  const { user } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payouts",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    throw new Error("Creator is not active")
  }

  const currencyValue = formData.get("currency")
  const currency =
    typeof currencyValue === "string" && currencyValue.trim()
      ? currencyValue
      : "KRW"

  await createPayoutRequest({
    creatorId: readiness.creator.id,
    currency,
  })

  revalidatePayoutSurfaces({
    creatorUsername: readiness.creator.username,
  })
}

export async function updateSubscriptionPriceAction(formData: FormData) {
  "use server"

  const price = Number(formData.get("price"))

  if (!Number.isFinite(price)) {
    throw new Error("Invalid subscription price")
  }

  const { user, creator } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payouts",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    throw new Error("Creator is not active")
  }

  await updateCreatorSettings({
    creatorId: user.id,
    subscriptionPrice: price,
  })

  revalidatePayoutSurfaces({
    creatorUsername: creator.username,
  })
}
