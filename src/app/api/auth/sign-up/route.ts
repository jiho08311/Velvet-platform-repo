import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { signUpWithAdultCheck } from "@/modules/auth/public/sign-up-with-adult-check";
import { logger } from "@/shared/observability/structured-logger";

export const routeAccess = "public";

export async function POST(request: Request) {
  try {
    const { email, password, birthDate } = await request.json();

    if (!email || !password || !birthDate) {
      return NextResponse.json(
        { error: "email, password, and birthDate are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
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

    await signUpWithAdultCheck({
      supabase,
      email,
      password,
      birthDate,
    });

    return response;
  } catch (e) {
    logger.error({
      event: "auth.sign_up_route_failed",
      error: e,
    });

    const message = e instanceof Error ? e.message : "sign up failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
