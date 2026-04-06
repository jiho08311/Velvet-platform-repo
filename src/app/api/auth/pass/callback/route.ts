// src/app/api/auth/pass/callback/route.ts
import { NextResponse } from "next/server";
import { completePassVerification } from "@/modules/auth/server/complete-pass-verification";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);

    const requestId = searchParams.get("requestId");
    const profileId = searchParams.get("profileId");
    const mock = searchParams.get("mock");

    if (!requestId || !profileId) {
      return NextResponse.redirect(
        new URL("/verify-pass?error=missing_pass_params", origin)
      );
    }

    await completePassVerification({
      requestId,
      profileId,
      mock,
    });

   return NextResponse.redirect(new URL("/feed", origin));
  } catch (error) {
    console.error("PASS CALLBACK ERROR", error);

    return NextResponse.redirect(
      new URL("/verify-pass?error=pass_verification_failed", request.url)
    );
  }
}