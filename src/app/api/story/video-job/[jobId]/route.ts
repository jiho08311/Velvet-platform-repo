import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getStoryVideoJobForUser } from "@/modules/media/server/story-video-job.service";

type Context = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const cookieStore = await cookies();
    const { jobId } = await context.params;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await getStoryVideoJobForUser({
      jobId,
      userId: user.id,
    });

    return NextResponse.json(job);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get job status";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}