import { signOutCurrentSession } from "@/modules/auth/repositories/auth-session-repository";

export async function signOut(): Promise<void> {
  await signOutCurrentSession();
}
