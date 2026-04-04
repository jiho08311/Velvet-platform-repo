// src/app/api/auth/pass/start/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.redirect(
      new URL("/verify-pass?error=missing_profile_id", origin)
    );
  }

  const requestId = crypto.randomUUID();

  return NextResponse.redirect(
    new URL(
      `/api/auth/pass/callback?requestId=${encodeURIComponent(
        requestId
      )}&profileId=${encodeURIComponent(profileId)}&mock=true`,
      origin
    )
  );
}