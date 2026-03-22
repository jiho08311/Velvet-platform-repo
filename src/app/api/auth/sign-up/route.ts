import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  buildDefaultUsername,
  createUserProfile,
} from "@/modules/auth/server/create-user-profile";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies()
    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const authUser = data.user;

    if (!authUser) {
      return NextResponse.json(
        { error: "failed to create auth user" },
        { status: 500 }
      );
    }

    await createUserProfile({
      id: authUser.id,
      email,
      displayName: email.split("@")[0],
      username: buildDefaultUsername(email, authUser.id),
    });

    return response;
  } catch (e) {
    console.error("SIGN UP ERROR", e);
    return NextResponse.json({ error: "sign up failed" }, { status: 500 });
  }
}