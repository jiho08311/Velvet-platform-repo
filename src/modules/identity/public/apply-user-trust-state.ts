import {
  applyUserTrustState as applyUserTrustStateRepository,
} from "@/modules/identity/repositories/user-trust-state-repository"

export const PUBLIC_CONTRACT = true

export type UserTrustState =
  | "NORMAL"
  | "WARNED"
  | "RESTRICTED"
  | "SUSPENDED"
  | "BANNED"

export type ApplyUserTrustStateInput = Parameters<
  typeof applyUserTrustStateRepository
>[0]

export async function applyUserTrustState(
  input: ApplyUserTrustStateInput
): Promise<void> {
  return applyUserTrustStateRepository(input)
}
