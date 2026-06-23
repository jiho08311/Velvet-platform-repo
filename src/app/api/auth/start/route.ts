// src/app/api/auth/pass/start/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/public/get-current-user";
import { normalizePassVerificationNext } from "@/modules/auth/public/assert-pass-verified";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams, origin } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const next = searchParams.get("next");
  const normalizedNext = next ? normalizePassVerificationNext(next) : null;

  if (!user || !profileId || profileId !== user.id) {
    return NextResponse.redirect(
      new URL("/verify-pass?error=unauthorized_profile", origin)
    );
  }

  const requestId = crypto.randomUUID();
  const callbackSearchParams = new URLSearchParams({
    requestId,
    profileId,
    mock: "true",
  });

  if (normalizedNext) {
    callbackSearchParams.set("next", normalizedNext);
  }

  return NextResponse.redirect(
    new URL(`/api/auth/pass/callback?${callbackSearchParams.toString()}`, origin)
  );
}
