import type { StoryEditorState } from "@/modules/story/types"

type QueueStoryVideoJobInput = {
  file: File
  visibility: "public" | "subscribers"
  startTime: number
  editorState?: StoryEditorState | null
}

export async function queueStoryVideoJob({
  file,
  visibility,
  startTime,
  editorState,
}: QueueStoryVideoJobInput): Promise<{
  jobId: string
}> {
  const formData = new FormData()

  formData.append("file", file)
  formData.append("visibility", visibility)
  formData.append("startTime", String(startTime))

  if (editorState) {
    formData.append("editorState", JSON.stringify(editorState))
  }

  const response = await fetch("/api/story/video-job", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to queue story video job")
  }

  const data = await response.json()

  return {
    jobId: data.jobId,
  }
}

export async function waitForStoryVideoJob({
  jobId,
}: {
  jobId: string
}) {
  const maxAttempts = 60
  const intervalMs = 1000

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/story/video-job/${jobId}`)

    if (!res.ok) {
      throw new Error("Failed to fetch job status")
    }

    const data = await res.json()

    if (data.status === "completed") {
      return
    }

    if (data.status === "failed") {
      throw new Error(data.errorMessage || "Video processing failed")
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Video processing timeout")
}