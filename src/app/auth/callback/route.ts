import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  buildPathWithNext,
  DEFAULT_AUTH_RESUME_PATH,
  resolveRedirectTarget,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = resolveRedirectTarget({
    target: requestUrl.searchParams.get("next"),
  });
  const signInRedirectPath = buildPathWithNext({
    path: SIGN_IN_PATH,
    next: DEFAULT_AUTH_RESUME_PATH,
  });

  if (!code) {
    return NextResponse.redirect(new URL(signInRedirectPath, request.url));
  }

  const cookieStore = await cookies();

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
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("GOOGLE CALLBACK EXCHANGE ERROR >>>", error);
    return NextResponse.redirect(new URL(signInRedirectPath, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
