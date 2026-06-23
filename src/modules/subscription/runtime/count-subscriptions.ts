import {
  countActiveSubscriptions,
  countSubscriptions,
} from "@/modules/subscription/repositories/subscription-read-repository"

export async function countAllSubscriptions() {
  return countSubscriptions()
}

export async function countAllActiveSubscriptions() {
  return countActiveSubscriptions()
}
