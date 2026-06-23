type SubscriptionAccessState = "active" | "inactive"

type SubscriptionAccessPolicyInput = {
  accessState: SubscriptionAccessState
}

export function canAccessSubscription({
  accessState,
}: SubscriptionAccessPolicyInput): boolean {
  return accessState === "active"
}
