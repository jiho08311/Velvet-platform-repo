# Media Critical Flow Audit

## Purpose

media domain code architecture migration 전에 production flow, direct DB/storage access, cross-domain dependency, refactor risk를 정리한다.

이 문서는 코드 변경을 위한 문서가 아니라, media domain 상세 wave brief를 안전하게 작성하기 위한 감사 문서다.

## Scope

Read only:

- `src/modules/media/**`
- `src/app/api/media/**`
- `src/app/api/upload/media/**`
- `src/app/creator/media/**`
- `src/modules/post/**`
- `src/modules/message/**`
- `src/modules/story/**`
- `src/modules/feed/**`
- `src/modules/search/**`
- `src/modules/creator/**`
- `src/workflows/**`

## Rules Applied

- DB schema 변경 없음
- RLS policy 변경 없음
- SQL migration 실행 없음
- storage bucket/policy 변경 없음
- auth/payment/subscription flow 변경 없음
- UI copy/layout 변경 없음
- return shape 변경 없음
- permission behavior 변경 없음
- error behavior 변경 없음
- 코드 변경 없음

## Commands / Searches Performed

- media file inventory
- media import boundary grep
- Supabase DB direct access grep
- Supabase storage direct access grep
- media table usage grep
- story video job usage grep
- signed URL usage grep
- upload/create media flow source review

## Media Domain File Map

### Public

- `src/modules/media/public/create-media-signed-url.ts`
- `src/modules/media/public/upload-media.ts`

### Server

- `src/modules/media/server/create-media.ts`
- `src/modules/media/server/upload-media.ts`
- `src/modules/media/server/get-secure-post-media.ts`
- `src/modules/media/server/media-mutation-moderation-policy.ts`
- `src/modules/media/server/story-video-job.service.ts`
- `src/modules/media/server/story-video-processor.server.ts`
- `src/modules/media/server/story-video-storage.service.ts`

### Lib

- `src/modules/media/lib/queue-story-video-job.ts`
- `src/modules/media/lib/story-video-job-contract.ts`
- `src/modules/media/lib/story-video-processor-contract.ts`

### UI

- `src/modules/media/ui/StoryVideoTrimField.tsx`

### Types / Index

- `src/modules/media/types.ts`
- `src/modules/media/index.ts`

## Critical Production Flows

### 1. Post Media Upload / Create

Entry points:

- `src/modules/post/ui/CreatePostComposer.tsx`
- `src/modules/media/public/upload-media.ts`
- `src/workflows/create-post-with-media-workflow.ts`
- `src/modules/media/server/upload-media.ts`
- `src/modules/media/server/create-media.ts`

Flow:

```txt
CreatePostComposer
↓
media/public/upload-media
↓
media/server/upload-media
↓
Supabase storage
↓
create-post-with-media-workflow
↓
media/server/create-media
↓
Supabase media table
```

Responsibilities:

- file validation
- upload storage path generation
- storage upload
- media row creation
- post_id relation
- media moderation initial state
- status / processing_status / moderation_status setup

Risk:

High

Do Not Change Now:

- storage path format
- default bucket behavior
- upload cache control
- media row shape
- moderation initial state
- create post workflow order

### 2. Message Media Upload / Attach

Entry points:

- `src/app/api/media/upload/route.ts`
- `src/app/api/upload/media/route.ts`
- `src/modules/media/server/upload-media.ts`
- `src/modules/media/server/create-media.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/get-secure-message-media.ts`
- `src/modules/message/server/create-conversation-message-media.ts`

Flow:

```txt
media upload API
↓
media/server/upload-media
↓
Supabase storage
↓
media/server/create-media
↓
Supabase media table
↓
message send / attach
↓
message media access / signed URL map
```

Responsibilities:

- message upload
- owner_user_id association
- message_id later association
- message attachment moderation
- secure message media signed URL creation

Risk:

Critical

Do Not Change Now:

- upload API response shape
- mediaIds response
- message_id attach timing
- message image moderation behavior
- secure message media access behavior

### 3. Signed URL Creation

Entry points:

- `src/modules/media/public/create-media-signed-url.ts`
- post detail/feed/profile/search/creator callers
- message media map callers
- story callers

Flow:

```txt
domain caller
↓
media/public/create-media-signed-url
↓
post public canViewPost when post visibility input exists
↓
Supabase storage createSignedUrl
```

Responsibilities:

- access decision guard
- owner access
- subscriber / PPV post access passthrough
- preview allowance
- signed URL creation
- empty URL fallback on denied/error

Risk:

Critical

Do Not Change Now:

