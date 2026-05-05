# Media Repository Direct Import Audit

## Purpose

media domain close-out 전에 feed, creator, search, message, workflow에서 media repository를 직접 import하는 지점을 확인하고 public/use-case boundary 전환 순서를 확정한다.

이 문서는 runtime behavior를 바꾸기 위한 문서가 아니라, repository 직접 의존을 public contract 뒤로 가두기 위한 위험 지도다.

## Rules Applied

- DB schema 변경 없음
- RLS policy 변경 없음
- SQL migration 실행 없음
- table/column rename 없음
- function/trigger 변경 없음
- storage bucket/policy 변경 없음
- payment/auth/subscription flow 변경 없음
- UI copy/layout 변경 없음
- return shape 변경 없음
- permission behavior 변경 없음
- error behavior 변경 없음
- refactor-progress 문서 변경 없음

## Scope

Read only:

- `docs/refactor-audits/media-final-contract-audit.md`
- `src/modules/feed/server/get-home-feed.ts`
- `src/modules/search/server/get-explore-posts.ts`
- `src/modules/creator/server/get-creator-page.ts`
- `src/modules/message/server/list-messages.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/assert-message-attachment-eligibility.ts`
- `src/modules/message/server/get-secure-message-media.ts`
- `src/workflows/process-video-moderation.ts`
- `src/modules/media/repositories/**`
- `src/modules/media/public/**`

New:

- `docs/refactor-audits/media-repository-direct-import-audit.md`

## Latest Grep

Command:

```txt
rg -n "@/modules/media/repositories" src/app src/modules src/workflows -g '!src/modules/media/**'
```

Result:

```txt
src/workflows/process-video-moderation.ts:13:} from "@/modules/media/repositories/media-storage-repository"
src/workflows/process-video-moderation.ts:20:} from "@/modules/media/repositories/media-moderation-repository"
src/modules/search/server/get-explore-posts.ts:6:} from "@/modules/media/repositories/media-read-repository"
src/modules/feed/server/get-home-feed.ts:25:} from "@/modules/media/repositories/media-read-repository"
src/modules/message/server/list-messages.ts:14:} from "@/modules/media/repositories/message-media-repository"
src/modules/message/server/send-message.ts:11:} from "@/modules/media/repositories/message-media-repository"
src/modules/message/server/send-message.ts:12:import { downloadMediaStorageFile } from "@/modules/media/repositories/media-storage-repository"
src/modules/message/server/assert-message-attachment-eligibility.ts:3:} from "@/modules/media/repositories/message-media-repository"
src/modules/message/server/get-secure-message-media.ts:9:} from "@/modules/media/repositories/message-media-repository"
src/modules/creator/server/get-creator-page.ts:27:} from "@/modules/media/repositories/media-read-repository"
```

## Current State

External media server/lib direct import는 이미 정리된 상태다. 남은 close-out debt는 external domain에서 media repository를 직접 import하는 구조다.

현재 상태는 old + new coexistence 단계로는 동작 가능하지만, final public-only boundary 목표 기준으로는 아직 닫히지 않았다.

Note: `media-final-contract-audit.md`에는 later waves 이전의 stale classification이 일부 남아 있다. search, message, feed storage 관련 direct DB/storage blocker는 이후 wave에서 repository/public boundary로 이동되었고, 현재 핵심 blocker는 external repository direct import다.

## Import Classification

### 1. Feed Read Model

File:

- `src/modules/feed/server/get-home-feed.ts`

Direct import:

- `findReadyPostMediaRowsByPostIds`
- `ReadyPostMediaRow`

Current contract:

- input: published post ids
- output: ready post media rows
- caller-owned behavior: `mediaMap` construction, `slice(0, 3)`, signed URL mapping, media type fallback, final response shape

Risk:

- Medium
- Read-only
- Safe first implementation candidate

Public wrapper candidate:

- `src/modules/media/public/get-ready-post-media.ts`
- `src/modules/media/use-cases/get-ready-post-media.ts`

Recommended API:

- `getReadyPostMediaRowsByPostIds(postIds: string[]): Promise<ReadyPostMediaRow[]>`

Must preserve:

- selected columns
- empty UUID fallback behavior
- `status = ready`
- `sort_order` ascending
- error throw behavior
- row type shape

### 2. Creator Page Read Model

File:

- `src/modules/creator/server/get-creator-page.ts`

Direct import:

- `findReadyPostMediaRowsByPostIds`
- `ReadyPostMediaRow`

Current contract:

