# Media Import Boundary Audit

## Purpose

media domain의 외부 import boundary를 감사하여 `media/server`, `media/lib`, `media/public`, `media/index.ts` 사용처를 분류한다.

이 문서는 코드 변경 전에 public wrapper 후보와 보류 사유를 확정하기 위한 read-only audit이다.

## Scope

Read only:

- `src/modules/media/**`
- `src/app/**`
- `src/modules/**`
- `src/workflows/**`
- `middleware.ts`
- `Dockerfile.worker`

## Rules Applied

- 코드 변경 없음
- DB schema 변경 없음
- RLS policy 변경 없음
- SQL migration 실행 없음
- storage bucket/policy 변경 없음
- auth/payment/subscription flow 변경 없음
- UI copy/layout 변경 없음
- return shape 변경 없음
- permission behavior 변경 없음
- error behavior 변경 없음
- refactor progress 문서 변경 없음

## Commands / Searches Performed

- `@/modules/media/server` import grep
- `@/modules/media/lib` import grep
- `@/modules/media/public` import grep
- `@/modules/media` index import grep
- relative media import grep
- `src/modules/media/index.ts` export review
- selected caller source review

## Current Media Boundary State

```txt
app / api / post / story / workflow
↓
media/server or media/lib direct imports remain

feed / search / creator / post / message
↓
media/public/create-media-signed-url

post ui
↓
media/public/upload-media

media/index.ts
↓
types + server exports + public export
```

## Public Boundary Usage

### create-media-signed-url

Current callers:

- `src/modules/feed/server/get-home-feed.ts`
- `src/modules/story/server/get-stories.ts`
- `src/modules/search/server/get-explore-posts.ts`
- `src/modules/post/services/post-feed-render-service.ts`
- `src/modules/message/server/create-conversation-message-media.ts`
- `src/modules/creator/server/get-creator-page.ts`
- `src/modules/post/server/get-post-by-id.ts`
- `src/modules/post/server/list-creator-posts.ts`
- `src/modules/post/server/get-creator-studio-post.ts`
- `src/modules/post/server/get-my-posts.ts`
- `src/modules/post/server/get-post-media.ts`

Status:

Accepted public boundary.

Notes:

- signed URL behavior is critical.
- public wrapper currently contains direct Supabase storage access.
- storage repository/service split should be a later dedicated wave.
- caller import path does not need immediate cleanup unless barrel export strategy changes.

### upload-media

Current callers:

- `src/modules/post/ui/CreatePostComposer.tsx`

Status:

Accepted public boundary for post composer upload.

Notes:

- `media/public/upload-media.ts` is `"use server"`.
- it currently wraps `media/server/upload-media`.
- it is post-composer shaped and returns `CreatePostUploadedMediaInput` map.
- it should not be reused blindly for message upload API or post update use-case unless contract is intentionally generalized.

## Server Direct Import Findings

### create-media

Current direct callers:

- `src/workflows/create-post-with-media-workflow.ts`
- `src/app/api/media/upload/route.ts`
- `src/modules/post/use-cases/update-post.ts`

Imported exports:

- `createMedia`
- `createPostAuthoringMedia`

Classification:

Needs public boundary.

Recommended public candidates:

- `media/public/create-media.ts`
- `media/public/create-post-authoring-media.ts`

Risk:

High

Do Not Change Behavior:

- media row shape
- post_id / message_id / owner_user_id mapping
- status default
- moderation initial state behavior
- error throw behavior

Suggested follow-up:

- Add wrapper first.
- Switch external callers import-only.
- Move DB insert into repository later.

### upload-media

Current direct callers:

- `src/app/api/media/upload/route.ts`
- `src/modules/post/use-cases/update-post.ts`

Internal public wrapper caller:

- `src/modules/media/public/upload-media.ts`

Classification:

Needs generalized public boundary or carefully scoped wrapper.

Recommended public candidates:

- `media/public/upload-raw-media.ts`
- or `media/public/upload-media-file.ts`

Risk:

High

Do Not Change Behavior:

- storage path format
- default purpose behavior
- message purpose path
- post purpose path
- bucket fallback
- upload options
- error throw behavior

Suggested follow-up:

- Keep existing `uploadPostMedia` wrapper.
- Add a lower-level public wrapper for server/API callers.
- Migrate `app/api/media/upload/route.ts` and `post/use-cases/update-post.ts` import paths only.

### story-video-job.service

Current direct callers:

- `src/app/api/story/video-job/route.ts`
- `src/app/api/story/video-job/[jobId]/route.ts`
- `src/modules/story/server/story-video-worker.ts`

Imported exports:

- `enqueueStoryVideoJob`
- `getStoryVideoJobForUser`
- `claimStoryVideoJobForProcessing`
- `completeStoryVideoJobFromProcessorResult`
- `markStoryVideoJobFailed`

Classification:

Needs story video job public boundary, but should remain behavior-preserving.

Recommended public candidates:

- `media/public/story-video-job.ts`
- `media/public/story-video-worker-job.ts`

Risk:

Critical

Do Not Change Behavior:

- story_video_jobs insert values
- claim RPC behavior
- polling row shape
- completed/failed status values
- story creation side effect
- temp cleanup behavior
- worker retry/error behavior

Suggested follow-up:

- Add public wrappers only.
- Split route-facing and worker-facing exports if needed.
- Repository split should be later than boundary migration.

