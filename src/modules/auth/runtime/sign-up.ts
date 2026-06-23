import type { AuthResponse } from "@supabase/supabase-js";
import { signUpWithPassword } from "@/modules/auth/repositories/auth-session-repository";

type SignUpInput = {
  email: string;
  password: string;
};

export async function signUp({
  email,
  password,
}: SignUpInput): Promise<AuthResponse> {
  return signUpWithPassword({
    email,
    password,
  });
}