- input: visible creator page post ids
- output: ready post media rows
- caller-owned behavior: `mediaMap` construction, locked preview `slice(0, 1)`, unlocked full media list, `allowPreview` signed URL input, final response shape

Risk:

- Medium to High
- Read-only
- Connected to creator page visibility and post access behavior

Public wrapper candidate:

- same wrapper as feed read model

Recommended API:

- `getReadyPostMediaRowsByPostIds(postIds: string[]): Promise<ReadyPostMediaRow[]>`

Must preserve:

- creator page locked preview behavior
- creator page unlocked media behavior
- signed URL input shape
- response shape
- error behavior

### 3. Search Explore Read Model

File:

- `src/modules/search/server/get-explore-posts.ts`

Direct import:

- `findReadyExplorePostMediaRowsByPostIds`
- `ReadyExplorePostMediaRow`

Current contract:

- input: visible or filtered explore post ids
- output: ready image/video media rows
- caller-owned behavior: `mediaMap`, `firstMediaMap`, `postsWithMedia` filtering, discovery exposure rules, signed URL mapping

Risk:

- High
- Read-only but search visibility depends on media existence
- Should stay separate from feed/creator wrapper

Public wrapper candidate:

- `src/modules/media/public/get-ready-explore-post-media.ts`
- `src/modules/media/use-cases/get-ready-explore-post-media.ts`

Recommended API:

- `getReadyExplorePostMediaRowsByPostIds(postIds: string[]): Promise<ReadyExplorePostMediaRow[]>`

Must preserve:

- selected columns
- `post_id in postIds`
- `type in ["image", "video"]`
- `status = ready`
- `sort_order` ascending
- error throw behavior
- `postsWithMedia` filtering behavior in caller

### 4. Message List And Secure Read

Files:

- `src/modules/message/server/list-messages.ts`
- `src/modules/message/server/get-secure-message-media.ts`

Direct imports:

- `findMessageMediaRowsByMessageIds`
- `findMessageMediaRowsByMessageIdOrEmpty`

Current contract:

- list flow throws on repository error
- secure media flow returns empty array on repository error/null data path
- caller owns conversation access, recipient/viewer context, and signed URL mapping through `createConversationMessageMediaMap`

Risk:

- Medium
- Read-only
- Good implementation candidate before message write flows

Public wrapper candidate:

- `src/modules/media/public/get-message-media.ts`
- `src/modules/media/use-cases/get-message-media.ts`

Recommended APIs:

- `getMessageMediaRowsByMessageIds(messageIds: string[]): Promise<MessageMediaRow[]>`
- `getMessageMediaRowsByMessageIdOrEmpty(messageId: string): Promise<MessageMediaRow[]>`

Must preserve:

- selected columns
- `created_at` ascending order
- list flow throw behavior
- secure flow empty array behavior
- signed URL mapping input
- response shape

### 5. Message Attachment Eligibility Read

File:

- `src/modules/message/server/assert-message-attachment-eligibility.ts`

Direct import:

- `findMessageAttachmentEligibilityRowsByIds`

Current contract:

- media row read only
- message domain owns permission checks and exact error behavior
- media domain should only provide row access boundary

Risk:

- High
- Permission behavior is message-owned and must not move into media during this boundary wave

Public wrapper candidate:

- `src/modules/media/public/get-message-attachment-media.ts`
- `src/modules/media/use-cases/get-message-attachment-media.ts`

Recommended API:

- `getMessageAttachmentEligibilityRowsByIds(mediaIds: string[]): Promise<MessageAttachmentEligibilityRow[]>`

Must preserve:

- selected columns
- empty id fallback behavior
- error throw behavior
- all permission checks in message domain
- all existing error messages in message domain

### 6. Message Send Moderation, Attach Write, And Response Read

File:

- `src/modules/message/server/send-message.ts`

Direct imports:

- `findModerationMediaRowsByIds`
- `attachMediaRowsToMessage`
- `findMessageMediaRowsByMessageId`
- `downloadMediaStorageFile`

Current contract:

- moderation read happens before OpenAI image moderation
- storage download returns `ArrayBuffer`
- `downloadMediaStorageFile` is called with `missingDataErrorMessage: "Failed to load image for moderation"`
- attach write happens after message insert
- response read happens after attach write
- notification and message response behavior remain message-owned

Risk:

- High
- Send flow combines moderation, media attach write, response read, notification side effect, and exact error behavior

Public wrapper candidates:

