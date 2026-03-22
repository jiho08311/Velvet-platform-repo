import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/server/get-current-user";
import { getCreatorFeed } from "@/modules/post/server/get-creator-feed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creatorId");

    if (!creatorId) {
      return NextResponse.json(
        { error: "creatorId is required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    const posts = await getCreatorFeed({
      creatorId,
      userId: user?.id,
    });

    return NextResponse.json({
      posts,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}