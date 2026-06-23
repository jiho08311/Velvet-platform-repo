import { signOut as signOutRuntime } from "@/modules/auth/runtime/sign-out"

export const PUBLIC_CONTRACT = true

export async function signOut(): Promise<void> {
  await signOutRuntime()
}