- `src/modules/media/public/get-message-moderation-media.ts`
- `src/modules/media/use-cases/get-message-moderation-media.ts`
- `src/modules/media/public/download-message-moderation-media.ts`
- `src/modules/media/use-cases/download-message-moderation-media.ts`
- `src/modules/media/public/attach-message-media.ts`
- `src/modules/media/use-cases/attach-message-media.ts`
- reuse `get-message-media` for response read

Recommended APIs:

- `getMessageModerationMediaRowsByIds(mediaIds: string[]): Promise<ModerationMediaRow[]>`
- `downloadMessageModerationMediaFile(storagePath: string): Promise<ArrayBuffer>`
- `attachMediaRowsToMessage({ mediaIds, messageId }): Promise<AttachedMessageMediaRow[]>`
- `getMessageMediaRowsByMessageId(messageId: string): Promise<MessageMediaRow[]>`

Must preserve:

- OpenAI moderation model/input behavior
- `TEXT_BLOCKED`
- `IMAGE_BLOCKED`
- `Failed to load image for moderation`
- `Failed to moderate image`
- `Failed to attach media to message`
- attach timing after message insert
- response read order
- notification behavior

### 7. Video Moderation Workflow

File:

- `src/workflows/process-video-moderation.ts`

Direct imports:

- `downloadMediaStorageFile`
- `markMediaApprovedForModeration`
- `markMediaRejectedForModeration`
- `markMediaNeedsReviewForModeration`
- `findMediaModerationStatusesByPostId`

Current contract:

- storage download provides video file bytes
- media moderation status updates preserve status, processing_status, moderation_status, moderation_summary, moderation_completed_at
- final moderation statuses are read before resolving post moderation outcome
- workflow owns ffmpeg, OpenAI moderation, fallback outcome, and `finalizeVideoModerationPost` ordering

Risk:

- Critical
- Connected to video moderation and post finalization
- Should be migrated after lower-risk read/message boundaries

Public wrapper candidate:

- `src/modules/media/public/video-moderation-media.ts`
- `src/modules/media/use-cases/video-moderation-media.ts`

Recommended APIs:

- `downloadVideoModerationMediaFile(storagePath: string): Promise<ArrayBuffer>`
- `markVideoModerationMediaApproved(mediaId, summary): Promise<void>`
- `markVideoModerationMediaRejected(mediaId, summary): Promise<void>`
- `markVideoModerationMediaNeedsReview(mediaId, summary): Promise<void>`
- `getMediaModerationStatusesByPostId(postId: string): Promise<string[]>`

Must preserve:

- storage bucket fallback
- storage missing data error behavior
- moderation_summary shape
- moderation_completed_at behavior
- status and processing_status values
- moderation_status values
- fallback outcome behavior
- `finalizeVideoModerationPost` call order
- workflow return shape and error behavior

## Recommended Implementation Order

1. wave-032B - ready post media read public/use-case boundary
2. wave-032C - feed/creator migration to ready post media public boundary
3. wave-032D - search explore media read public/use-case boundary
4. wave-032E - search migration to explore media public boundary
5. wave-033A - message media read public/use-case boundary
6. wave-033B - list/get-secure-message-media migration
7. wave-034A - message attachment eligibility read public/use-case boundary
8. wave-034B - assert-message-attachment-eligibility migration
9. wave-035A - message moderation media read and storage download public/use-case boundary
10. wave-035B - send-message moderation import migration
11. wave-036A - message attach write public/use-case boundary
12. wave-036B - send-message attach/response read migration
13. wave-037A - video moderation media public/use-case boundary
14. wave-037B - process-video-moderation migration
15. wave-038 - final media repository direct import grep and close decision

## Verification Plan

For each implementation wave:

- run targeted grep for the migrated file
- confirm no caller import from `@/modules/media/repositories`
- confirm caller imports only media public boundary where applicable
- confirm public wrapper preserves function name, return shape, and error behavior
- run `npm run typecheck -- --incremental false`
- run `npm run build`

Final close-out grep:

```txt
rg -n "@/modules/media/repositories" src/app src/modules src/workflows -g '!src/modules/media/**'
```

Expected final result:

```txt
No matches.
```

## Issues

- External repository direct import remains in feed, creator, search, message, and video moderation workflow.
- `media-final-contract-audit.md` has stale direct DB/storage classifications after later waves.
- Media internal public/use-case imports to repositories are expected and are not external boundary blockers for this brief.
- `src/modules/media/public/create-media-signed-url.ts` still has internal media repository dependency. This is internal layering debt, not the external repository direct import blocker covered by this brief.

## Result

Success - implementation plan only. No runtime architecture change.
