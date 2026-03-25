import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json(
      { error: "profileId is required" },
      { status: 400 }
    );
  }

  const requestId = crypto.randomUUID();
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/pass/callback`;

  const redirectUrl = `${callbackUrl}?requestId=${requestId}&profileId=${profileId}&mock=true`;

  return NextResponse.redirect(redirectUrl);
}