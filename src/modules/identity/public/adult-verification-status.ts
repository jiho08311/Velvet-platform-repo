import {
  readAdultVerificationStatusRuntime,
} from "@/modules/identity/runtime/read-adult-verification-status-runtime"

export const PUBLIC_CONTRACT = true

export type ReadAdultVerificationStatusInput = Parameters<
  typeof readAdultVerificationStatusRuntime
>[0]
export type AdultVerificationStatusReadModel = Awaited<
  ReturnType<typeof readAdultVerificationStatusRuntime>
>

export async function readAdultVerificationStatus(
  input: ReadAdultVerificationStatusInput
): Promise<AdultVerificationStatusReadModel> {
  return readAdultVerificationStatusRuntime(input)
}
