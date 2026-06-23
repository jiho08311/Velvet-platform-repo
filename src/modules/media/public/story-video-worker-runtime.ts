import {
  runStoryVideoWorkerRuntime as runStoryVideoWorker,
  traceStoryVideoWorkerFatalError as traceStoryVideoWorkerFatal,
  traceStoryVideoWorkerLoopError as traceStoryVideoWorkerLoop,
} from "@/modules/media/runtime/story-video-worker-runtime"

export const PUBLIC_CONTRACT = true

export type RunStoryVideoWorkerRuntimeInput = Parameters<
  typeof runStoryVideoWorker
>[0]
export type RunStoryVideoWorkerRuntimeResult = Awaited<
  ReturnType<typeof runStoryVideoWorker>
>
export type TraceStoryVideoWorkerLoopErrorInput = Parameters<
  typeof traceStoryVideoWorkerLoop
>[0]
export type TraceStoryVideoWorkerFatalErrorInput = Parameters<
  typeof traceStoryVideoWorkerFatal
>[0]

export async function runStoryVideoWorkerRuntime(
  input: RunStoryVideoWorkerRuntimeInput
): Promise<RunStoryVideoWorkerRuntimeResult> {
  return runStoryVideoWorker(input)
}

export function traceStoryVideoWorkerLoopError(
  input: TraceStoryVideoWorkerLoopErrorInput
): void {
  return traceStoryVideoWorkerLoop(input)
}

export function traceStoryVideoWorkerFatalError(
  input: TraceStoryVideoWorkerFatalErrorInput
): void {
  return traceStoryVideoWorkerFatal(input)
}