### story-video-processor.server

Current direct callers:

- `src/modules/story/server/story-video-worker.ts`

Imported exports:

- `processStoryVideoJob`

Classification:

Needs worker-facing public boundary or accepted server worker boundary.

Recommended public candidate:

- `media/public/process-story-video-job.ts`

Risk:

Critical

Do Not Change Behavior:

- processor input contract
- processor output contract
- storage download/upload behavior
- video trim behavior
- worker error behavior

Suggested follow-up:

- Treat this as part of story video worker boundary.
- Do not combine with API route cleanup in the same implementation wave if diff grows.

### story-video-storage.service

Current direct callers:

- `src/modules/media/server/story-video-job.service.ts`

Classification:

Internal media server dependency.

Status:

No external boundary violation.

Notes:

- Still contains critical storage behavior.
- Repository/storage-service cleanup should be separate from import boundary cleanup.

## Lib Direct Import Findings

### queue-story-video-job

Current direct callers:

- `src/modules/story/ui/CreateStoryComposer.tsx`

Classification:

Needs public boundary or relocation decision.

Recommended public candidate:

- `media/public/queue-story-video-job.ts`

Risk:

High

Do Not Change Behavior:

- `/api/story/video-job` endpoint
- polling interval
- max attempts
- completed/failed response handling
- thrown error messages

Suggested follow-up:

- Add public re-export/wrapper first.
- Change `CreateStoryComposer` import path only.

### story-video-job-contract

Current direct callers:

- `src/app/api/story/video-job/route.ts`
- `src/modules/media/server/story-video-job.service.ts`

Classification:

Route external usage needs public/type boundary.

Recommended public candidate:

- `media/public/story-video-job-contract.ts`

Risk:

High

Do Not Change Behavior:

- poll response shape
- pending/completed/failed discriminator fields
- select contract
- status values

### story-video-processor-contract

Current direct callers:

- `src/modules/media/server/story-video-job.service.ts`
- `src/modules/media/server/story-video-processor.server.ts`

Classification:

Internal media usage only.

Status:

No immediate external boundary migration needed.

## Index Export Findings

Current `src/modules/media/index.ts`:

```ts
export * from "./types"
export * from "./server/create-media"
export * from "./server/upload-media"
export * from "./public/create-media-signed-url"
```

Problem:

- server internals are exposed from the domain index.
- future callers could import server behavior through `@/modules/media`.

Current direct `@/modules/media` import usage:

- none found

Classification:

Cleanup candidate after public wrappers are complete.

Recommended target:

```txt
media/index.ts
↓
types + public exports only
```

Do Not Change Yet:

- remove server exports before public wrappers exist
- change import style in unrelated domains

## Relative Import Findings

Relative media boundary violations:

- none found outside `src/modules/media/index.ts` server export lines

Notes:

- media internal relative imports were not the main issue.
- current violations are mostly absolute `@/modules/media/server` and `@/modules/media/lib` imports.

## Boundary Debt Summary

### Must Fix Before Media Domain Completion

- `app/api/media/upload/route.ts` direct `media/server` imports
- `post/use-cases/update-post.ts` direct `media/server` imports
- `workflows/create-post-with-media-workflow.ts` direct `media/server` import
- story API direct `media/server` imports
- story worker direct `media/server` imports
- story UI direct `media/lib` import
- story API direct `media/lib` contract import
- `media/index.ts` server exports

### Can Stay Temporarily

- `media/public/upload-media.ts` importing `media/server/upload-media`
- `media/server/story-video-job.service.ts` importing media lib contracts
- `media/server/story-video-job.service.ts` importing media server storage service
- `media/server/story-video-processor.server.ts` importing processor contract
- external signed URL callers importing `media/public/create-media-signed-url`

### Requires Later Audit

- media public wrapper still containing storage access
- media server direct DB access
- cross-domain direct media table access
- story video storage service bucket handling
- avatar/profile storage direct access

## Recommended Next Waves

### wave-003

media DB/storage direct access audit

Goal:

media table, story_video_jobs, storage bucket, cross-domain media access를 repository/storage boundary 후보로 분류한다.

No code changes.

### wave-004

media detailed refactor brief generation

Goal:

wave-005 이후 코드 변경 wave를 작은 단위로 상세 브리프화한다.

No code changes.

### First Code Waves After Audit

Suggested order:

1. `createMedia` public wrapper
2. generalized `uploadMedia` public wrapper
3. post/workflow/API import-only migration
4. story video job public wrapper
5. story UI queue public wrapper
6. media index public export cleanup
7. createMedia repository split
8. signed URL storage boundary split

## Wave-002 Result

Status:

Completed

Behavior Changed:

None

Files Changed:

- `docs/refactor-audits/media-import-boundary-audit.md`

Verification:

- `@/modules/media/server` import grep completed
- `@/modules/media/lib` import grep completed
- `@/modules/media/public` import grep completed
- `@/modules/media` index import grep completed
- relative media import grep completed
- `src/modules/media/index.ts` export review completed
- server direct import callers classified
- lib direct import callers classified
- public boundary callers classified
- no code files changed
- refactor progress not changed

Issues:

- `media/server` direct imports remain in app API, post use-case, workflow, story API, story worker
- `media/lib` direct imports remain in story UI and story API route
- `media/index.ts` still exports server internals
- public wrapper cleanup must happen before index export cleanup

