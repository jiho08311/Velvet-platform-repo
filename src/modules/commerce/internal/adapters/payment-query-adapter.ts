import { listCreatorPayments } from "@/modules/payment/public/list-creator-payments"
import { listPayments } from "@/modules/payment/public/list-payments"

export async function listCanonicalPayments() {
  return listPayments()
}

export async function listCanonicalCreatorPayments(input: {
  creatorId: string
}) {
  return listCreatorPayments(input)
}