- expiration default
- allowPreview behavior
- empty string fallback behavior
- post access input contract
- bucket env fallback
- signed URL error swallowing behavior

### 4. Secure Post Media Access

Entry points:

- `src/modules/media/server/get-secure-post-media.ts`
- post/media callers

Flow:

```txt
caller
↓
media/server/get-secure-post-media
↓
post/public/get-post
↓
media table lookup
↓
media/public/create-media-signed-url
```

Responsibilities:

- post existence check
- locked post guard
- ready media lookup
- signed URL mapping

Risk:

Critical

Do Not Change Now:

- locked post empty result behavior
- ready status filter
- media ordering
- returned media item shape

### 5. Story Video Processing

Entry points:

- `src/modules/story/ui/CreateStoryComposer.tsx`
- `src/modules/media/lib/queue-story-video-job.ts`
- `src/modules/media/server/story-video-job.service.ts`
- `src/modules/media/server/story-video-storage.service.ts`
- `src/modules/media/server/story-video-processor.server.ts`
- `src/modules/story/server/story-video-worker.ts`
- `src/app/api/story/video-job/route.ts`
- `src/app/api/story/video-job/[jobId]/route.ts`

Flow:

```txt
story composer
↓
queue story video job
↓
upload temp story video
↓
story_video_jobs insert
↓
worker claim RPC
↓
download temp video
↓
process video
↓
upload processed video
↓
create story
↓
mark job completed / failed
```

Responsibilities:

- temporary storage upload
- story_video_jobs lifecycle
- job claim RPC
- processing result persistence
- final story creation
- temp cleanup

Risk:

Critical

Do Not Change Now:

- story_video_jobs schema
- claim RPC behavior
- temp/final bucket behavior
- job status values
- story creation side effect
- worker contract
- polling response contract

### 6. Avatar / Profile Storage

Entry points:

- `src/app/profile/edit/page.tsx`

Flow:

```txt
profile edit page
↓
Supabase avatars storage upload
↓
getPublicUrl
↓
profile update
```

Responsibilities:

- avatar upload
- public URL creation
- profile avatar_url update

Risk:

High

Do Not Change Now:

- avatars bucket
- public URL behavior
- profile update flow
- auth/profile permission behavior

### 7. Media Moderation / Processing

Entry points:

- `src/workflows/process-video-moderation.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/assert-message-attachment-eligibility.ts`
- `src/modules/media/server/media-mutation-moderation-policy.ts`

Flow:

```txt
media row lookup
↓
storage download
↓
moderation / processor
↓
media status update
```

Responsibilities:

- media moderation state
- image/video safety checks
- storage download for moderation
- media row update

Risk:

Critical

Do Not Change Now:

- moderation status values
- message send blocking behavior
- media processing status behavior
- moderation error behavior
- storage download path behavior

## Direct DB Access Findings

### Media Domain

Direct DB access exists in:

- `src/modules/media/server/create-media.ts`
- `src/modules/media/server/get-secure-post-media.ts`
- `src/modules/media/server/story-video-job.service.ts`

Tables / RPC:

- `media`
- `story_video_jobs`
- `stories` through story creation side effect
- `claim_story_video_job` RPC

### Cross-Domain Media Table Access

Direct `media` table access exists outside media domain in:

- `src/workflows/process-video-moderation.ts`
- `src/modules/message/server/list-messages.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/assert-message-attachment-eligibility.ts`
- `src/modules/message/server/get-secure-message-media.ts`
- `src/modules/creator/server/get-creator-page.ts`
- `src/modules/search/server/get-explore-posts.ts`
- `src/modules/feed/server/get-home-feed.ts`

Post repositories also query media:

- `src/modules/post/repositories/post-media-repository.ts`
- `src/modules/post/repositories/post-feed-repository.ts`

Post repository media access is expected during old + new coexistence, but should be tracked as a boundary dependency.

## Direct Storage Access Findings

Direct storage access exists in:

- `src/modules/media/server/upload-media.ts`
- `src/modules/media/public/create-media-signed-url.ts`
- `src/modules/media/server/story-video-storage.service.ts`
- `src/workflows/process-video-moderation.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/story/ui/EditStoryModal.tsx`
- `src/modules/story/ui/CreateStoryComposer.tsx`
- `src/app/profile/edit/page.tsx`
- `src/modules/feed/ui/FeedComposer.tsx`

Storage buckets observed:

- `media`
- `media-temp`
- `avatars`

## Import Boundary Findings

### Public Boundary Exists

Current public files:

- `media/public/create-media-signed-url.ts`
- `media/public/upload-media.ts`

### Server Direct Imports From Outside Media

