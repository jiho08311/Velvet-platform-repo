# Media DB / Storage Access Audit

## Purpose

media domain 및 cross-domain에 남아 있는 media 관련 DB/storage 직접 접근을 감사하고, repository / storage-repository / public boundary 후보로 분류한다.

이 문서는 코드 변경 전 위험 지도를 확정하기 위한 read-only audit이다.

## Scope

Read only:

- `src/modules/media/**`
- `src/app/**`
- `src/modules/**`
- `src/workflows/**`

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

- `media`, `story_video_jobs`, `stories`, `creators` DB access grep
- `claim_story_video_job` RPC grep
- Supabase storage API grep
- `media_id`, `post_id`, `message_id`, `storage_path` usage grep
- media upload source review
- signed URL source review
- story video storage source review
- video moderation source review
- message media source review
- feed/search/creator media read source review

## DB Access Summary

### Media Domain Direct DB Access

Files:

- `src/modules/media/server/create-media.ts`
- `src/modules/media/server/get-secure-post-media.ts`
- `src/modules/media/server/story-video-job.service.ts`

Tables / RPC:

- `media`
- `creators`
- `story_video_jobs`
- `claim_story_video_job`

Risk:

Critical

Notes:

- `create-media.ts` owns media row creation and moderation initial state.
- `get-secure-post-media.ts` owns secure post media lookup.
- `story-video-job.service.ts` owns story video job lifecycle and claim RPC.

### Cross-Domain Media Table Access

Files:

- `src/workflows/process-video-moderation.ts`
- `src/modules/message/server/list-messages.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/assert-message-attachment-eligibility.ts`
- `src/modules/message/server/get-secure-message-media.ts`
- `src/modules/search/server/get-explore-posts.ts`
- `src/modules/feed/server/get-home-feed.ts`
- `src/modules/creator/server/get-creator-page.ts`
- `src/modules/post/repositories/post-media-repository.ts`
- `src/modules/post/repositories/post-feed-repository.ts`

Risk:

High / Critical depending on flow.

Notes:

- message media access and attachment are critical.
- moderation updates are critical.
- feed/search/creator read model access is high risk but read-only.
- post repositories are accepted old + new coexistence for now.

## Storage Access Summary

### Media Domain Storage Access

Files:

- `src/modules/media/server/upload-media.ts`
- `src/modules/media/public/create-media-signed-url.ts`
- `src/modules/media/server/story-video-storage.service.ts`

Buckets:

- `media`
- `media-temp`

Operations:

- upload
- download
- remove
- createSignedUrl

Risk:

Critical

### Cross-Domain Storage Access

Files:

- `src/workflows/process-video-moderation.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/story/ui/EditStoryModal.tsx`
- `src/modules/story/ui/CreateStoryComposer.tsx`
- `src/app/profile/edit/page.tsx`
- `src/modules/feed/ui/FeedComposer.tsx`

Buckets:

- `media`
- `avatars`

Operations:

- upload
- download
- getPublicUrl

Risk:

High / Critical depending on flow.

Notes:

- message image moderation downloads message attachments from storage.
- video moderation downloads post video from storage.
- story UI directly uploads image/non-trimmed story media.
- profile edit directly uploads avatar and gets public URL.
- feed composer directly uploads media.

## Flow Classification

### 1. Media Row Creation

Current file:

- `src/modules/media/server/create-media.ts`

Direct access:

- `supabaseAdmin.from("media").insert(...).select(...).single()`

Responsibilities:

- validate storagePath
- set `post_id`
- set `message_id`
- set `owner_user_id`
- set `type`
- set `storage_path`
- set `mime_type`
- set `sort_order`
- set `status`
- set initial moderation fields
- return `Media` domain shape

Repository candidate:

- `media-repository.ts`

Suggested functions:

- `insertMediaRow`

Mapper candidate:

- `media-mapper.ts`

Suggested functions:

- `mapMediaRowToMedia`
- `buildCreateMediaInsertPayload`

Risk:

High

Do Not Change:

- insert payload fields
- selected columns
- initial moderation state
- return shape
- error throw behavior

### 2. Raw Media Upload

Current file:

- `src/modules/media/server/upload-media.ts`

Direct access:

- `supabaseAdmin.storage.from(MEDIA_BUCKET).upload(...)`

Responsibilities:

- validate uploaderUserId
- validate File
- validate non-empty file
- build storage path by purpose
- upload file
- return storage path

Storage repository candidate:

- `media-storage-repository.ts`

Suggested functions:

- `uploadMediaFile`

Service candidate:

- `media-storage-path-service.ts`

Suggested functions:

- `buildMediaStoragePath`
- `resolveMediaBucket`

Risk:

High

Do Not Change:

- path format
- default purpose
- `message` purpose path
- `post` purpose path
- bucket fallback
- `cacheControl`
- `contentType`
- `upsert`
- error throw behavior

### 3. Signed URL Creation

Current file:

- `src/modules/media/public/create-media-signed-url.ts`

Direct access:

- `supabaseAdmin.storage.from(MEDIA_BUCKET).createSignedUrl(...)`

Responsibilities:

- trim storage path
- owner access check
- post visibility/access fallback
- allowPreview behavior
- signed URL creation
- empty string fallback on denied/error

Storage repository candidate:

- `media-storage-repository.ts`

Policy candidate:

- `media-access-policy.ts`

Suggested functions:

- `createMediaStorageSignedUrl`
- `canCreateMediaSignedUrl`

Risk:

Critical

Do Not Change:

- default expiration
- empty storagePath behavior
- denied access empty string behavior
- storage error empty string behavior
- owner access behavior
- `allowPreview` behavior
- post access fallback behavior

### 4. Secure Post Media

Current file:

- `src/modules/media/server/get-secure-post-media.ts`

Direct access:

- `supabaseAdmin.from("media").select(...).eq("post_id", postId).eq("status", "ready")`

Responsibilities:

- get post by id
- return empty array if post missing
- return empty array if locked
- read ready media rows
- sign each media URL
- return secure media shape

Repository candidate:

- `media-repository.ts`

Suggested functions:

- `findReadyMediaRowsByPostId`

Risk:

Critical

Do Not Change:

- locked post empty array behavior
- ready status filter
- media ordering
- signed URL input
- return shape

### 5. Story Video Jobs

Current file:

- `src/modules/media/server/story-video-job.service.ts`

Direct access:

- `createClient` service role client
- `from("creators")`
- `from("story_video_jobs")`
- `rpc("claim_story_video_job")`

Responsibilities:

- creator lookup by user id
- insert story video job
- claim job
- update completed
- update failed
- get polling row
- create final story as side effect
- remove temp storage after enqueue failure

Repository candidates:

- `story-video-job-repository.ts`
- `story-video-creator-repository.ts`

Storage candidate:

- `story-video-storage-repository.ts`

Suggested functions:

- `findCreatorIdByUserIdForStoryVideoJob`
- `insertStoryVideoJob`
- `claimStoryVideoJob`
- `updateStoryVideoJobCompleted`
- `updateStoryVideoJobFailed`
- `findStoryVideoJobPollRowForCreator`

Risk:

Critical

Do Not Change:

- `story_video_jobs` schema
- claim RPC
- status values
- attempts / locked behavior
- poll response shape
- story creation side effect
- temp cleanup behavior

### 6. Story Video Storage

Current file:

- `src/modules/media/server/story-video-storage.service.ts`

Direct access:

- service role storage upload
- service role storage download
- service role storage remove

Buckets:

- `media`
- `media-temp`

Responsibilities:

- upload temp video
- download temp video
- upload processed video
- remove temp video
- build story video storage path

Storage repository candidate:

- `story-video-storage-repository.ts`

Service candidate:

- `story-video-storage-path-service.ts`

Risk:

Critical

Do Not Change:

- `STORIES_BUCKET` fallback
- `STORIES_TEMP_BUCKET` fallback
- temp storage path format
- processed storage path format
- contentType fallback
- remove behavior
- thrown error messages where observable

### 7. Video Moderation Media Access

Current file:

- `src/workflows/process-video-moderation.ts`

Direct access:

- storage download from media bucket
- `media` update approved
- `media` update rejected
- `media` update needs_review
- `media` moderation_status read by post_id

Repository candidates:

- `media-moderation-repository.ts`
- or `media-repository.ts` with moderation-specific functions

Storage candidate:

- `media-storage-repository.ts`

Suggested functions:

- `downloadMediaStorageFile`
- `markMediaApproved`
- `markMediaRejected`
- `markMediaNeedsReview`
- `findMediaModerationStatusesByPostId`

Risk:

Critical

Do Not Change:

- status transition values
- moderation_summary shape
- moderation_completed_at behavior
- storage download behavior
- fallback outcome behavior
- post moderation finalization order

### 8. Message Media Attach / Access

Current files:

- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/assert-message-attachment-eligibility.ts`
- `src/modules/message/server/list-messages.ts`
- `src/modules/message/server/get-secure-message-media.ts`

Direct access:

- `media` read by ids
- storage download for image moderation
- `media` update message_id
- `media` read by message_id
- `media` read by message ids

Repository candidates:

- `message-media-repository.ts`
- or media-owned `media-message-repository.ts`

Storage candidate:

- `media-storage-repository.ts`

Suggested functions:

- `findMediaRowsForMessageAttachmentEligibility`
- `findMessageMediaRowsByMessageIds`
- `findMessageMediaRowsByMessageId`
- `attachMediaRowsToMessage`
- `findModerationMediaRowsByIds`
- `downloadMediaStorageFile`

Risk:

Critical

Do Not Change:

- attachment eligibility errors
- owner check
- post_id/message_id rejection
- status/processing/moderation checks
- message_id attach timing
- image moderation behavior
- message response media shape
- signed URL map behavior

### 9. Feed / Search / Creator Media Read Models

Current files:

- `src/modules/feed/server/get-home-feed.ts`
- `src/modules/search/server/get-explore-posts.ts`
- `src/modules/creator/server/get-creator-page.ts`

Direct access:

- `media` read by post ids
- ready status filter
- image/video filter in search
- sort_order ordering
- signed URL mapping through media public boundary

Repository candidates:

- `media-read-repository.ts`
- or domain-specific read repositories

Suggested functions:

- `findReadyPostMediaRowsByPostIds`
- `findReadyExploreMediaRowsByPostIds`

Risk:

High

Do Not Change:

- ready status filter
- image/video filter
- ordering
- fallback empty behavior
- feed/search/creator item shape
- signed URL inputs

### 10. Avatar / Profile Storage

Current file:

- `src/app/profile/edit/page.tsx`

Direct access:

- avatars storage upload
- avatars public URL

Storage boundary candidates:

- profile-owned storage service
- or media-owned avatar storage public boundary

Risk:

High

Do Not Change:

- avatars bucket
- public URL behavior
- upload path format
- profile update behavior

Notes:

- This may belong to profile domain rather than media domain.
- Do not include in early media code waves unless explicitly scoped.

### 11. Story Image / Non-Trim Video Storage

Current files:

- `src/modules/story/ui/CreateStoryComposer.tsx`
- `src/modules/story/ui/EditStoryModal.tsx`

Direct access:

- browser storage upload to media bucket

Boundary candidates:

- story-owned public upload boundary
- media-owned story media upload boundary

Risk:

High

Do Not Change:

- story storage path format
- upload options
- create story API request shape
- edit story behavior

Notes:

- Story video trim flow already uses job API.
- Non-trim story upload still bypasses media public boundary.

## Repository / Storage Boundary Candidate List

### Repositories

- `media-repository.ts`
- `media-moderation-repository.ts`
- `media-read-repository.ts`
- `message-media-repository.ts`
- `story-video-job-repository.ts`
- `story-video-creator-repository.ts`

### Storage Repositories / Services

- `media-storage-repository.ts`
- `story-video-storage-repository.ts`
- `media-storage-path-service.ts`
- `story-video-storage-path-service.ts`

### Policies / Mappers

- `media-access-policy.ts`
- `media-mapper.ts`
- `secure-media-mapper.ts`
- `story-video-job-mapper.ts`

## Safe Refactor Order Recommendation

### Audit / Brief Phase

1. wave-001 - media critical flow audit
2. wave-002 - media import boundary audit
3. wave-003 - media DB/storage direct access audit
4. wave-004 - media detailed refactor brief generation

### First Code Phase

1. add createMedia public boundary
2. add generalized uploadMedia public boundary
3. migrate app/api/media and post/workflow imports to public
4. media index public export cleanup
5. createMedia repository split
6. uploadMedia storage repository split
7. signed URL storage boundary split
8. secure post media repository split
9. story video job public boundary
10. story video job repository split
11. message media boundary audit / extraction

## Do Not Change Until Dedicated Wave

- DB schema
- RLS policies
- SQL migrations
- storage bucket names
- storage path formats
- signed URL expiration
- signed URL empty fallback
- media upload response shape
- message media response shape
- story video job poll response shape
- story video claim RPC
- moderation status values
- media status values
- avatar public URL behavior
- feed/search/creator read model ordering

## Wave-003 Result

Status:

Completed

Behavior Changed:

None

Files Changed:

- `docs/refactor-audits/media-db-storage-access-audit.md`

Verification:

- media DB access grep completed
- story_video_jobs DB access grep completed
- claim_story_video_job RPC grep completed
- storage API grep completed
- media row field usage grep completed
- media upload source reviewed
- signed URL source reviewed
- story video storage source reviewed
- video moderation source reviewed
- message media source reviewed
- feed/search/creator media read source reviewed
- repository candidates identified
- storage boundary candidates identified
- no code files changed
- refactor progress not changed

Issues:

- media table access is spread across media, message, feed, search, creator, post repositories, and moderation workflow
- storage access is spread across media, message, story, profile, feed, and moderation workflow
- story video job service combines DB, RPC, storage cleanup, and story creation side effect
- message media attach/access is critical and should not be mixed with early media public wrapper cleanup
- avatar/profile storage may belong to profile domain rather than media domain

