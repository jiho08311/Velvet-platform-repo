import type { AuthTokenResponsePassword } from "@supabase/supabase-js";
import { signInWithPassword } from "@/modules/auth/repositories/auth-session-repository";

type SignInInput = {
  email: string;
  password: string;
};

export async function signIn({
  email,
  password,
}: SignInInput): Promise<AuthTokenResponsePassword> {
  return signInWithPassword({
    email,
    password,
  });
}
