import { validateAdultSignUp } from "./validate-adult-sign-up";
import {
  buildDefaultUsername,
  createUserProfile,
} from "@/modules/auth/server/create-user-profile";

type SignUpWithAdultCheckParams = {
  supabase: {
    auth: {
      signUp: (params: {
        email: string;
        password: string;
        options?: {
          data?: Record<string, unknown>;
        };
      }) => Promise<{
        data: {
          user: {
            id: string;
          } | null;
        };
        error: { message: string } | null;
      }>;
      signInWithPassword: (params: {
        email: string;
        password: string;
      }) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
  };
  email: string;
  password: string;
  birthDate: string;
};

export async function signUpWithAdultCheck({
  supabase,
  email,
  password,
  birthDate,
}: SignUpWithAdultCheckParams) {
  validateAdultSignUp({ birthDate });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        birth_date: birthDate,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("failed to create auth user");
  }

  await createUserProfile({
    id: data.user.id,
    email,
    displayName: email.split("@")[0],
    username: buildDefaultUsername(email, data.user.id),
    birthDate,
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error(signInError.message);
  }

  return data.user;
}