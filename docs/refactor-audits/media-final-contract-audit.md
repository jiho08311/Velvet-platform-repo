# Media Final Contract Audit

## Purpose

media domain Code Architecture Migration 종료 조건을 기준으로 import boundary, DB access, storage access, public contract를 최종 점검한다.

이 문서는 DB schema / RLS / storage policy / runtime behavior를 변경하지 않고, 남은 debt와 후속 wave 범위를 확정하기 위한 감사 문서다.

---

## Scope

Read only audit 대상:

- `src/modules/media/**`
- `src/app/**`
- `src/modules/**`
- `src/workflows/**`
- `docs/refactor-audits/**`

---

## Rules Applied

- DB schema 변경 없음
- RLS policy 변경 없음
- SQL migration 실행 없음
- table/column rename 없음
- function/trigger 변경 없음
- storage bucket/policy 변경 없음
- auth/payment/subscription flow 변경 없음
- UI copy/layout 변경 없음
- return shape 변경 없음
- permission behavior 변경 없음
- error behavior 변경 없음
- refactor progress 문서 변경 없음

---

## Source Audits Reviewed

- `docs/refactor-audits/media-critical-flow-audit.md`
- `docs/refactor-audits/media-import-boundary-audit.md`
- `docs/refactor-audits/media-db-storage-access-audit.md`
- `docs/refactor-audits/media-message-boundary-audit.md`
- `docs/refactor-audits/media-read-model-boundary-audit.md`

No `media-story-upload-boundary-audit.md` file exists in the current worktree.

---

## Latest Grep Summary

### External media server/lib imports

Command:

```txt
rg -n "@/modules/media/server|@/modules/media/lib" src/app src/modules src/workflows -g '!src/modules/media/**'
```

Result:

- 0 external direct imports.

Interpretation:

- app / api / cross-domain callers no longer import media `server` or `lib` directly.
- Remaining media `server` / `lib` imports are inside `src/modules/media/**` public compatibility wrappers and internal services.
- This is acceptable under old + new coexistence until all public wrappers are fully decomposed.

---

## Public Contract Audit

`src/modules/media/index.ts` currently exports only:

- `./types`
- `./public/create-media-signed-url`
- `./public/upload-media`
- `./public/upload-media-file`
- `./public/upload-story-media-file`
- `./public/create-media`
- `./public/create-post-authoring-media`
- `./public/process-story-video-job`
- `./public/story-video-processor-contract`

Findings:

- No `server/*` export remains in the media barrel.
- No `repositories/*` export remains in the media barrel.
- Public wrapper coverage exists for create/upload/signed URL/story upload/story video processor.

Contract gap:

- Story video job queue and worker public files exist, but not all are exported from `src/modules/media/index.ts`.
- Current callers import direct public paths, so this is not a runtime blocker.
- Future cleanup can decide whether the barrel should expose all public entrypoints or remain explicit-path only.

---

## DB Access Audit

### Allowed media DB access inside media repositories

Direct `from("media")` exists in:

- `src/modules/media/repositories/media-read-repository.ts`
- `src/modules/media/repositories/media-repository.ts`
- `src/modules/media/repositories/message-media-repository.ts`
- `src/modules/media/repositories/media-moderation-repository.ts`

Interpretation:

- These are expected repository-layer DB access points.

### Remaining media DB access outside media repositories

Direct `from("media")` remains in:

- `src/modules/search/server/get-explore-posts.ts`
- `src/modules/post/repositories/post-feed-repository.ts`
- `src/modules/post/repositories/post-media-repository.ts`

Classification:

- `search/server/get-explore-posts.ts`: media-domain close blocker. Explore media read should move to media read repository or a search-specific public media read boundary in the next implementation wave.
- `post/repositories/post-feed-repository.ts`: post-domain repository debt. It is already inside a repository, but strict domain isolation says cross-domain media table reads should eventually be routed through media public/repository boundary.
- `post/repositories/post-media-repository.ts`: post-domain repository debt. It is coupled to post authoring/media relation and should be handled in a later post/media contract wave, not in immediate media close.

---

## Storage Access Audit

