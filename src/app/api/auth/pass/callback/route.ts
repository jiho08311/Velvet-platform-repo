import { NextResponse } from "next/server";
import { completePassVerification } from "@/modules/auth/server/complete-pass-verification";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestId = searchParams.get("requestId");
    const profileId = searchParams.get("profileId");
    const mock = searchParams.get("mock");

    if (!requestId || !profileId) {
      return NextResponse.redirect(
        new URL("/sign-up?error=missing_pass_params", request.url)
      );
    }

    await completePassVerification({
      requestId,
      profileId,
      mock,
    });

    return NextResponse.redirect(
      new URL("/sign-up?passVerified=true", request.url)
    );
  } catch (error) {
    console.error("PASS CALLBACK ERROR", error);

    return NextResponse.redirect(
      new URL("/sign-up?error=pass_verification_failed", request.url)
    );
  }
}