Server direct imports exist in:

- `src/workflows/create-post-with-media-workflow.ts`
- `src/app/api/media/upload/route.ts`
- `src/modules/post/use-cases/update-post.ts`
- `src/modules/story/server/story-video-worker.ts`
- `src/app/api/story/video-job/route.ts`
- `src/app/api/story/video-job/[jobId]/route.ts`

### Lib Direct Imports From Outside Media

Lib direct imports exist in:

- `src/modules/story/ui/CreateStoryComposer.tsx`

### Index Export Issue

`src/modules/media/index.ts` currently exports server internals:

- `./server/create-media`
- `./server/upload-media`

This should be cleaned only after public replacements and usage checks exist.

## Risk Summary

### Critical

- signed URL access / empty fallback behavior
- secure post media access
- secure message media access
- story video job lifecycle
- story video storage temp/final handling
- media moderation download/update flow
- message media attach flow

### High

- post media upload/create
- media table direct access from feed/search/creator/message
- avatar storage flow
- media index server exports
- cross-domain server direct imports

### Medium

- media public wrapper expansion
- storage repository extraction
- media type/export cleanup
- audit and contract documentation

## Recommended Media Wave Plan

### wave-001

media critical flow audit

Status:

Completed

Purpose:

production media flows, DB/storage access, import boundary risks를 확인한다.

### wave-002

media import boundary audit

Purpose:

media/server, media/lib, media/public, media/index export 사용처를 전체 grep으로 분류하고 public wrapper 후보를 확정한다.

No code changes.

### wave-003

media DB/storage direct access audit

Purpose:

media table, story_video_jobs, storage bucket 접근을 repository/storage-repository 후보로 분류한다.

No code changes.

### wave-004

media detailed refactor brief generation

Purpose:

wave-005 이후 실행 가능한 작은 상세 브리프를 전체 생성한다.

No code changes.

### wave-005

add createMedia public boundary

Purpose:

`media/server/create-media` 외부 사용처를 public boundary로 전환하기 위한 wrapper를 추가한다.

### wave-006

add uploadMedia public boundary for API/workflow callers

Purpose:

현재 post composer 전용 public upload wrapper와 별개로 API/workflow에서 재사용 가능한 upload boundary를 정리한다.

### wave-007

media index public export cleanup

Purpose:

public replacement 준비 후 `media/index.ts`의 server export를 제거하거나 public export 중심으로 정리한다.

### wave-008

createMedia repository split

Purpose:

`media/server/create-media.ts`의 media insert DB 접근을 media repository로 이동한다.

### wave-009

secure post media repository split

Purpose:

`media/server/get-secure-post-media.ts`의 media lookup을 repository로 이동한다.

### wave-010

signed URL storage repository boundary

Purpose:

`create-media-signed-url.ts`의 storage signed URL 생성을 storage repository/service boundary로 이동한다.

### wave-011

message media boundary audit / wrapper

Purpose:

message domain의 media direct DB/storage 접근을 media public/repository boundary로 전환하기 위한 안전 범위를 확정한다.

### wave-012

story video job public boundary

Purpose:

story API/worker가 media server job service를 직접 import하는 구조를 public boundary로 전환한다.

### wave-013

story video storage repository split

Purpose:

story video temp/final storage access를 storage service/repository boundary 안에 가둔다.

### wave-014

avatar/profile storage boundary audit

Purpose:

avatars bucket flow를 media domain에 포함할지 profile domain에서 유지할지 결정한다.

## Do Not Change Until Later

- storage bucket names
- signed URL expiration
- signed URL empty fallback
- post/media access permission behavior
- message media attach behavior
- story_video_jobs status lifecycle
- story video claim RPC
- story creation side effect
- media moderation status values
- media processing status values
- avatar public URL behavior
- DB schema / RLS / SQL

## Wave-001 Result

Status:

Completed

Behavior Changed:

None

Files Changed:

- `docs/refactor-audits/media-critical-flow-audit.md`

Verification:

- media file inventory completed
- media import boundary grep completed
- DB direct access grep completed
- storage direct access grep completed
- signed URL flow reviewed
- upload/create media flow reviewed
- secure post media flow reviewed
- story video job flow reviewed
- message media flow reviewed
- moderation media flow reviewed
- code changes not made
- DB/RLS/SQL/storage policy changes not made

Issues:

- media server direct imports remain in app/api, post use-case, workflow, story API/worker
- media lib direct import remains in story UI
- media index exports server internals
- media table direct access exists outside media domain
- storage direct access exists outside media domain
- story video flow is critical and should be isolated later with very small waves

