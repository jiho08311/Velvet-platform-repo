export async function queueStoryVideoJob(params: {
  file: File;
  visibility: string;
  startTime: number;
  expiresAt?: string;
}) {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("visibility", params.visibility);
  formData.append("startTime", String(params.startTime));

  if (params.expiresAt) {
    formData.append("expiresAt", params.expiresAt);
  }

  const response = await fetch("/api/stories/video-jobs", {
    method: "POST",
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? "Failed to queue story video job");
  }

  return json as {
    jobId: string;
    status: "pending" | "processing" | "completed" | "failed";
  };
}

export async function waitForStoryVideoJob(params: {
  jobId: string;
  timeoutMs?: number;
  intervalMs?: number;
}) {
  const timeoutMs = params.timeoutMs ?? 5 * 60 * 1000;
  const intervalMs = params.intervalMs ?? 2000;
  const startedAt = Date.now();

  for (;;) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Story video processing timeout");
    }

    const response = await fetch(`/api/stories/video-jobs/${params.jobId}`, {
      method: "GET",
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Failed to fetch story video job");
    }

    if (json.status === "completed") {
      return json as {
        id: string;
        status: "completed";
        story_id: string;
      };
    }

    if (json.status === "failed") {
      throw new Error(json.error_message ?? "Story video processing failed");
    }

    await sleep(intervalMs);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}