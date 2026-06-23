// src/modules/admin/public/get-user-detail.ts
import {
  getUserDetail as getUserDetailRuntime,
} from "@/modules/admin/runtime/get-user-detail"

export const PUBLIC_CONTRACT = true

export type GetUserDetailInput = Parameters<typeof getUserDetailRuntime>[0]
export type GetUserDetailResult = Awaited<ReturnType<typeof getUserDetailRuntime>>

export async function getUserDetail(
  input: GetUserDetailInput
): Promise<GetUserDetailResult> {
  return getUserDetailRuntime(input)
}