### Allowed storage access inside media storage repositories

Storage access exists in:

- `src/modules/media/repositories/media-storage-repository.ts`
- `src/modules/media/repositories/story-video-storage-repository.ts`

Interpretation:

- These are expected storage repository-layer access points.

### Remaining storage access outside media storage repositories

Direct storage access remains in:

- `src/modules/message/server/send-message.ts`
- `src/modules/feed/ui/FeedComposer.tsx`
- `src/app/profile/edit/page.tsx`

Classification:

- `message/server/send-message.ts`: media/message boundary blocker. Image moderation still downloads from storage directly. Move only the download operation to a media storage boundary while preserving OpenAI moderation behavior.
- `feed/ui/FeedComposer.tsx`: feed/post authoring debt. Browser upload remains outside media public boundary and should be handled in a dedicated feed composer upload wave.
- `app/profile/edit/page.tsx`: profile/avatar debt. Uses `avatars` bucket and public URL behavior, so it should be handled in profile/avatar domain work, not media close.

---

## Cross-domain Repository Import Audit

Direct `@/modules/media/repositories/*` imports remain outside media domain in:

- `src/workflows/process-video-moderation.ts`
- `src/modules/feed/server/get-home-feed.ts`
- `src/modules/message/server/list-messages.ts`
- `src/modules/message/server/send-message.ts`
- `src/modules/message/server/assert-message-attachment-eligibility.ts`
- `src/modules/message/server/get-secure-message-media.ts`
- `src/modules/creator/server/get-creator-page.ts`

Classification:

- These are not app/ui server/lib leaks, but they still violate the final public-only domain boundary goal.
- They are acceptable temporary old + new coexistence debt only if explicitly tracked.
- Follow-up waves should add media public/use-case wrappers for read, message media, and moderation operations.

---

## Production Flow Checklist

### Create media

- Public wrapper exists.
- DB insert moved to media repository.
- Behavior expected unchanged.

### Upload media

- Public upload wrappers exist.
- Storage upload moved to media storage repository.
- Story upload boundary exists and story UI direct storage upload is removed.

### Signed URL

- Public signed URL entrypoint exists.
- Storage signed URL moved to media storage repository.
- Access decision moved to media access policy.

### Secure post media

- Media lookup moved to media repository.
- Signed URL mapping uses public signed URL boundary.

### Message media

- Media DB access moved to `message-media-repository`.
- Remaining blocker: image moderation storage download is still direct in message server.

### Story video job

- API/worker imports use media public boundaries.
- DB/RPC access moved to story video repositories.
- Storage access moved to story video storage repository.

### Video moderation

- Media status writes and storage download use media repositories.
- Remaining blocker: workflow imports media repositories directly rather than media public/use-case boundary.

### Feed / creator media read

- Feed and creator media reads use `media-read-repository`.
- Remaining blocker: feed/creator server imports media repository directly rather than media public boundary.

### Search explore media read

- Remaining blocker: search explore still directly queries `media`.

---

## Close Decision

Media domain is not fully closed under the strict final goal yet.

It is close enough to proceed with targeted close-out waves because the highest-risk production flows have been moved behind public/repository/storage boundaries without behavior changes.

Required before declaring media closed:

1. Remove `search/server/get-explore-posts.ts` direct media DB access.
2. Move `message/server/send-message.ts` image moderation storage download behind media storage boundary.
3. Decide and implement public wrappers for cross-domain media repository imports.
4. Classify feed composer upload as feed/post authoring boundary work or move it behind media upload boundary.
5. Classify profile avatar upload as profile/avatar domain debt, not media close blocker.

---

## Verification

- External media `server/lib` direct import grep: passed.
- Media barrel server export grep: passed.
- Media DB access repository-only: partial, blockers recorded.
- Media storage access boundary-only: partial, blockers recorded.
- Typecheck: passed with `npm run typecheck -- --incremental false`.
- Build: passed with `npm run build` after sandbox port-binding failure was rerun with approval.

---

## Result

wave-024A/B audit complete.

Media domain should continue with targeted close-out waves instead of being marked fully complete now.
