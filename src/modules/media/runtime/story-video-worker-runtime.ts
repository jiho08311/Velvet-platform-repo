import {
  completeStoryVideoJobFromProcessorResult,
  markStoryVideoJobFailed,
} from "@/modules/media/public/story-video-worker-job"
import { processStoryVideoJob } from "@/modules/media/public/process-story-video-job"
import {
  createAndTraceAsyncJob,
  createAsyncJobCompletedTrace,
  createAsyncJobFailedTrace,
  createAsyncJobStartedTrace,
} from "@/shared/observability/create-async-job-trace"
import { createAndTraceSilentFailureEvent } from "@/shared/observability/silent-failure-event"
import type {
  StoryVideoWorkerRuntimeInput,
  StoryVideoWorkerRuntimeResult,
} from "@/modules/media/contracts/story-video-worker-runtime-contract"

const STORY_VIDEO_WORKER_ID =
  process.env.STORY_VIDEO_WORKER_ID ?? "story-video-worker"

function traceStoryVideoJobClaimed(input: StoryVideoWorkerRuntimeInput) {
  createAndTraceAsyncJob({
    jobName: "story-video-job",
    lifecycleState: "claimed",
    runtimeType: "db_claim",
    jobId: input.jobId,
    workflowId: "story-video-job",
    worker: {
      workerId: STORY_VIDEO_WORKER_ID,
      workerName: "story-video-worker",
    },
    source: {
      sourceFile: "src/modules/media/runtime/story-video-worker-runtime.ts",
      operationName: "runStoryVideoWorkerRuntime",
    },
    metadata: {
      creatorId: input.creatorId,
    },
  })
}

function traceStoryVideoJobStarted(input: StoryVideoWorkerRuntimeInput) {
  createAsyncJobStartedTrace({
    jobName: "story-video-job",
    runtimeType: "worker",
    jobId: input.jobId,
    workflowId: "story-video-job",
    worker: {
      workerId: STORY_VIDEO_WORKER_ID,
      workerName: "story-video-worker",
    },
    source: {
      sourceFile: "src/modules/media/runtime/story-video-worker-runtime.ts",
      operationName: "runStoryVideoWorkerRuntime",
    },
    metadata: {
      creatorId: input.creatorId,
      startTime: input.startTime,
    },
  })
}

function traceStoryVideoJobCompleted(input: {
  jobId: string
  storyId: string
  trimmedStoragePath: string
}) {
  createAsyncJobCompletedTrace({
    jobName: "story-video-job",
    runtimeType: "worker",
    jobId: input.jobId,
    workflowId: "story-video-job",
    worker: {
      workerId: STORY_VIDEO_WORKER_ID,
      workerName: "story-video-worker",
    },
    source: {
      sourceFile: "src/modules/media/runtime/story-video-worker-runtime.ts",
      operationName: "runStoryVideoWorkerRuntime",
    },
    metadata: {
      storyId: input.storyId,
      trimmedStoragePath: input.trimmedStoragePath,
    },
  })
}

function traceStoryVideoJobFailed(input: {
  jobId: string
  creatorId: string
  error: unknown
  message: string
}) {
  createAsyncJobFailedTrace({
    jobName: "story-video-job",
    runtimeType: "worker",
    jobId: input.jobId,
    workflowId: "story-video-job",
    worker: {
      workerId: STORY_VIDEO_WORKER_ID,
      workerName: "story-video-worker",
    },
    failure: {
      errorName: input.error instanceof Error ? input.error.name : null,
      errorMessage: input.message,
      errorStack: input.error instanceof Error ? input.error.stack ?? null : null,
      stage: "processStoryVideoJob",
      retryable: null,
      fatal: false,
    },
    source: {
      sourceFile: "src/modules/media/runtime/story-video-worker-runtime.ts",
      operationName: "runStoryVideoWorkerRuntime",
    },
    metadata: {
      creatorId: input.creatorId,
    },
  })
}

export async function runStoryVideoWorkerRuntime(
  processorInput: StoryVideoWorkerRuntimeInput
): Promise<StoryVideoWorkerRuntimeResult> {
  traceStoryVideoJobClaimed(processorInput)
  traceStoryVideoJobStarted(processorInput)

  try {
    const result = await processStoryVideoJob(processorInput)
    const completed = await completeStoryVideoJobFromProcessorResult({
      processorInput,
      result,
    })

    traceStoryVideoJobCompleted({
      jobId: result.jobId,
      storyId: completed.storyId,
      trimmedStoragePath: completed.trimmedStoragePath,
    })

    return {
      jobId: result.jobId,
      status: "completed",
      storyId: completed.storyId,
      trimmedStoragePath: completed.trimmedStoragePath,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Story video processing failed"

    await markStoryVideoJobFailed({
      jobId: processorInput.jobId,
      errorMessage: message,
    })

    traceStoryVideoJobFailed({
      jobId: processorInput.jobId,
      creatorId: processorInput.creatorId,
      error,
      message,
    })

    return {
      jobId: processorInput.jobId,
      status: "failed",
      errorMessage: message,
    }
  }
}

export function traceStoryVideoWorkerLoopError(input: {
  error: unknown
  pollIntervalMs: number
}) {
  createAndTraceSilentFailureEvent({
    category: "async_worker_loop_error",
    severity: "critical",
    failureMode: "catch_console_error_only",
    provenance: {
      sourceFile: "src/modules/media/runtime/story-video-worker-runtime.ts",
      operationName: "traceStoryVideoWorkerLoopError",
      domain: "async_job",
      actorType: "worker",
      authorityScope: {
        authority: "async.worker_loop",
        resourceType: "story_video_job",
        resourceId: null,
      },
    },
    ignoredExecution: {
      ignored: true,
      mechanism: "catch_fallback",
      rejectionObserved: true,
    },
    error: input.error,
    metadata: {
      workerId: STORY_VIDEO_WORKER_ID,
      workerName: "story-video-worker",
      pollIntervalMs: input.pollIntervalMs,
    },
  })
}

export function traceStoryVideoWorkerFatalError(error: unknown) {
  createAndTraceSilentFailureEvent({
    category: "async_worker_fatal_error",
    severity: "critical",
    failureMode: "promise_catch_swallowed",
    provenance: {
      sourceFile: "src/modules/media/runtime/story-video-worker-runtime.ts",
      operationName: "traceStoryVideoWorkerFatalError",
      domain: "async_job",
      actorType: "worker",
      authorityScope: {
        authority: "async.worker_fatal",
        resourceType: "story_video_worker",
        resourceId: STORY_VIDEO_WORKER_ID,
      },
    },
    ignoredExecution: {
      ignored: false,
      mechanism: "unknown",
      rejectionObserved: true,
    },
    error,
    metadata: {
      workerId: STORY_VIDEO_WORKER_ID,
      workerName: "story-video-worker",
    },
  })
}
