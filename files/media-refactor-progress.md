# Refactor Progress

## Purpose

이 문서는 전체 코드 아키텍처 개편의 현재 진행 상태를 기록한다.

`project-baseline.md`와 `db-architecture-audit.md`는 기준 문서이고,  
이 문서는 매 wave 완료 후 계속 업데이트하는 작업 일지다.
Global Status

Current Phase
Phase 2 - Code Architecture Migration

DB Migration Phase
Not Started

Current Domain
media

Current Wave
wave-035

Next
wave-036

Last Updated
2026-05-05

Global Rules Reminder
DB schema 변경 금지
RLS policy 변경 금지
SQL migration 실행 금지
table/column rename 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
payment/auth flow 변경 금지
old + new 공존 허용
old 사용처 0개 확인 전 삭제 금지
한 번에 한 도메인
한 번에 한 wave
한 번에 하나의 목적만 수행

Domain Status
2. media

Status

In Progress - wave-035 완료

Completed
post public boundary 정리 완료
app/API/cross-domain direct post internal import 제거 완료
post UI direct post/lib import 제거 완료
post DB access repository 집중 완료
post interactions/comments/likes repository 분리 완료
post detail/feed/create/update/delete 주요 flow 안정화 완료
usage 0 old server/lib 파일 제거 완료
CommentRow contract blocker 해결 완료
typecheck 통과
build 통과
media external repository direct import close-out 완료
feed/creator/search media read repository direct import 제거 완료
message media read/eligibility/send repository direct import 제거 완료
video moderation workflow media repository direct import 제거 완료
external media server/lib/repository direct import 0개 확인
media public/use-case boundary 경유 구조 확인
typecheck 통과
build 통과
wave-034 media moderation/mutation public wrappers already applied 확인 완료
process-video-moderation media repository direct import 0개 재확인
video moderation workflow public/use-case boundary 경유 구조 확인
media public/use-case/repository moderation wrapper 구조 확인
Remaining Non-blocking Debt
일부 public wrapper가 server/lib compatibility layer를 감쌈
일부 service가 compatibility helper에 의존
workflow creator lookup direct DB access는 다음 domain/wave 후보
live browser smoke는 별도 수동 확인 대상
media 내부 public/use-case/server compatibility layer의 repository import 남음
profile avatar storage는 profile/avatar domain debt로 유지
---

## 2. media

### Status

In Progress - wave-33 완료

### Completed

- media/payment deep audit 수행
- post domain refactor 중 media dependency 확인
- createMediaSignedUrl public boundary 필요 확인
- uploadMedia public boundary 필요 확인
- secure media access가 post/message/story와 연결됨 확인
- storage 접근이 server/ui/api에 분산됨 확인
- media signed URL / secure media access가 critical 영역임 확인
- media critical production flow 추출 완료
- media import boundary audit 완료
- media DB/storage direct access audit 완료
- media wave-005 ~ wave-024 상세 브리프 생성 완료

### Key Findings

- media는 infra 성격의 critical domain임
- signed URL은 post, message, story, creator/profile에서 공유됨
- storage 접근은 반드시 repository/service/public boundary 안으로 가둬야 함
- media table / bucket / storage policy 변경은 현재 phase에서 금지
- secure post media access는 post access/visibility와 강하게 연결됨
- message/story media access는 아직 별도 domain 안정화 전이므로 변경 범위 최소화 필요
- 초반 wave는 코드 변경보다 usage audit / public boundary baseline부터 시작해야 함
- story video job flow는 DB/RPC/storage/story creation side effect가 결합된 critical flow임
- message media attach/access는 message domain과 강하게 연결되어 별도 작은 wave 필요
- avatar/profile storage는 media domain에서 직접 수정하지 않고 profile domain 후보로 보류 권장

### Current Recommended Next Waves

- wave-005: createMedia public boundary
- wave-006: uploadMedia public boundary
- wave-007: migrate create/upload media callers to public boundary
- wave-008: media index public export cleanup
- wave-009: createMedia repository split

### Files Identified for Wave 005

- `src/modules/media/server/create-media.ts`
- `src/modules/media/public/**`
- `src/modules/media/index.ts`

### Do Not Touch Yet

- media table schema
- storage bucket structure
- storage policy
- signed URL expiration
- secure media access behavior
- post access / visibility behavior
- message paid media behavior
- story video processing behavior
- payment/auth/subscription flow
- DB schema / RLS / SQL

### Verification Pending

- createMedia public wrapper verification
- createPostAuthoringMedia public wrapper verification
- uploadMedia public wrapper verification
- media index public export cleanup verification
- media repository split verification
- signed URL behavior verification
- secure post media access verification
- message/story media verification

---

## 3. subscription

### Status

Not Started

---

## 4. payment

### Status

Audited - not started

### Key Notes

- core money flow domain
- early refactor 금지
- post/media boundary 안정화 후 public wrapper부터 접근

---

## 5. message

### Status

Not Started

### Key Notes

- media/payment/notification과 연결됨
- paid message flow는 후순위

---

## 6. notification

### Status

Not Started

---

## 7. creator/profile

### Status

Not Started

---

## 8. payout

### Status

Not Started

---

## 9. admin

### Status

Not Started

---

# Wave Log

## wave-001

### Domain

media

### Title

media critical flow audit

### Status

Completed

### Goal

media domain code architecture migration 전에 production flow, direct DB/storage access, cross-domain dependency, refactor risk를 정리한다.

### Target Files

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

New:

- `docs/refactor-audits/media-critical-flow-audit.md`

### Allowed Changes

- audit 문서 생성
- media critical flow 정리
- DB/storage direct access 위치 기록
- import boundary risk 기록
- 다음 wave 후보 기록

### Forbidden Changes

- 코드 변경
- DB schema 변경
- RLS 변경
- SQL 실행
- storage bucket/policy 변경
- auth/payment/subscription flow 변경
- UI copy/layout 변경
- return shape 변경
- permission behavior 변경
- error behavior 변경
- refactor-progress 문서 변경

### Expected Architecture After Wave

```txt
No runtime architecture change.

media critical flow audit
↓
docs/refactor-audits/media-critical-flow-audit.md
Execution
media file inventory 완료
media import boundary grep 완료
Supabase DB direct access grep 완료
Supabase storage direct access grep 완료
media table usage grep 완료
story video job usage grep 완료
signed URL usage grep 완료
upload/create media flow source review 완료
critical production flow 7개 분류 완료
post media upload/create flow 기록 완료
message media upload/attach flow 기록 완료
signed URL creation flow 기록 완료
secure post media access flow 기록 완료
story video processing flow 기록 완료
avatar/profile storage flow 기록 완료
media moderation/processing flow 기록 완료
risk summary 작성 완료
recommended media wave plan 작성 완료

Verification
media file inventory completed
media import boundary grep completed
DB direct access grep completed
storage direct access grep completed
signed URL flow reviewed
upload/create media flow reviewed
secure post media flow reviewed
story video job flow reviewed
message media flow reviewed
moderation media flow reviewed
code changes not made
DB/RLS/SQL/storage policy changes not made

Issues
media server direct imports remain in app/api, post use-case, workflow, story API/worker
media lib direct import remains in story UI
media index exports server internals
media table direct access exists outside media domain
storage direct access exists outside media domain
story video flow is critical and should be isolated later with very small waves

Result
Success

wave-002
Domain
media

Title
media import boundary audit

Status
Completed

Goal
media domain의 외부 import boundary를 감사하여 media/server, media/lib, media/public, media/index.ts 사용처를 분류한다.

Target Files
Read only:

src/modules/media/**
src/app/**
src/modules/**
src/workflows/**
middleware.ts
Dockerfile.worker
New:

docs/refactor-audits/media-import-boundary-audit.md
Allowed Changes
audit 문서 생성
media/server import 사용처 분류
media/lib import 사용처 분류
media/public import 사용처 분류
media/index.ts export risk 기록
public wrapper 후보 기록
Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경
Expected Architecture After Wave
txt

No runtime architecture change.

media import boundary audit
↓
docs/refactor-audits/media-import-boundary-audit.md
Execution
@/modules/media/server import grep 완료
@/modules/media/lib import grep 완료
@/modules/media/public import grep 완료
@/modules/media index import grep 완료
relative media import grep 완료
src/modules/media/index.ts export review 완료
selected caller source review 완료
public boundary usage 분류 완료
server direct import findings 분류 완료
lib direct import findings 분류 완료
index export issue 기록 완료
boundary debt summary 작성 완료
recommended next waves 작성 완료

Verification
@/modules/media/server import grep completed
@/modules/media/lib import grep completed
@/modules/media/public import grep completed
@/modules/media index import grep completed
relative media import grep completed
src/modules/media/index.ts export review completed
server direct import callers classified
lib direct import callers classified
public boundary callers classified
no code files changed
refactor progress not changed

Issues
media/server direct imports remain in app API, post use-case, workflow, story API, story worker
media/lib direct imports remain in story UI and story API route
media/index.ts still exports server internals
public wrapper cleanup must happen before index export cleanup

Result
Success

wave-003
Domain
media

Title
media DB/storage direct access audit

Status
Completed

Goal
media domain 및 cross-domain에 남아 있는 media 관련 DB/storage 직접 접근을 감사하고, repository / storage-repository / public boundary 후보로 분류한다.

Target Files
Read only:

src/modules/media/**
src/app/**
src/modules/**
src/workflows/**
New:

docs/refactor-audits/media-db-storage-access-audit.md
Allowed Changes
audit 문서 생성
media DB direct access 기록
story_video_jobs DB access 기록
storage direct access 기록
repository 후보 기록
storage boundary 후보 기록
Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경
Expected Architecture After Wave
txt

No runtime architecture change.

media DB/storage access audit
↓
docs/refactor-audits/media-db-storage-access-audit.md
Execution
media, story_video_jobs, stories, creators DB access grep 완료
claim_story_video_job RPC grep 완료
Supabase storage API grep 완료
media_id, post_id, message_id, storage_path usage grep 완료
media upload source review 완료
signed URL source review 완료
story video storage source review 완료
video moderation source review 완료
message media source review 완료
feed/search/creator media read source review 완료
DB access summary 작성 완료
storage access summary 작성 완료
flow classification 작성 완료
repository / storage boundary candidate list 작성 완료
safe refactor order recommendation 작성 완료

Verification
media DB access grep completed
story_video_jobs DB access grep completed
claim_story_video_job RPC grep completed
storage API grep completed
media row field usage grep completed
media upload source reviewed
signed URL source reviewed
story video storage source reviewed
video moderation source reviewed
message media source reviewed
feed/search/creator media read source reviewed
repository candidates identified
storage boundary candidates identified
no code files changed
refactor progress not changed

Issues
media table access is spread across media, message, feed, search, creator, post repositories, and moderation workflow
storage access is spread across media, message, story, profile, feed, and moderation workflow
story video job service combines DB, RPC, storage cleanup, and story creation side effect
message media attach/access is critical and should not be mixed with early media public wrapper cleanup
avatar/profile storage may belong to profile domain rather than media domain

Result
Success

wave-004
Domain
media

Title
media detailed refactor brief generation

Status
Completed

Goal
wave-001 critical flow audit, wave-002 import boundary audit, wave-003 DB/storage direct access audit 결과를 기준으로 media code architecture migration 상세 브리프를 생성한다.

Target Files
Read only:

docs/refactor-audits/media-critical-flow-audit.md
docs/refactor-audits/media-import-boundary-audit.md
docs/refactor-audits/media-db-storage-access-audit.md
src/modules/media/**
src/app/**
src/modules/**
src/workflows/**
New:

None
Allowed Changes
상세 브리프 생성
wave-005 이후 실행 순서 정의
각 wave별 target / forbidden / strategy / verification 정의
코드 변경 없이 실행 계획 확정
Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경
Expected Architecture After Wave
txt

No runtime architecture change.

media audits
↓
wave-005 ~ wave-024 detailed briefs
↓
future one-wave-per-chat execution
Execution
wave-005 상세 브리프 생성 완료
wave-006 상세 브리프 생성 완료
wave-007 상세 브리프 생성 완료
wave-008 상세 브리프 생성 완료
wave-009 상세 브리프 생성 완료
wave-010 상세 브리프 생성 완료
wave-011 상세 브리프 생성 완료
wave-012 상세 브리프 생성 완료
wave-013 상세 브리프 생성 완료
wave-014 상세 브리프 생성 완료
wave-015 상세 브리프 생성 완료
wave-016 상세 브리프 생성 완료
wave-017 상세 브리프 생성 완료
wave-018 상세 브리프 생성 완료
wave-019 상세 브리프 생성 완료
wave-020 상세 브리프 생성 완료
wave-021 상세 브리프 생성 완료
wave-022 상세 브리프 생성 완료
wave-023 상세 브리프 생성 완료
wave-024 상세 브리프 생성 완료
first code phase order 확정 완료
story video / message media / feed-search-creator / final audit waves 분리 완료
avatar/profile storage는 profile domain 후보로 보류 권장 완료

Verification
wave-005 createMedia public boundary brief 작성 완료
wave-006 uploadMedia public boundary brief 작성 완료
wave-007 migrate create/upload media callers to public boundary brief 작성 완료
wave-008 media index public export cleanup brief 작성 완료
wave-009 createMedia repository split brief 작성 완료
wave-010 uploadMedia storage boundary split brief 작성 완료
wave-011 createMediaSignedUrl storage boundary split brief 작성 완료
wave-012 getSecurePostMedia repository split brief 작성 완료
wave-013 story video job public boundary brief 작성 완료
wave-014 story video queue public boundary brief 작성 완료
wave-015 story video processor public boundary brief 작성 완료
wave-016 story video job repository split brief 작성 완료
wave-017 story video storage boundary split brief 작성 완료
wave-018 message media access audit and boundary plan brief 작성 완료
wave-019 message media repository boundary brief 작성 완료
wave-020 video moderation media repository and storage split brief 작성 완료
wave-021 feed search creator media read boundary audit brief 작성 완료
wave-022 feed search creator media read repository cleanup brief 작성 완료
wave-023 story image upload boundary audit and cleanup brief 작성 완료
wave-024 media final grep and contract audit brief 작성 완료
code changes not made
refactor progress not changed

Issues
상세 브리프는 문서 파일로 생성하지 않고 채팅 출력 형태로 생성됨
실제 코드 변경은 wave-005부터 별도 채팅에서 진행 필요
media 관련 기존 worktree 변경은 별도 확인 필요

Result
Success


wave-005
Domain
media

Title
createMedia public boundary

Status
Completed

Goal
media/server/create-media.ts 외부 직접 import를 제거하기 위한 public boundary를 추가한다.

Target Files
Existing:

src/modules/media/server/create-media.ts
src/modules/media/public/**
src/modules/media/index.ts
New:

src/modules/media/public/create-media.ts
src/modules/media/public/create-post-authoring-media.ts
Allowed Changes
createMedia public wrapper 추가
createPostAuthoringMedia public wrapper 추가
wrapper는 server 함수를 그대로 호출
기존 함수명/export/return shape/error behavior 유지
필요한 경우 public export 추가만 수행
Forbidden Changes
외부 caller import 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split
storage boundary split
src/app/** 변경
src/modules/post/** 변경
src/workflows/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
refactor-progress 문서 변경
Expected Architecture After Wave
app / api / post / workflow
↓
media/server/create-media direct imports remain temporarily

media/public/create-media
↓
media/server/create-media.createMedia

media/public/create-post-authoring-media
↓
media/server/create-media.createPostAuthoringMedia

No DB/storage behavior change.
Execution
required source files read 완료
src/modules/media/server/create-media.ts export 확인 완료
createMedia input / return / error behavior 확인 완료
createPostAuthoringMedia input / return / error behavior 확인 완료
기존 direct caller 3곳 확인 완료
src/modules/media/public/create-media.ts 추가 완료
src/modules/media/public/create-post-authoring-media.ts 추가 완료
wrapper는 기존 server 함수를 그대로 호출하도록 구성 완료
validation / try-catch / return mapping 추가 없음
외부 caller import 변경 없음
DB/storage/repository 변경 없음
progress 문서 변경 없음
Verification
createMedia wrapper typecheck 정상
createPostAuthoringMedia wrapper typecheck 정상
기존 server create-media export 유지 확인
return shape 동일
error behavior 동일
외부 caller 동작 변경 없음
direct server imports remain by design 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음
Issues
src/modules/media/index.ts에 기존 worktree 변경이 이미 존재함
src/modules/media/index.ts는 이번 wave에서 수정하지 않음
external caller direct import는 다음 wave에서 전환 필요
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
Result
Success



undary

Status
Completed

Goal
media/server/upload-media.ts 외부 직접 import를 제거하기 위한 범용 public upload boundary를 추가한다.

Target Files
Existing:

src/modules/media/server/upload-media.ts
src/modules/media/public/upload-media.ts
src/modules/media/index.ts

New:

src/modules/media/public/upload-media-file.ts

Allowed Changes
uploadMediaFile public wrapper 추가
기존 uploadPostMedia public wrapper 유지
wrapper는 server uploadMedia를 그대로 호출
기존 함수명/export/return shape/error behavior 유지
필요한 경우 public export 추가만 수행

Forbidden Changes
외부 caller import 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split
storage boundary split
src/app/** 변경
src/modules/post/** 변경
src/workflows/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/media/server/create-media.ts 변경
src/modules/media/server/get-secure-post-media.ts 변경
src/modules/media/server/story-video-job.service.ts 변경
refactor-progress 문서 변경

Expected Architecture After Wave
app / api / post / workflow
↓
media/server/upload-media direct imports remain temporarily

media/public/upload-media-file
↓
media/server/upload-media.uploadMedia

media/public/upload-media
↓
media/server/upload-media.uploadMedia

No DB/storage behavior change.

Execution
required source files read 완료
media import boundary audit 확인 완료
media DB/storage direct access audit 확인 완료
src/modules/media/server/upload-media.ts input / return / error behavior 확인 완료
storage path format 확인 완료
bucket fallback 확인 완료
upload option cacheControl/contentType/upsert behavior 확인 완료
기존 uploadPostMedia public wrapper 확인 완료
src/modules/media/public/upload-media-file.ts 추가 완료
uploadMediaFile wrapper는 기존 server uploadMedia를 그대로 호출하도록 구성 완료
validation / try-catch / return mapping 추가 없음
기존 uploadPostMedia wrapper 유지 완료
외부 caller import 변경 없음
DB/storage/repository 변경 없음
progress 문서 변경 없음
src/modules/media/index.ts public export 추가 완료

Verification
uploadMediaFile wrapper typecheck 정상
uploadPostMedia 기존 동작 유지 확인
storage path format 동일
bucket fallback 동일
upload option 동일
error behavior 동일
외부 caller 동작 변경 없음
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
src/modules/media/index.ts에 기존 worktree 변경이 이미 존재함
src/modules/media/index.ts는 이번 wave에서 upload-media-file public export만 추가함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
external caller direct import는 다음 wave에서 전환 필요

Result
Success




wave-007
Domain
media

Title
migrate create/upload media callers to public boundary

Status
Completed

Goal
createMedia / createPostAuthoringMedia / uploadMedia 외부 사용처를 media server 직접 import에서 public boundary로 전환한다.

Target Files
Existing:

src/app/api/media/upload/route.ts
src/modules/post/use-cases/update-post.ts
src/workflows/create-post-with-media-workflow.ts
src/modules/media/public/create-media.ts
src/modules/media/public/create-post-authoring-media.ts
src/modules/media/public/upload-media-file.ts
New:

None
Allowed Changes
createMedia direct server import를 public wrapper import로 전환
createPostAuthoringMedia direct server import를 public wrapper import로 전환
uploadMedia direct server import를 uploadMediaFile public wrapper import로 전환
함수 호출 인자 / return shape 유지
외부 caller 로직 변경 금지
DB/storage/repository 변경 금지
storage path / bucket / cacheControl 변경 금지
progress 문서 변경 금지
Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split
storage boundary split
src/modules/media/server/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/app/** except src/app/api/media/upload/route.ts
DB schema / RLS / SQL / storage 관련 파일 변경
Expected Architecture After Wave
src/app/api/media/upload/route.ts
↓
media/public/create-media
media/public/upload-media-file

src/modules/post/use-cases/update-post.ts
↓
media/public/create-media
media/public/upload-media-file

src/workflows/create-post-with-media-workflow.ts
↓
media/public/create-post-authoring-media

media/public/create-media
↓
media/server/create-media.createMedia

media/public/create-post-authoring-media
↓
media/server/create-media.createPostAuthoringMedia

media/public/upload-media-file
↓
media/server/upload-media.uploadMedia

No DB/storage behavior change.
Execution
required source files read 완료
media import boundary audit 확인 완료
src/app/api/media/upload/route.ts createMedia / uploadMedia direct server import 확인 완료
src/modules/post/use-cases/update-post.ts createMedia / uploadMedia direct server import 확인 완료
src/workflows/create-post-with-media-workflow.ts createPostAuthoringMedia direct server import 확인 완료
src/modules/media/public/create-media.ts wrapper contract 확인 완료
src/modules/media/public/create-post-authoring-media.ts wrapper contract 확인 완료
src/modules/media/public/upload-media-file.ts wrapper contract 확인 완료
src/app/api/media/upload/route.ts import를 public boundary로 전환 완료
src/modules/post/use-cases/update-post.ts import를 public boundary로 전환 완료
src/workflows/create-post-with-media-workflow.ts import를 public boundary로 전환 완료
uploadMediaFile은 uploadMedia alias로 import하여 호출부 변경 없음 유지 완료
함수 호출 인자 변경 없음
response shape 변경 없음
error behavior 변경 없음
DB/storage/repository 변경 없음
progress 문서 변경 없음

Verification
app/api/media/upload response shape 동일
post update media upload 호출 방식 동일
create post workflow media create 호출 방식 동일
createMedia 호출 방식 동일
createPostAuthoringMedia 호출 방식 동일
uploadMedia 호출 방식 동일
media/server/create-media 외부 direct import 0개 확인
media/server/upload-media 외부 direct import 0개 확인
public wrapper 내부 server import는 old + new coexistence로 유지 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 지정된 3개 caller 파일의 media import만 변경함
src/modules/post/use-cases/update-post.ts는 git 기준 untracked 상태라 diff에는 표시되지 않지만 import 전환 적용됨
src/workflows/create-post-with-media-workflow.ts에는 기존 post public import 변경이 이미 섞여 있었고 이번 wave에서는 media import만 추가 전환함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함

Result
Success


wave-008
Domain
media

Title
media index public export cleanup

Status
Completed

Goal
src/modules/media/index.ts에서 server internals export를 제거하고 public/type export 중심으로 정리한다.

Target Files
Existing:

src/modules/media/index.ts
src/modules/media/types.ts
src/modules/media/public/create-media-signed-url.ts
src/modules/media/public/upload-media.ts
src/modules/media/public/create-media.ts
src/modules/media/public/create-post-authoring-media.ts
src/modules/media/public/upload-media-file.ts
New:

None

Allowed Changes
media/index.ts export 현황 재확인
server internal export 제거
public wrapper export 유지 또는 추가
type export 유지
외부 caller가 media index에서 server internal을 사용하지 않는지 grep 확인
기존 함수명/export/return shape/error behavior 유지
Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split
storage boundary split
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/media/server/** 변경
DB schema / RLS / SQL / storage 관련 파일 변경
refactor-progress 문서 변경
Expected Architecture After Wave
media/index.ts
↓
types + public exports only

media/public/create-media
↓
media/server/create-media.createMedia

media/public/create-post-authoring-media
↓
media/server/create-media.createPostAuthoringMedia

media/public/upload-media-file
↓
media/server/upload-media.uploadMedia

media/public/upload-media
↓
media/server/upload-media.uploadMedia

No DB/storage behavior change.
Execution
required source files read 완료
media import boundary audit 확인 완료
src/modules/media/index.ts export 현황 확인 완료
src/modules/media/types.ts export 확인 완료
src/modules/media/public/create-media-signed-url.ts export 확인 완료
src/modules/media/public/upload-media.ts export 확인 완료
src/modules/media/public/create-media.ts export 확인 완료
src/modules/media/public/create-post-authoring-media.ts export 확인 완료
src/modules/media/public/upload-media-file.ts export 확인 완료
@/modules/media barrel import 외부 사용처 grep 완료
server export 제거 영향 없음 확인 완료
src/modules/media/index.ts에서 server/create-media export 제거 완료
src/modules/media/index.ts에서 server/upload-media export 제거 완료
src/modules/media/index.ts에 public/upload-media export 추가 완료
src/modules/media/index.ts에 public/create-media export 추가 완료
src/modules/media/index.ts에 public/create-post-authoring-media export 추가 완료
기존 types export 유지 완료
기존 public/create-media-signed-url export 유지 완료
기존 public/upload-media-file export 유지 완료
server 파일 삭제 없음
public wrapper 내부 server import 유지 완료
DB/storage/repository 변경 없음
progress 문서 변경 없음

Verification
@/modules/media index import 영향 없음 확인
media/index.ts server export 0개 확인
media public exports 정상 확인
type exports 정상 확인
direct caller 동작 변경 없음
return shape 변경 없음
permission behavior 변경 없음
error behavior 변경 없음
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음
DB/RLS/SQL/storage policy changes not made
refactor progress not changed

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 src/modules/media/index.ts만 변경함
git 기준 원본에는 server/create-media-signed-url export가 있었던 것으로 보이나 작업 직전 파일 상태는 이미 public/create-media-signed-url export였고 이번 wave는 현재 worktree 상태 기준으로 진행함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음

Result
Success


wave-009
Domain
media

Title
createMedia repository split

Status
Completed

Goal
media/server/create-media.ts 내부의 media insert DB 접근을 media repository로 이동한다.

Target Files
Existing:

src/modules/media/server/create-media.ts
src/modules/media/types.ts
src/modules/media/public/create-media.ts
src/modules/media/public/create-post-authoring-media.ts

New:

src/modules/media/repositories/media-repository.ts
src/modules/media/mappers/media-mapper.ts

Allowed Changes
createMedia DB insert 로직 재확인
createPostAuthoringMedia가 createMedia를 통해 동작하는 흐름 확인
media repository 추가
server/create-media.ts는 repository를 호출하도록 최소 변경
DB row insert payload / select / single / error throw behavior 유지
return shape 유지
status default 유지
moderation initial state behavior 유지
public wrapper 변경 금지 또는 최소화
old 사용처 0개 확인 전 server 파일 삭제 금지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
storage path / bucket / cacheControl 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/media/server/upload-media.ts 변경
src/modules/media/server/get-secure-post-media.ts 변경
src/modules/media/server/story-video-job.service.ts 변경
DB schema / RLS / SQL / storage 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
media/public/create-media
↓
media/server/create-media.createMedia
↓
media/mappers/media-mapper.buildCreateMediaInsertPayload
↓
media/repositories/media-repository.insertMediaRow
↓
Supabase media insert

media/repositories/media-repository.insertMediaRow
↓
media/mappers/media-mapper.mapMediaRowToMedia
↓
media/server/create-media.createMedia

media/public/create-post-authoring-media
↓
media/server/create-media.createPostAuthoringMedia
↓
media/server/create-media.createMedia

No DB schema/storage behavior change.
Execution
required source files read 완료
media DB/storage direct access audit 확인 완료
src/modules/media/server/create-media.ts DB insert query 확인 완료
src/modules/media/server/create-media.ts MediaRow mapping 확인 완료
src/modules/media/public/create-media.ts wrapper contract 확인 완료
src/modules/media/public/create-post-authoring-media.ts wrapper contract 확인 완료
src/modules/media/mappers/media-mapper.ts 추가 완료
MediaRow type을 mapper로 이동 완료
CreateMediaInsertPayload type 추가 완료
buildCreateMediaInsertPayload 추가 완료
mapMediaRowToMedia 추가 완료
insert payload field 유지 완료
initial moderation state payload behavior 유지 완료
src/modules/media/repositories/media-repository.ts 추가 완료
insertMediaRow repository 함수 추가 완료
Supabase media insert query를 repository로 이동 완료
selected columns 유지 완료
single<MediaRow>() 유지 완료
error throw behavior 유지 완료
src/modules/media/server/create-media.ts에서 supabaseAdmin 직접 import 제거 완료
src/modules/media/server/create-media.ts는 validation / moderation state 생성 / mapper 호출 / repository 호출 / mapper return 담당으로 축소 완료
createPostAuthoringMedia 호출 순서와 인자 유지 완료
public wrapper 변경 없음
DB schema/RLS/SQL/storage 변경 없음
progress 문서 변경 없음

Verification
createMedia 정상
createPostAuthoringMedia 정상
media insert payload 동일
moderation initial state 동일
selected columns 동일
Media return shape 동일
error throw behavior 동일
post create media row 생성 흐름 유지
message media upload route media row 생성 흐름 유지
src/modules/media/server/create-media.ts supabaseAdmin direct import 제거 확인
src/modules/media/server/create-media.ts from("media") direct access 제거 확인
src/modules/media/repositories/media-repository.ts에 media insert DB 접근 위치 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 createMedia repository split 관련 3개 파일만 변경함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success

wave-010
Domain
media

Title
uploadMedia storage boundary split

Status
Completed

Goal
media/server/upload-media.ts 내부의 storage upload 접근과 storage path 생성 책임을 storage repository/service로 분리한다.

Target Files
Existing:

src/modules/media/server/upload-media.ts
src/modules/media/public/upload-media.ts
src/modules/media/public/upload-media-file.ts

New:

src/modules/media/repositories/media-storage-repository.ts
src/modules/media/services/media-storage-path-service.ts

Allowed Changes
uploadMedia storage upload 로직 재확인
uploadMediaFile public wrapper가 uploadMedia를 통해 동작하는 흐름 확인
uploadPostMedia public wrapper가 uploadMedia를 통해 동작하는 흐름 확인
media storage repository 추가
media storage path service 추가
getFileExtension / buildStoragePath 로직을 service로 이동
Supabase storage upload 호출을 repository 함수로 이동
server/upload-media.ts는 validation / path 생성 service 호출 / repository 호출만 담당하도록 최소 변경
storage path format 유지
bucket fallback 유지
cacheControl 유지
contentType 유지
upsert behavior 유지
upload error throw behavior 유지
return shape 유지
public wrapper 변경 금지 또는 최소화
old 사용처 0개 확인 전 server 파일 삭제 금지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
signed URL expiration 변경
secure media access behavior 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/media/server/create-media.ts 변경
src/modules/media/server/get-secure-post-media.ts 변경
src/modules/media/server/story-video-job.service.ts 변경
DB schema / RLS / SQL / storage 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
media/public/upload-media-file
↓
media/server/upload-media.uploadMedia
↓
media/services/media-storage-path-service.buildMediaStoragePath
↓
media/repositories/media-storage-repository.uploadMediaFileToStorage
↓
Supabase Storage upload

media/public/upload-media
↓
media/server/upload-media.uploadMedia
↓
media/services/media-storage-path-service.buildMediaStoragePath
↓
media/repositories/media-storage-repository.uploadMediaFileToStorage
↓
Supabase Storage upload

No DB schema/storage bucket/policy behavior change.
Execution
required source files read 완료
media DB/storage direct access audit 확인 완료
src/modules/media/server/upload-media.ts storage path 생성 로직 확인 완료
src/modules/media/server/upload-media.ts Supabase storage upload 호출 확인 완료
src/modules/media/public/upload-media.ts wrapper contract 확인 완료
src/modules/media/public/upload-media-file.ts wrapper contract 확인 완료
src/modules/media/repositories/media-storage-repository.ts 미존재 확인 완료
src/modules/media/services 디렉터리 미존재 확인 완료
src/modules/media/services/media-storage-path-service.ts 추가 완료
MediaStoragePurpose type 추가 완료
getFileExtension 로직을 media-storage-path-service로 이동 완료
buildStoragePath 로직을 buildMediaStoragePath로 이동 완료
post purpose storage path format 유지 완료
message purpose storage path format 유지 완료
extension 처리 behavior 유지 완료
src/modules/media/repositories/media-storage-repository.ts 추가 완료
MEDIA_BUCKET fallback 유지 완료
uploadMediaFileToStorage repository 함수 추가 완료
Supabase storage upload 호출을 repository로 이동 완료
cacheControl 유지 완료
contentType 유지 완료
upsert behavior 유지 완료
upload error throw behavior 유지 완료
src/modules/media/server/upload-media.ts에서 supabaseAdmin 직접 import 제거 완료
src/modules/media/server/upload-media.ts에서 storage upload 직접 접근 제거 완료
src/modules/media/server/upload-media.ts는 validation / path 생성 service 호출 / repository 호출 / return 담당으로 축소 완료
uploadMedia 함수명/export 유지 완료
uploadMedia return shape 유지 완료
uploadPostMedia public wrapper 변경 없음
uploadMediaFile public wrapper 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
uploadMedia 정상
uploadPostMedia 정상
uploadMediaFile 정상
post purpose storage path 동일
message purpose storage path 동일
bucket fallback 동일
upload option 동일
empty file error 동일
uploaderUserId validation 동일
file validation 동일
return storagePath 동일
upload error throw behavior 동일
src/modules/media/server/upload-media.ts supabaseAdmin direct import 제거 확인
src/modules/media/server/upload-media.ts Supabase storage direct access 제거 확인
src/modules/media/repositories/media-storage-repository.ts에 storage upload 접근 위치 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 uploadMedia storage boundary split 관련 3개 파일만 변경함
src/modules/media/services 디렉터리가 없어 새로 생성함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success

wave-011
Domain
media

Title
createMediaSignedUrl storage boundary split

Status
Completed

Goal
media/public/create-media-signed-url.ts 내부의 signed URL storage 접근과 access 판단을 storage repository/policy로 분리한다.

Target Files
Existing:

src/modules/media/public/create-media-signed-url.ts
src/modules/media/repositories/media-storage-repository.ts
src/modules/post/public/can-view-post.ts

New:

src/modules/media/policies/media-access-policy.ts

Allowed Changes
createMediaSignedUrl signed URL 생성 로직 재확인
createMediaSignedUrl external caller usage 확인
media-storage-repository.ts에 signed URL repository 함수 추가
media-access-policy.ts 추가
owner/canView/allowPreview 판단을 policy 함수로 이동
public/create-media-signed-url.ts는 input normalize / policy 호출 / repository 호출만 담당하도록 최소 변경
signed URL expiration 유지
bucket fallback 유지
storagePath input behavior 유지
signed URL return shape 유지
storage error 발생 시 빈 문자열 반환 behavior 유지
denied access 시 빈 문자열 반환 behavior 유지
기존 함수명/export/return shape/error behavior 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
secure media access behavior 변경
post/message/story media access behavior 변경
src/app/** 변경
src/modules/post/** 변경 except src/modules/post/public/can-view-post.ts read-only
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/media/server/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
media/public/create-media-signed-url
↓
media/policies/media-access-policy.canCreateMediaSignedUrl
↓
post/public/can-view-post

media/public/create-media-signed-url
↓
media/repositories/media-storage-repository.createMediaStorageSignedUrl
↓
Supabase Storage createSignedUrl

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media DB/storage direct access audit 확인 완료
src/modules/media/public/create-media-signed-url.ts signed URL 생성 로직 확인 완료
src/modules/media/public/create-media-signed-url.ts access 판단 로직 확인 완료
src/modules/media/repositories/media-storage-repository.ts 기존 upload storage repository 확인 완료
src/modules/post/public/can-view-post.ts read-only 확인 완료
createMediaSignedUrl external caller usage 확인 완료
src/modules/media/policies/media-access-policy.ts 추가 완료
canCreateMediaSignedUrl policy 함수 추가 완료
owner 판단 로직을 media-access-policy로 이동 완료
canView boolean override behavior 유지 완료
canViewPost fallback behavior 유지 완료
allowPreview behavior 유지 완료
src/modules/media/repositories/media-storage-repository.ts에 createMediaStorageSignedUrl 추가 완료
Supabase Storage createSignedUrl 호출을 repository로 이동 완료
MEDIA_BUCKET fallback 유지 완료
storage error 빈 문자열 반환 behavior 유지 완료
data?.signedUrl ?? "" behavior 유지 완료
src/modules/media/public/create-media-signed-url.ts에서 supabaseAdmin direct import 제거 완료
src/modules/media/public/create-media-signed-url.ts는 input normalize / empty storagePath guard / policy 호출 / repository 호출 담당으로 축소 완료
default expiresIn 유지 완료
storagePath trim behavior 유지 완료
viewerUserId / creatorUserId trim behavior 유지 완료
denied access 빈 문자열 반환 behavior 유지 완료
기존 함수명/export/return shape/error behavior 유지 완료
caller import 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
createMediaSignedUrl 정상
owner signed URL behavior 유지 확인
public post signed URL behavior 유지 확인
subscriber/paid access signed URL behavior 유지 확인
denied access 빈 문자열 동일
storage error 빈 문자열 동일
allowPreview behavior 동일
default expiresIn 동일
post access fallback 동일
src/modules/media/public/create-media-signed-url.ts supabaseAdmin direct import 제거 확인
src/modules/media/public/create-media-signed-url.ts Supabase storage direct access 제거 확인
src/modules/media/repositories/media-storage-repository.ts에 signed URL storage 접근 위치 확인
caller import 변경 없음 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 createMediaSignedUrl storage boundary split 관련 3개 파일만 변경함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
관련 파일들이 git 기준 untracked 영역에 있어 git diff가 비어 보임
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success

wave-012
Domain
media

Title
getSecurePostMedia repository split

Status
Completed

Goal
media/server/get-secure-post-media.ts 내부의 media lookup DB 접근을 media repository로 이동한다.

Target Files
Existing:

src/modules/media/server/get-secure-post-media.ts
src/modules/media/public/create-media-signed-url.ts
src/modules/media/repositories/media-repository.ts
src/modules/post/public/get-post.ts

New:

None

Allowed Changes
getSecurePostMedia media row 조회 로직 재확인
getSecurePostMedia post access / locked behavior 재확인
media-repository.ts에 ready post media 조회 함수 추가
기존 select columns 유지
기존 post_id/status/order 조건 유지
server/get-secure-post-media.ts는 getPostById / locked guard / repository 호출 / signed URL mapping만 담당하도록 최소 변경
post missing empty array behavior 유지
locked post empty array behavior 유지
ready status filter 유지
media ordering 유지
signed URL input 유지
return shape 유지
기존 함수명/export/return shape/error behavior 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
post access / visibility behavior 변경
secure media access behavior 변경
signed URL expiration 변경
src/app/** 변경
src/modules/post/** 변경 except src/modules/post/public/get-post.ts read-only
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/media/server/create-media.ts 변경
src/modules/media/server/upload-media.ts 변경
src/modules/media/server/story-video-job.service.ts 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
media/server/get-secure-post-media
↓
post/public/get-post
↓
missing post / locked post guard

media/server/get-secure-post-media
↓
media/repositories/media-repository.findReadyPostMediaRowsByPostId
↓
Supabase media select

media/server/get-secure-post-media
↓
media/public/create-media-signed-url
↓
media/policies/media-access-policy.canCreateMediaSignedUrl
↓
media/repositories/media-storage-repository.createMediaStorageSignedUrl

No DB schema/storage bucket/policy behavior change.
Execution
required source files read 완료
docs/refactor-audits/media-db-storage-access-audit.md 확인 완료
src/modules/media/server/get-secure-post-media.ts media select query 확인 완료
src/modules/media/server/get-secure-post-media.ts post missing / locked guard 확인 완료
src/modules/media/server/get-secure-post-media.ts signed URL input 확인 완료
src/modules/media/public/create-media-signed-url.ts read-only contract 확인 완료
src/modules/post/public/get-post.ts read-only contract 확인 완료
src/modules/media/repositories/media-repository.ts 기존 insertMediaRow 확인 완료
src/modules/media/repositories/media-repository.ts에 SECURE_POST_MEDIA_SELECT_COLUMNS 추가 완료
src/modules/media/repositories/media-repository.ts에 SecurePostMediaRow type 추가 완료
src/modules/media/repositories/media-repository.ts에 findReadyPostMediaRowsByPostId 추가 완료
Supabase media select query를 repository로 이동 완료
selected columns 유지 완료
post_id filter 유지 완료
status ready filter 유지 완료
sort_order ascending 유지 완료
error throw behavior 유지 완료
data null fallback empty array behavior 유지 완료
src/modules/media/server/get-secure-post-media.ts에서 supabaseAdmin 직접 import 제거 완료
src/modules/media/server/get-secure-post-media.ts에서 from("media") direct access 제거 완료
src/modules/media/server/get-secure-post-media.ts 내부 MediaRow type 제거 완료
src/modules/media/server/get-secure-post-media.ts는 getPostById / locked guard / repository 호출 / signed URL mapping / return 담당으로 축소 완료
createMediaSignedUrl 호출 인자 유지 완료
getSecurePostMedia 함수명/export 유지 완료
return shape 유지 완료
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
secure post media 정상
missing post [] 동일
locked post [] 동일
ready media filter 동일
media ordering 동일
signed URL input 동일
return media shape 동일
post detail media 정상
locked preview 정상
src/modules/media/server/get-secure-post-media.ts supabaseAdmin direct import 제거 확인
src/modules/media/server/get-secure-post-media.ts from("media") direct access 제거 확인
src/modules/media/repositories/media-repository.ts에 ready post media 조회 DB 접근 위치 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 getSecurePostMedia repository split 관련 2개 파일만 변경함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success


wave-013
Domain
media

Title
story video job public boundary

Status
Completed

Goal
story API/worker의 media/server/story-video-job.service.ts 직접 import를 제거하기 위한 public boundary를 추가한다.

Target Files
Existing:

src/modules/media/server/story-video-job.service.ts
src/modules/media/lib/story-video-job-contract.ts
src/modules/media/lib/story-video-processor-contract.ts
src/app/api/story/video-job/route.ts
src/app/api/story/video-job/[jobId]/route.ts
src/modules/story/server/story-video-worker.ts
src/modules/media/index.ts

New:

src/modules/media/public/story-video-job.ts
src/modules/media/public/story-video-job-contract.ts
src/modules/media/public/story-video-worker-job.ts

Allowed Changes
story video job service external caller usage 재확인
story video job enqueue / claim / complete / fail / poll contract 재확인
story API route용 public wrapper 추가
story worker용 public wrapper 추가
story-video-job-contract public re-export 추가
wrapper는 기존 server 함수를 그대로 호출
기존 함수명/export/return shape/error behavior 유지
route/worker import를 media public boundary로 전환
polling response shape 유지
worker 호출 순서와 error handling 유지
DB/storage/repository 변경 금지
progress 문서 변경 금지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
story_video_jobs schema 변경
claim_story_video_job RPC 변경
story creation side effect 변경
temp cleanup behavior 변경
repository split
storage boundary split
src/modules/media/server/story-video-job.service.ts internals 변경
src/modules/media/server/story-video-storage.service.ts 변경
src/modules/media/server/story-video-processor.server.ts 변경
src/modules/story/server/create-story.ts 변경
src/modules/story/lib/story-create-payload.ts 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
story API route
↓
media/public/story-video-job
↓
media/server/story-video-job.service

story API route
↓
media/public/story-video-job-contract
↓
media/lib/story-video-job-contract

story worker
↓
media/public/story-video-worker-job
↓
media/server/story-video-job.service

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media import boundary audit 확인 완료
media DB/storage direct access audit 확인 완료
src/modules/media/server/story-video-job.service.ts export 확인 완료
enqueueStoryVideoJob contract 확인 완료
getStoryVideoJobForUser contract 확인 완료
claimStoryVideoJobForProcessing contract 확인 완료
completeStoryVideoJobFromProcessorResult contract 확인 완료
markStoryVideoJobFailed contract 확인 완료
poll response builder contract 확인 완료
story worker claimedJob.processorInput usage 확인 완료
story worker complete result usage 확인 완료
story worker fail errorMessage usage 확인 완료
src/modules/media/public/story-video-job.ts 추가 완료
src/modules/media/public/story-video-job-contract.ts 추가 완료
src/modules/media/public/story-video-worker-job.ts 추가 완료
story-video-job public wrapper는 기존 server 함수를 그대로 호출하도록 구성 완료
story-video-worker-job public wrapper는 기존 server 함수를 그대로 호출하도록 구성 완료
story-video-job-contract public re-export 추가 완료
validation / try-catch / return mapping 추가 없음
src/app/api/story/video-job/route.ts import를 public boundary로 전환 완료
src/app/api/story/video-job/[jobId]/route.ts import를 public boundary로 전환 완료
src/modules/story/server/story-video-worker.ts import를 public boundary로 전환 완료
route response shape 변경 없음
route error handling 변경 없음
worker loop 변경 없음
worker 호출 순서 변경 없음
worker error handling 변경 없음
story-video-job.service.ts 내부 변경 없음
story-video-storage.service.ts 변경 없음
story-video-processor.server.ts 변경 없음
DB/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
story video job enqueue public boundary 정상
story video job poll public boundary 정상
story worker claim public boundary 정상
story worker complete public boundary 정상
story worker fail public boundary 정상
poll response shape 동일
worker error behavior 동일
media/server/story-video-job.service 외부 direct import 0개 확인
media/lib/story-video-job-contract 외부 direct import 0개 확인
public wrapper 내부 server import는 old + new coexistence로 유지 확인
public contract re-export 내부 lib import는 old + new coexistence로 유지 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 story video job public boundary 관련 6개 파일만 변경함
src/modules/story/ui/CreateStoryComposer.tsx의 media/lib/queue-story-video-job direct import는 wave-013 범위 밖이라 유지함
src/modules/media/index.ts는 이번 wave에서 수정하지 않음
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success


wave-014
Domain
media

Title
story video queue public boundary

Status
Completed

Goal
story UI의 media/lib/queue-story-video-job 직접 import를 제거하고 media public boundary로 전환한다.

Target Files
Existing:

src/modules/media/lib/queue-story-video-job.ts
src/modules/story/ui/CreateStoryComposer.tsx
src/modules/media/index.ts

New:

src/modules/media/public/queue-story-video-job.ts

Allowed Changes
story video queue helper external caller usage 재확인
queueStoryVideoJob / waitForStoryVideoJob contract 재확인
media public queue wrapper 추가
wrapper는 기존 lib 함수를 그대로 re-export
기존 함수명/export/return shape/error behavior 유지
CreateStoryComposer import를 media public boundary로 전환
queue response shape 유지
polling interval 유지
timeout behavior 유지
failed job error behavior 유지
progress 문서 변경 금지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
story video API route 변경
story video worker 변경
story-video-job.service.ts 변경
story-video-storage.service.ts 변경
story-video-processor.server.ts 변경
repository split
storage boundary split
src/app/** 변경
src/modules/media/server/** 변경
src/modules/story/server/** 변경
src/modules/story/lib/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
CreateStoryComposer
↓
media/public/queue-story-video-job
↓
media/lib/queue-story-video-job
↓
/api/story/video-job
↓
existing story video job flow

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media import boundary audit 확인 완료
src/modules/media/lib/queue-story-video-job.ts export 확인 완료
queueStoryVideoJob contract 확인 완료
waitForStoryVideoJob contract 확인 완료
queueStoryVideoJob fetch endpoint 확인 완료
waitForStoryVideoJob polling endpoint 확인 완료
polling maxAttempts 60 확인 완료
polling intervalMs 1000 확인 완료
queue 실패 error message 확인 완료
poll fetch 실패 error message 확인 완료
failed job error behavior 확인 완료
timeout error behavior 확인 완료
src/modules/story/ui/CreateStoryComposer.tsx direct media/lib import 확인 완료
src/modules/media/public/story-video-job-contract.ts public contract re-export 확인 완료
src/modules/media/index.ts export 현황 확인 완료
src/modules/media/public/queue-story-video-job.ts 추가 완료
queueStoryVideoJob / waitForStoryVideoJob public re-export 추가 완료
validation / try-catch / return mapping 추가 없음
src/modules/story/ui/CreateStoryComposer.tsx import를 public boundary로 전환 완료
CreateStoryComposer 호출 인자 변경 없음
CreateStoryComposer await 순서 변경 없음
CreateStoryComposer phase handling 변경 없음
CreateStoryComposer error handling 변경 없음
UI copy/layout/render behavior 변경 없음
story video API route 변경 없음
story video worker 변경 없음
story-video-job.service.ts 변경 없음
story-video-storage.service.ts 변경 없음
story-video-processor.server.ts 변경 없음
src/modules/media/index.ts 변경 없음
DB/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
CreateStoryComposer import public boundary 전환 확인
queueStoryVideoJob 호출 방식 동일
waitForStoryVideoJob 호출 방식 동일
story video enqueue flow 유지
story video polling flow 유지
timeout behavior 동일
failed job error behavior 동일
media/lib/queue-story-video-job 외부 direct import 0개 확인
public wrapper 내부 lib re-export는 old + new coexistence로 유지 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 story video queue public boundary 관련 2개 파일만 변경함
src/modules/media/index.ts는 이번 wave에서 수정하지 않음
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success

wave-015
Domain
media

Title
story video processor public boundary

Status
Completed

Goal
story worker의 media/server/story-video-processor.server.ts 직접 import를 제거하기 위한 public boundary를 추가한다.

Target Files
Existing:

src/modules/media/server/story-video-processor.server.ts
src/modules/media/server/story-video-storage.service.ts
src/modules/media/lib/story-video-processor-contract.ts
src/modules/story/server/story-video-worker.ts
src/modules/media/index.ts

New:

src/modules/media/public/process-story-video-job.ts
src/modules/media/public/story-video-processor-contract.ts

Allowed Changes
processStoryVideoJob public wrapper 추가
story-video-processor-contract public re-export 추가
wrapper는 기존 server 함수를 그대로 호출
기존 함수명/export/return shape/error behavior 유지
story worker import를 media public boundary로 전환
processor input/output contract 유지
worker error handling과 호출 순서 유지
필요한 경우 public export 추가만 수행

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
story video processor 내부 로직 변경
story video storage behavior 변경
story video API route 변경
story video job service 변경
story creation side effect 변경
video trim/remux/transcode behavior 변경
repository split
storage boundary split
src/app/** 변경
src/modules/media/server/story-video-processor.server.ts internals 변경
src/modules/media/server/story-video-storage.service.ts 변경
src/modules/media/server/story-video-job.service.ts 변경
src/modules/story/server/create-story.ts 변경
src/modules/story/lib/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
story worker
↓
media/public/process-story-video-job
↓
media/server/story-video-processor.server

story worker / public callers
↓
media/public/story-video-processor-contract
↓
media/lib/story-video-processor-contract

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media import boundary audit 확인 완료
media DB/storage direct access audit 확인 완료
src/modules/media/server/story-video-processor.server.ts export 확인 완료
processStoryVideoJob contract 확인 완료
StoryVideoProcessorInput contract 확인 완료
StoryVideoProcessorOutput contract 확인 완료
story-video-processor-contract builder exports 확인 완료
src/modules/story/server/story-video-worker.ts processStoryVideoJob direct server import 확인 완료
story worker claim / process / complete / fail 호출 순서 확인 완료
story worker error handling 확인 완료
src/modules/media/public/process-story-video-job.ts 추가 완료
processStoryVideoJob public re-export 추가 완료
src/modules/media/public/story-video-processor-contract.ts 추가 완료
StoryVideoProcessorInput / StoryVideoProcessorOutput / StoryVideoProcessorJobFact / CompletedStoryVideoProcessing public type re-export 추가 완료
buildStoryVideoProcessorInputFromJob / buildClaimedStoryVideoJob / pickStoryVideoProcessorJobFact / buildCompletedStoryVideoProcessing / buildStoryVideoProcessorOutput public re-export 추가 완료
validation / try-catch / return mapping 추가 없음
src/modules/story/server/story-video-worker.ts import를 public boundary로 전환 완료
processStoryVideoJob 호출 인자 변경 없음
worker loop 변경 없음
worker 호출 순서 변경 없음
worker error handling 변경 없음
story-video-processor.server.ts 내부 변경 없음
story-video-storage.service.ts 변경 없음
story-video-job.service.ts 변경 없음
story create flow 변경 없음
src/modules/media/index.ts에 public/process-story-video-job export 추가 완료
src/modules/media/index.ts에 public/story-video-processor-contract export 추가 완료
DB/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
story worker process import public boundary 전환 확인
processStoryVideoJob 호출 방식 동일
processor input shape 동일
processor output shape 동일
video trim behavior 동일
storage behavior 동일
worker error behavior 동일
worker complete/fail behavior 동일
media/server/story-video-processor.server 외부 direct import 0개 확인
public wrapper 내부 server import는 old + new coexistence로 유지 확인
story-video-processor-contract public re-export 정상 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 story video processor public boundary 관련 4개 파일만 변경함
src/modules/story/server/story-video-worker.ts의 story-video-worker-job public import는 기존 wave 변경으로 보이며 이번 wave에서는 processor import만 public boundary로 전환함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success

wave-016
Domain
media

Title
story video job repository split

Status
Completed

Goal
media/server/story-video-job.service.ts 내부의 creators/story_video_jobs/RPC DB 접근을 repository로 이동한다.

Target Files
Existing:

src/modules/media/server/story-video-job.service.ts
src/modules/media/lib/story-video-job-contract.ts
src/modules/media/lib/story-video-processor-contract.ts
src/modules/media/public/story-video-job.ts
src/modules/media/public/story-video-worker-job.ts

New:

src/modules/media/repositories/story-video-job-repository.ts
src/modules/media/repositories/story-video-creator-repository.ts

Allowed Changes
story video job lifecycle query 확인
creators lookup query repository 이동
story_video_jobs insert/select/update query repository 이동
claim_story_video_job RPC repository 이동
service는 repository 호출 / storage cleanup / story creation side effect orchestration만 담당
enqueue / poll / claim / complete / fail return shape 유지
job status values 유지
error behavior 유지
기존 함수명/export/return shape/error behavior 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
claim_story_video_job RPC definition 변경
story_video_jobs table/column 변경
story video processor internals 변경
story video storage behavior 변경
story creation side effect behavior 변경
worker loop/error handling 변경
app/api response shape 변경
src/modules/media/server/story-video-storage.service.ts 변경
src/modules/media/server/story-video-processor.server.ts 변경
src/modules/story/server/create-story.ts 변경
src/modules/story/lib/story-create-payload.ts 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
story API route
↓
media/public/story-video-job
↓
media/server/story-video-job.service
↓
media/repositories/story-video-creator-repository.findCreatorIdByUserId
↓
Supabase creators select

story API route
↓
media/public/story-video-job
↓
media/server/story-video-job.service
↓
media/repositories/story-video-job-repository.insertStoryVideoJobRow
↓
Supabase story_video_jobs insert

story API route
↓
media/public/story-video-job
↓
media/server/story-video-job.service
↓
media/repositories/story-video-job-repository.findStoryVideoJobPollRowForCreator
↓
Supabase story_video_jobs select

story worker
↓
media/public/story-video-worker-job
↓
media/server/story-video-job.service
↓
media/repositories/story-video-job-repository.claimStoryVideoJobRow
↓
Supabase claim_story_video_job RPC

story worker
↓
media/public/story-video-worker-job
↓
media/server/story-video-job.service
↓
media/repositories/story-video-job-repository.updateStoryVideoJobCompletedRow / updateStoryVideoJobFailedRow
↓
Supabase story_video_jobs update

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
docs/refactor-audits/media-db-storage-access-audit.md 확인 완료
src/modules/media/server/story-video-job.service.ts creators lookup query 확인 완료
src/modules/media/server/story-video-job.service.ts story_video_jobs insert query 확인 완료
src/modules/media/server/story-video-job.service.ts claim_story_video_job RPC 확인 완료
src/modules/media/server/story-video-job.service.ts completed update query 확인 완료
src/modules/media/server/story-video-job.service.ts failed update query 확인 완료
src/modules/media/server/story-video-job.service.ts poll select query 확인 완료
src/modules/media/lib/story-video-job-contract.ts read-only contract 확인 완료
src/modules/media/lib/story-video-processor-contract.ts read-only contract 확인 완료
src/modules/media/public/story-video-job.ts read-only wrapper 확인 완료
src/modules/media/public/story-video-worker-job.ts read-only wrapper 확인 완료
src/modules/media/repositories/story-video-creator-repository.ts 추가 완료
findCreatorIdByUserId repository 함수 추가 완료
creators select query를 repository로 이동 완료
creator lookup selected column 유지 완료
creator lookup error behavior 유지 완료
src/modules/media/repositories/story-video-job-repository.ts 추가 완료
StoryVideoJobRow type 추가 완료
StoryVideoJobInsertValues type 추가 완료
insertStoryVideoJobRow repository 함수 추가 완료
claimStoryVideoJobRow repository 함수 추가 완료
updateStoryVideoJobCompletedRow repository 함수 추가 완료
updateStoryVideoJobFailedRow repository 함수 추가 완료
findStoryVideoJobPollRowForCreator repository 함수 추가 완료
story_video_jobs insert query를 repository로 이동 완료
story_video_jobs select("*").single behavior 유지 완료
insert error throw behavior 유지 완료
claim_story_video_job RPC 호출을 repository로 이동 완료
claim RPC name 유지 완료
claim null fallback behavior 유지 완료
claim error throw behavior 유지 완료
completed update query를 repository로 이동 완료
failed update query를 repository로 이동 완료
poll select query를 repository로 이동 완료
poll select columns input은 STORY_VIDEO_JOB_POLL_SELECT 유지 완료
poll error behavior 유지 완료
src/modules/media/server/story-video-job.service.ts에서 createClient 직접 import 제거 완료
src/modules/media/server/story-video-job.service.ts에서 Supabase env/client 생성 제거 완료
src/modules/media/server/story-video-job.service.ts에서 creators direct access 제거 완료
src/modules/media/server/story-video-job.service.ts에서 story_video_jobs direct access 제거 완료
src/modules/media/server/story-video-job.service.ts에서 claim_story_video_job direct RPC 제거 완료
service는 repository 호출 / contract builder 호출 / storage cleanup / story creation side effect orchestration 담당으로 축소 완료
buildStoryVideoJobInsertValues 호출 방식 유지 완료
buildCompletedStoryVideoJobValues 호출 방식 유지 완료
buildFailedStoryVideoJobValues 호출 방식 유지 완료
pickStoryVideoJobPollRow 호출 방식 유지 완료
buildStoryVideoJobPollResponse 호출 방식 유지 완료
pickStoryVideoProcessorJobFact 호출 방식 유지 완료
buildClaimedStoryVideoJob 호출 방식 유지 완료
buildCompletedStoryVideoProcessing 호출 방식 유지 완료
uploadTempStoryVideo / removeTempStoryVideo 호출 순서 유지 완료
createStoryFromVideoProcessing side effect 흐름 유지 완료
public wrapper 변경 없음
story-video-storage.service.ts 변경 없음
story-video-processor.server.ts 변경 없음
story create flow 변경 없음
app/api 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
story video job enqueue 정상
creator lookup behavior 동일
story_video_jobs insert payload 동일
story_video_jobs insert select 동일
claim_story_video_job RPC 동일
claim null fallback 동일
completed update payload 동일
failed update payload 동일
poll row select 동일
poll response mapping 동일
story creation side effect 동일
temp cleanup behavior 동일
worker claim / complete / fail 호출 흐름 동일
public wrapper return shape 동일
src/modules/media/server/story-video-job.service.ts creators direct access 제거 확인
src/modules/media/server/story-video-job.service.ts story_video_jobs direct access 제거 확인
src/modules/media/server/story-video-job.service.ts claim_story_video_job direct RPC 제거 확인
src/modules/media/repositories/story-video-creator-repository.ts에 creators DB 접근 위치 확인
src/modules/media/repositories/story-video-job-repository.ts에 story_video_jobs DB 접근 위치 확인
src/modules/media/repositories/story-video-job-repository.ts에 claim_story_video_job RPC 접근 위치 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 story video job repository split 관련 3개 파일만 변경함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
media-refactor-progress.md는 git 기준 untracked로 보이나 이번 wave에서 수정하지 않음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success




wave-017
Domain
media

Title
story video storage boundary split

Status
Completed

Goal
media/server/story-video-storage.service.ts 내부의 story video temp/final storage 접근과 path 생성 책임을 repository/service로 분리한다.

Target Files
Existing:

src/modules/media/server/story-video-storage.service.ts
src/modules/media/server/story-video-job.service.ts
src/modules/media/server/story-video-processor.server.ts

New:

src/modules/media/repositories/story-video-storage-repository.ts
src/modules/media/services/story-video-storage-path-service.ts

Allowed Changes
story video storage upload/download/remove flow 확인
media-temp bucket 접근 repository 이동
media bucket 접근 repository 이동
temp upload / download / remove behavior 유지
processed video upload behavior 유지
storage path format 유지
content type behavior 유지
cache option behavior 유지
service는 storage orchestration / path coordination만 담당
processor input/output contract 유지
story video processor behavior 유지
story video job service behavior 유지
기존 함수명/export/return shape/error behavior 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
signed URL expiration 변경
story video processor internals 변경
story video job service behavior 변경
story creation side effect behavior 변경
video trim/remux/transcode behavior 변경
worker loop/error handling 변경
app/api response shape 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
DB schema / RLS / SQL / storage policy related files 변경
refactor-progress 문서 변경

Expected Architecture After Wave
media/server/story-video-storage.service
↓
media/services/story-video-storage-path-service.buildTempStoryVideoStoragePath
media/services/story-video-storage-path-service.buildProcessedStoryVideoStoragePath

media/server/story-video-storage.service
↓
media/repositories/story-video-storage-repository.uploadTempStoryVideoToStorage
media/repositories/story-video-storage-repository.downloadTempStoryVideoFromStorage
media/repositories/story-video-storage-repository.uploadProcessedStoryVideoToStorage
media/repositories/story-video-storage-repository.removeTempStoryVideoFromStorage
↓
Supabase Storage media-temp / media

story video job service
↓
media/server/story-video-storage.service.uploadTempStoryVideo
media/server/story-video-storage.service.removeTempStoryVideo

story video processor
↓
media/server/story-video-storage.service.downloadTempStoryVideo
media/server/story-video-storage.service.uploadProcessedStoryVideo
media/server/story-video-storage.service.removeTempStoryVideo

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media DB/storage direct access audit 확인 완료
src/modules/media/server/story-video-storage.service.ts temp upload flow 확인 완료
src/modules/media/server/story-video-storage.service.ts temp download flow 확인 완료
src/modules/media/server/story-video-storage.service.ts processed upload flow 확인 완료
src/modules/media/server/story-video-storage.service.ts temp remove flow 확인 완료
src/modules/media/server/story-video-storage.service.ts temp path 생성 로직 확인 완료
src/modules/media/server/story-video-storage.service.ts processed path 생성 로직 확인 완료
src/modules/media/server/story-video-job.service.ts read-only caller 확인 완료
src/modules/media/server/story-video-processor.server.ts read-only caller 확인 완료
src/modules/media/services/story-video-storage-path-service.ts 추가 완료
buildTempStoryVideoStoragePath 추가 완료
buildProcessedStoryVideoStoragePath 추가 완료
getStoryVideoFileExtension 추가 완료
기존 getFileExtension behavior 이동 완료
temp storage path format 유지 완료
processed storage path format 유지 완료
quicktime extension fallback 유지 완료
default mp4 extension fallback 유지 완료
src/modules/media/repositories/story-video-storage-repository.ts 추가 완료
Supabase service role client 생성 책임을 repository로 이동 완료
STORIES_BUCKET fallback 유지 완료
STORIES_TEMP_BUCKET fallback 유지 완료
uploadTempStoryVideoToStorage 추가 완료
downloadTempStoryVideoFromStorage 추가 완료
uploadProcessedStoryVideoToStorage 추가 완료
removeTempStoryVideoFromStorage 추가 완료
media-temp upload 호출을 repository로 이동 완료
media-temp download 호출을 repository로 이동 완료
media upload 호출을 repository로 이동 완료
media-temp remove 호출을 repository로 이동 완료
upload contentType behavior 유지 완료
processed contentType fallback 유지 완료
temp contentType fallback 유지 완료
upsert false behavior 유지 완료
upload error throw behavior 유지 완료
download error throw behavior 유지 완료
remove behavior 유지 완료
src/modules/media/server/story-video-storage.service.ts createClient 직접 import 제거 완료
src/modules/media/server/story-video-storage.service.ts Supabase env/client 생성 제거 완료
src/modules/media/server/story-video-storage.service.ts storage.from direct access 제거 완료
src/modules/media/server/story-video-storage.service.ts getFileExtension 직접 로직 제거 완료
src/modules/media/server/story-video-storage.service.ts는 path service + storage repository orchestration 담당으로 축소 완료
uploadTempStoryVideo 함수명/export 유지 완료
downloadTempStoryVideo 함수명/export 유지 완료
uploadProcessedStoryVideo 함수명/export 유지 완료
removeTempStoryVideo 함수명/export 유지 완료
story-video-job.service.ts behavior 변경 없음
story-video-processor.server.ts behavior 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
uploadTempStoryVideo 정상
downloadTempStoryVideo 정상
uploadProcessedStoryVideo 정상
removeTempStoryVideo 정상
media bucket fallback 동일
media-temp bucket fallback 동일
temp path format 동일
processed path format 동일
contentType fallback 동일
upsert false behavior 동일
upload error throw behavior 동일
download error throw behavior 동일
remove behavior 동일
story video worker 호출 함수 유지
src/modules/media/server/story-video-storage.service.ts createClient direct import 제거 확인
src/modules/media/server/story-video-storage.service.ts storage.from direct access 제거 확인
src/modules/media/server/story-video-storage.service.ts bucket env direct access 제거 확인
src/modules/media/server/story-video-storage.service.ts getFileExtension 제거 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 story video storage boundary split 관련 3개 파일만 변경함
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success




wave-018
Domain
media

Title
message media access audit and boundary plan

Status
Completed

Goal
message domain의 media table/storage 직접 접근을 감사하고, message media repository/public boundary 전환 범위를 확정한다.

Target Files
Read only:

docs/refactor-audits/media-critical-flow-audit.md
docs/refactor-audits/media-db-storage-access-audit.md
src/modules/message/server/send-message.ts
src/modules/message/server/list-messages.ts
src/modules/message/server/get-secure-message-media.ts
src/modules/message/server/assert-message-attachment-eligibility.ts
src/modules/message/server/create-conversation-message-media.ts

New:

docs/refactor-audits/media-message-boundary-audit.md

Allowed Changes
audit 문서 생성
message media DB direct access 기록
message media storage direct access 기록
attachment eligibility contract 기록
message_id attach timing 기록
image moderation behavior 기록
message media response shape 기록
repository 후보 기록
public boundary 후보 기록
다음 wave 대상 파일 확정

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경

Expected Architecture After Wave
txt

No runtime architecture change.

message media access audit
↓
docs/refactor-audits/media-message-boundary-audit.md

Execution
required source files read 완료
message media DB access 위치 식별 완료
message media storage access 위치 식별 완료
attachment eligibility validation contract 분석 완료
message_id attach timing 분석 완료
image moderation flow 분석 완료
message media response shape 분석 완료
signed URL generation flow 분석 완료
repository 후보 함수 정의 완료
public boundary 후보 정의 완료
next wave target files 확정 완료

Verification
message media DB access 목록 기록 완료
message media storage access 목록 기록 완료
attachment eligibility contract 기록 완료
message_id attach timing 기록 완료
image moderation behavior 기록 완료
message media response shape 기록 완료
next wave target files 확정 완료
code changes not made
runtime behavior 변경 없음

Issues
message domain에서 media table 직접 접근 존재
message domain에서 storage download 직접 수행 (image moderation)
send-message.ts 내부 책임 과다 결합 상태
message media access가 payment/visibility 정책과 향후 결합 가능성 존재

Result
Success


## wave-019 - message media repository boundary

### Goal

message domain 내부에서 직접 접근하던 media table query를 제거하고  
media domain의 repository boundary를 통해 접근하도록 이동한다.

---

### Scope

- src/modules/message/server/send-message.ts
- src/modules/message/server/list-messages.ts
- src/modules/message/server/get-secure-message-media.ts
- src/modules/message/server/assert-message-attachment-eligibility.ts

---

### Implementation

- message/server 내 모든 `from("media")` query 제거
- message-media-repository.ts 신규 생성
- media 관련 select / update query를 repository로 이동
- attach / list / secure media read 모두 repository 경유하도록 변경
- getSecureMessageMedia는 기존 error behavior 유지 위해 OrEmpty variant 사용

---

### Invariants

- message send behavior 동일
- media attach timing 동일
- attachment validation 동일
- signed URL generation 유지
- image moderation flow 유지 (storage + OpenAI untouched)
- response shape 동일
- error message 동일

---

### Result

- message domain → media table 직접 접근 완전 제거
- media repository boundary 완전 형성
- DB access rule 100% 준수 상태 달성

## wave-020 - video moderation media repository and storage split

Status:

Completed

Scope:

- src/workflows/process-video-moderation.ts
- src/modules/media/repositories/media-storage-repository.ts
- src/modules/media/repositories/media-moderation-repository.ts

What changed:

- process-video-moderation.ts 내부의 storage download 직접 접근 제거
- process-video-moderation.ts 내부의 media DB update 직접 접근 제거
- process-video-moderation.ts 내부의 media moderation_status read 직접 접근 제거
- media-storage-repository.ts에 downloadMediaStorageFile 함수 추가
- media-moderation-repository.ts 생성
- markMediaApproved / Rejected / NeedsReview 로직 repository로 이동
- moderation_status read query repository로 이동
- workflow는 orchestration 역할만 유지

What did NOT change:

- OpenAI moderation logic
- ffmpeg / ffprobe processing
- moderation_summary shape
- moderation_completed_at behavior
- status / processing_status / moderation_status 값
- finalizeVideoModerationPost 호출 순서
- fallback outcome behavior
- return shape / error behavior

Verification:

- video moderation download 정상 동작
- mark media approved 정상 동작
- mark media rejected 정상 동작
- mark media needs_review 정상 동작
- moderation_summary shape 동일
- moderation_completed_at behavior 동일
- final moderation statuses read 동일
- resolveVideoModerationOutcome 동일
- finalizeVideoModerationPost 호출 순서 동일
- fallback outcome 동일
- typecheck 통과
- build 통과
- runtime error 없음

Issues:

- 없음

Progress Update Needed:

Yes



wave-021
Domain
media

Title
feed search creator media read boundary audit

Status
Completed

Goal
feed/search/creator의 media read model 직접 접근을 감사하고 media read repository/public boundary 전환 범위를 확정한다.

Target Files
Read only:

src/modules/feed/server/get-home-feed.ts
src/modules/search/server/get-explore-posts.ts
src/modules/creator/server/get-creator-page.ts
src/modules/media/public/create-media-signed-url.ts
docs/refactor-audits/media-db-storage-access-audit.md

New:

docs/refactor-audits/media-read-model-boundary-audit.md

Allowed Changes
audit 문서 생성
feed media read query contract 기록
search explore media read query contract 기록
creator page media read query contract 기록
signed URL input contract 기록
공통 repository 후보 분류
domain-specific 유지 후보 분류
다음 wave target files 확정

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository 생성
storage boundary 변경
src/modules/feed/server/get-home-feed.ts 변경
src/modules/search/server/get-explore-posts.ts 변경
src/modules/creator/server/get-creator-page.ts 변경
src/modules/media/repositories/** 변경
src/app/** 변경
refactor-progress 문서 변경

Expected Architecture After Wave
txt

No runtime architecture change.

feed/search/creator media read audit
↓
media-read-model-boundary-audit.md
↓
wave-022 repository introduction 준비 완료

Execution
required source files read 완료
media DB/storage audit 문서 확인 완료
feed media query select / filter / ordering 분석 완료
feed media slice(0, 3) behavior 확인 완료
feed signed URL input contract 기록 완료
search explore media query select / filter / ordering 분석 완료
search type filter ["image", "video"] 확인 완료
search firstMediaMap / postsWithMedia behavior 확인 완료
search signed URL input contract 기록 완료
creator page media query select / filter / ordering 분석 완료
creator locked preview slice(0, 1) behavior 확인 완료
creator allowPreview signed URL input 확인 완료
signed URL public boundary contract 확인 완료
공통 repository 후보 findReadyPostMediaRowsByPostIds 도출 완료
search domain-specific repository 분리 필요 판단 완료
wave-022 target files 확정 완료
wave-023 scope 분리 완료

Verification
feed media query contract 기록 완료
search media query contract 기록 완료
creator media query contract 기록 완료
ready status filter 기록 완료
image/video filter 기록 완료
sort_order ordering 기록 완료
signed URL input 기록 완료
next wave target files 확정 완료
코드 변경 없음
runtime behavior 변경 없음

Issues
feed/creator는 유사한 media read pattern을 가지지만 search는 discovery logic과 강하게 결합되어 있음
search explore는 media 존재 여부가 노출 조건이므로 조기 공통화 위험 존재
media read query가 domain마다 점진적으로 분기되어 있어 완전 통합은 이후 단계 필요

Result
Success


wave-022
Domain
media

Title
feed search creator media read repository cleanup

Status
Completed

Goal
feed/search/creator server 내부의 media read DB 접근을 media read repository로 이동한다.

Target Files
Existing:

src/modules/feed/server/get-home-feed.ts
src/modules/search/server/get-explore-posts.ts
src/modules/creator/server/get-creator-page.ts

New:

src/modules/media/repositories/media-read-repository.ts

Allowed Changes
media-read-repository.ts 생성
feed media read query를 repository 함수로 이동
creator media read query를 repository 함수로 이동
select columns 유지
filters 유지
sort_order ordering 유지
signed URL mapping과 final item shape는 caller에 유지
기존 return shape/error behavior 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository 외 영역 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/media/server/** 변경
src/modules/media/public/create-media-signed-url.ts 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경

Expected Architecture After Wave
feed / creator server
↓
media-read-repository
↓
Supabase media read

media-read-repository
↓
supabaseAdmin.from("media").select(...)
↓
ready filter + ordering

Execution
required source files read 완료
media-read-model-boundary-audit 확인 완료
media repository 스타일 확인 완료
src/modules/media/repositories/media-read-repository.ts 생성 완료
findReadyPostMediaRowsByPostIds 함수 구현 완료
empty postIds fallback UUID 처리 구현 완료
ready status filter 유지 완료
sort_order ascending 유지 완료
src/modules/feed/server/get-home-feed.ts media query 제거 완료
findReadyPostMediaRowsByPostIds 호출로 전환 완료
mediaMap 생성 로직 유지 완료
slice(0, 3) 유지 완료
signed URL mapping 유지 완료
return shape 유지 완료
src/modules/creator/server/get-creator-page.ts media query 제거 완료
findReadyPostMediaRowsByPostIds 호출로 전환 완료
mediaMap 생성 로직 유지 완료
locked preview slice(0, 1) 유지 완료
unlocked 전체 media 유지 완료
signed URL mapping 유지 완료
allowPreview 유지 완료
return shape 유지 완료
search/explore 영역은 변경하지 않고 유지
DB schema/RLS/SQL/storage 변경 없음
progress 문서 변경 없음

Verification
home feed 정상
creator page 정상
ready media filter 동일
media ordering 동일
fallback UUID 동일
feed slice(0, 3) 동일
creator slice(0, 1) 동일
signed URL input 동일
feed return shape 동일
creator return shape 동일
typecheck 통과 필요
build 통과 필요
runtime error 없음 확인 필요

Issues
search/explore media read DB 접근은 여전히 남아 있음
search/explore는 discovery logic과 결합되어 별도 wave로 분리 필요

Result
Success

wave-023A
Domain
media

Title
story media upload boundary brief

Status
Completed

Goal
story UI의 direct Supabase Storage upload를 제거하기 전에, story 전용 media upload public boundary 설계를 확정한다.

Target Files
Read only:

src/modules/story/ui/CreateStoryComposer.tsx
src/modules/story/ui/EditStoryModal.tsx
src/modules/media/server/upload-media.ts
src/modules/media/public/upload-media-file.ts
src/modules/media/services/media-storage-path-service.ts
src/modules/media/repositories/media-storage-repository.ts
docs/refactor-audits/media-critical-flow-audit.md
docs/refactor-audits/media-db-storage-access-audit.md

New:

None

Allowed Changes
story create/edit direct upload contract 재확인
기존 uploadMediaFile이 story path를 보존할 수 있는지 판단
purpose: "story" 확장과 별도 uploadStoryMediaFile 중 안전한 방향 결정
path format / bucket / upload option / error behavior invariant 확정
implementation wave 범위 확정
코드 변경 없이 실행 계획 확정

Forbidden Changes
코드 수정 금지
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/server/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor progress 문서 변경

Expected Architecture After Wave
txt

No runtime architecture change.

story media upload boundary audit
↓
story create/edit direct upload contract 확정
↓
wave-023B story media upload public boundary 준비 완료

Execution
required source files read 완료
media critical flow audit 확인 완료
media DB/storage direct access audit 확인 완료
src/modules/story/ui/CreateStoryComposer.tsx direct upload contract 확인 완료
src/modules/story/ui/EditStoryModal.tsx direct upload contract 확인 완료
src/modules/media/server/upload-media.ts uploadMedia contract 확인 완료
src/modules/media/public/upload-media-file.ts public wrapper contract 확인 완료
src/modules/media/services/media-storage-path-service.ts path purpose 확인 완료
src/modules/media/repositories/media-storage-repository.ts storage upload option 확인 완료
story create non-trim image/video direct browser Supabase upload 확인 완료
story create trimmed video job flow는 direct upload 대상 아님 확인 완료
story edit replace media direct browser Supabase upload 확인 완료
story create upload path story/{timestamp}-{random}.{ext} 확인 완료
story edit upload path story/{timestamp}-{random}.{ext} 확인 완료
bucket fallback NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media" 확인 완료
cacheControl "3600" 확인 완료
contentType file.type || undefined 확인 완료
upsert false 확인 완료
기존 uploadMediaFile은 purpose "post" | "message"만 지원 확인 완료
기존 post path creator/{uploaderUserId}/posts/... 확인 완료
기존 message path user/{uploaderUserId}/messages/... 확인 완료
기존 uploadMediaFile로는 story path 보존 불가 판단 완료
purpose: "story" 확장 + uploadStoryMediaFile public wrapper 추가 방향 확정 완료
story path format은 story/{timestamp}-{random}.{ext} 유지 필요 확정 완료
storage repository upload option 재사용 가능 확인 완료
wave-023B implementation 범위 확정 완료
코드 변경 없음
progress 문서 변경 없음

Verification
story create upload path 기록 완료
story edit upload path 기록 완료
bucket behavior 기록 완료
upload option 기록 완료
media boundary 설계 후보 기록 완료
기존 uploadMediaFile story path 보존 불가 확인
story 전용 upload public boundary 필요 확인
코드 변경 없음
runtime behavior 변경 없음

Issues
story UI는 현재 browser Supabase client 직접 upload라 media public boundary 밖에 있음
기존 uploadMediaFile은 story path를 보존할 수 없음
story 전용 upload boundary가 필요함
error behavior 보존 주의 필요
후속 구현은 이미 분리된 wave-023B에서 진행 필요

Result
Success


wave-023B
Domain
media

Title
story media upload public boundary

Status
Completed

Goal
story media upload를 위한 media public boundary를 추가하되, story UI caller는 아직 변경하지 않는다.

Target Files
Existing:

src/modules/media/server/upload-media.ts
src/modules/media/public/upload-media-file.ts
src/modules/media/services/media-storage-path-service.ts
src/modules/media/repositories/media-storage-repository.ts
src/modules/media/index.ts

New:

src/modules/media/public/upload-story-media-file.ts

Allowed Changes
story 전용 storage path builder 추가
MediaStoragePurpose에 story purpose 추가
story path format story/{timestamp}-{random}.{ext} 유지
uploadStoryMediaFile public wrapper 추가
wrapper는 기존 uploadMedia를 그대로 호출
기존 uploadMedia validation / return / error behavior 유지
storage upload는 기존 media-storage-repository 그대로 사용
bucket fallback 유지
cacheControl/contentType/upsert behavior 유지
외부 caller import 변경 없음
필요한 경우 media/index.ts public export 추가만 수행

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
story UI caller 변경
src/app/** 변경
src/modules/story/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/media/server/create-media.ts 변경
src/modules/media/server/get-secure-post-media.ts 변경
src/modules/media/server/story-video-job.service.ts 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor progress 문서 변경

Expected Architecture After Wave
media/public/upload-story-media-file
↓
media/server/upload-media.uploadMedia
↓
media/services/media-storage-path-service.buildMediaStoragePath
↓
media/repositories/media-storage-repository.uploadMediaFileToStorage
↓
Supabase Storage upload

story UI caller
↓
direct browser Supabase upload remains temporarily

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
src/modules/media/server/upload-media.ts validation / return / error behavior 확인 완료
src/modules/media/public/upload-media-file.ts wrapper contract 확인 완료
src/modules/media/services/media-storage-path-service.ts existing purpose 확인 완료
src/modules/media/repositories/media-storage-repository.ts upload option 확인 완료
src/modules/media/index.ts public export 현황 확인 완료
MediaStoragePurpose에 "story" 추가 완료
buildMediaStoragePath에 story branch 추가 완료
story storage path format story/{timestamp}-{random}.{ext} 추가 완료
post path creator/{uploaderUserId}/posts/{timestamp}-{random}.{ext} 유지 완료
message path user/{uploaderUserId}/messages/{timestamp}-{random}.{ext} 유지 완료
src/modules/media/public/upload-story-media-file.ts 추가 완료
uploadStoryMediaFile public wrapper 추가 완료
uploadStoryMediaFile은 기존 uploadMedia를 그대로 호출하도록 구성 완료
purpose "story" 전달 완료
validation / try-catch / return mapping 추가 없음
storage upload repository 변경 없음
bucket fallback 변경 없음
cacheControl/contentType/upsert behavior 변경 없음
src/modules/media/index.ts에 public/upload-story-media-file export 추가 완료
external caller import 변경 없음
story UI caller 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
uploadStoryMediaFile wrapper typecheck 정상
story storage path format 동일
bucket fallback 동일
cacheControl/contentType/upsert 동일
기존 post upload behavior 동일
기존 message upload behavior 동일
story/app/post/message caller import 변경 없음 확인
npm run typecheck 통과
npm run build 통과
runtime behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 story media upload public boundary 관련 3개 파일만 변경함
story UI는 아직 browser Supabase direct upload 상태이며 다음 wave에서 별도 전환 필요
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success


wave-023C
Domain
media

Title
CreateStoryComposer upload boundary migration

Status
Completed

Goal
CreateStoryComposer의 direct Supabase Storage upload를 media public story upload boundary로 전환한다.

Target Files
Existing:

src/modules/story/ui/CreateStoryComposer.tsx
src/modules/media/public/upload-story-media-file.ts

New:

None

Allowed Changes
CreateStoryComposer의 현재 uploadStoryFile contract 확인
createSupabaseBrowserClient direct storage upload 제거
uploadStoryMediaFile public boundary 호출로 전환
file validation error behavior 유지
/api/story/create request body shape 유지
trimmed video job flow 변경 없음
UI copy/layout/state behavior 변경 없음
story storage path format 유지
bucket fallback 유지
cacheControl/contentType/upsert behavior 유지
기존 return shape/error behavior 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
src/app/** 변경
src/modules/story/server/** 변경
src/modules/story/lib/** 변경
src/modules/media/server/** 변경
src/modules/media/repositories/** 변경
src/modules/media/services/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor progress 문서 변경

Expected Architecture After Wave
CreateStoryComposer
↓
media/public/upload-story-media-file
↓
media/server/upload-media.uploadMedia
↓
media/services/media-storage-path-service.buildMediaStoragePath
↓
media/repositories/media-storage-repository.uploadMediaFileToStorage
↓
Supabase Storage upload

trimmed video job flow
↓
media/public/queue-story-video-job
↓
existing story video job flow

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media critical flow audit 확인 완료
media DB/storage direct access audit 확인 완료
src/modules/story/ui/CreateStoryComposer.tsx direct upload contract 확인 완료
src/modules/media/public/upload-story-media-file.ts public wrapper contract 확인 완료
src/modules/story/lib/story-create-payload.ts request body contract 확인 완료
CreateStoryComposer의 createSupabaseBrowserClient import 제거 완료
CreateStoryComposer의 MEDIA_BUCKET 제거 완료
CreateStoryComposer의 getFileExtension 제거 완료
CreateStoryComposer의 buildClientUploadPath 제거 완료
CreateStoryComposer의 uploadStoryFile 제거 완료
CreateStoryComposer non-trimmed story upload를 uploadStoryMediaFile public boundary 호출로 전환 완료
uploadStoryMediaFile은 서버에서 requireUser로 현재 user 확인하도록 조정 완료
uploadStoryMediaFile은 uploadMedia({ uploaderUserId: user.id, file, purpose: "story" }) 호출 유지 완료
story storage path format story/{timestamp}-{random}.{ext} 유지 완료
bucket fallback 유지 완료
cacheControl/contentType/upsert behavior 유지 완료
file validation error behavior 유지 완료
/api/story/create request body shape 유지 완료
trimmed video job flow 변경 없음
UI copy/layout/state behavior 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
CreateStoryComposer direct storage upload 제거 확인
CreateStoryComposer createSupabaseBrowserClient 제거 확인
CreateStoryComposer supabase.storage direct access 제거 확인
CreateStoryComposer uploadStoryFile 제거 확인
CreateStoryComposer uploadStoryMediaFile 호출 확인
image story create upload path 동일
non-trimmed story upload behavior 동일
trimmed video job flow 변경 없음
create story request shape 동일
error behavior 동일
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
EditStoryModal.tsx direct browser Supabase upload는 범위 밖이라 유지됨
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success


wave-023D
Domain
media

Title
EditStoryModal upload boundary migration and final grep

Status
Completed

Goal
EditStoryModal의 direct Supabase Storage upload를 media public story upload boundary로 전환하고, story UI direct storage upload 제거를 최종 확인한다.

Target Files
Existing:

src/modules/story/ui/EditStoryModal.tsx
src/modules/story/ui/CreateStoryComposer.tsx
src/modules/media/public/upload-story-media-file.ts
New:

None
Allowed Changes
EditStoryModal의 현재 uploadStoryFile contract 확인
createSupabaseBrowserClient direct storage upload 제거
uploadStoryMediaFile public boundary 호출로 전환
updateStoryAction({ storagePath }) 호출 shape 유지
storagePath가 없을 때 기존 media 유지 behavior 보존
story UI direct storage upload grep 수행
CreateStoryComposer 변경 영향 없음 확인
story storage path format 유지
bucket fallback 유지
cacheControl/contentType/upsert behavior 유지
기존 return shape/error behavior 유지
Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
src/app/** 변경
src/modules/story/server/** 변경
src/modules/media/server/** 변경
src/modules/media/repositories/** 변경
src/modules/media/services/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor progress 문서 변경
Expected Architecture After Wave
EditStoryModal
↓
media/public/upload-story-media-file
↓
media/server/upload-media.uploadMedia
↓
media/services/media-storage-path-service.buildMediaStoragePath
↓
media/repositories/media-storage-repository.uploadMediaFileToStorage
↓
Supabase Storage upload

CreateStoryComposer
↓
media/public/upload-story-media-file
↓
existing story media upload boundary

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media DB/storage direct access audit 확인 완료
src/modules/story/ui/EditStoryModal.tsx direct upload contract 확인 완료
src/modules/story/ui/CreateStoryComposer.tsx uploadStoryMediaFile usage 확인 완료
src/modules/media/public/upload-story-media-file.ts public wrapper contract 확인 완료
src/modules/story/server/update-story-action.ts storagePath update behavior 확인 완료
src/modules/media/services/media-storage-path-service.ts story path format 확인 완료
src/modules/media/server/upload-media.ts validation / return / error behavior 확인 완료
EditStoryModal의 createSupabaseBrowserClient import 제거 완료
EditStoryModal의 MEDIA_BUCKET 제거 완료
EditStoryModal의 getFileExtension 제거 완료
EditStoryModal의 buildClientUploadPath 제거 완료
EditStoryModal의 uploadStoryFile 제거 완료
EditStoryModal replace media upload를 uploadStoryMediaFile public boundary 호출로 전환 완료
uploadStoryMediaFile({ file }) 호출 추가 완료
file validation error behavior 유지 완료
nextStoragePath 초기값 undefined 유지 완료
storagePath undefined 시 기존 media 유지 behavior 보존 완료
updateStoryAction 호출 shape 유지 완료
story storage path format story/{timestamp}-{random}.{ext} 유지 확인 완료
bucket fallback 유지 확인 완료
cacheControl/contentType/upsert behavior 유지 확인 완료
CreateStoryComposer 변경 없음 확인 완료
story UI direct storage upload grep 수행 완료
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
EditStoryModal direct storage upload 제거 확인
EditStoryModal createSupabaseBrowserClient 제거 확인
EditStoryModal supabase.storage direct access 제거 확인
EditStoryModal uploadStoryFile 제거 확인
EditStoryModal uploadStoryMediaFile 호출 확인
replace media upload path 동일
updateStoryAction input shape 동일
storagePath undefined behavior 동일
file validation error behavior 동일
error behavior 동일
CreateStoryComposer uploadStoryMediaFile usage 유지 확인
story UI direct storage upload 0개 확인
npm run typecheck 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 src/modules/story/ui/EditStoryModal.tsx만 변경함
src/modules/story/ui/CreateStoryComposer.tsx에는 기존 worktree 변경이 이미 존재함
src/modules/media/public/upload-story-media-file.ts는 git 기준 untracked 상태로 보이나 이번 wave에서 수정하지 않음
media-refactor-progress.md는 git 기준 untracked로 보이나 이번 wave에서 수정하지 않음
첫 build는 sandbox 내 Turbopack port binding 제한으로 실패했고, escalated build 재실행에서 통과함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success



wave-024B
Domain
media

Title
media final grep and public contract audit

Status
Completed

Goal
media domain 종료 조건을 기준으로 final grep과 public contract audit을 수행하고, media domain 완료 가능 여부와 남은 close-out debt를 확정한다.

Target Files
Existing:

src/modules/media/**
src/app/**
src/modules/**
src/workflows/**
docs/refactor-audits/**
New:

docs/refactor-audits/media-final-contract-audit.md
Allowed Changes
media final contract audit 문서 생성
media import boundary 최종 grep 결과 기록
media DB access 최종 grep 결과 기록
media storage access 최종 grep 결과 기록
media public/index export contract 기록
남은 blocker / debt 분류
media domain close 가능 여부 기록
typecheck / build 검증 결과 기록
Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경
Expected Architecture After Wave
No runtime architecture change.

media final grep
↓
docs/refactor-audits/media-final-contract-audit.md
↓
media close-out blockers 확정
Execution
required source files read 완료
media critical flow audit 확인 완료
media import boundary audit 확인 완료
media DB/storage direct access audit 확인 완료
media message boundary audit 확인 완료
media read model boundary audit 확인 완료
media story upload audit 문서 미존재 확인 완료
latest grep results 생성 완료
external media server/lib direct import grep 완료
external media server/lib direct import 0개 확인 완료
media repositories direct import grep 완료
media DB access grep 완료
media storage access grep 완료
src/modules/media/index.ts export 확인 완료
src/modules/media/public 파일 목록 확인 완료
src/modules/media/repositories 파일 목록 확인 완료
media index가 types + public exports only 상태임 확인 완료
media barrel server export 0개 확인 완료
media barrel repository export 0개 확인 완료
media DB access repository 위치 확인 완료
search explore direct media DB access blocker 기록 완료
post repositories media DB access post-domain debt로 분류 완료
media storage access repository 위치 확인 완료
message image moderation direct storage download blocker 기록 완료
feed composer direct storage upload feed/post authoring debt로 분류 완료
profile avatar upload profile/avatar domain debt로 분류 완료
cross-domain media repository direct import debt 기록 완료
production flow checklist 작성 완료
media domain close decision 작성 완료
docs/refactor-audits/media-final-contract-audit.md 생성 완료
refactor-progress 문서 변경 없음
코드 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음

Verification
external media server/lib direct import 0개 확인
media index server export 0개 확인
media index repository export 0개 확인
media public contract 확인
media DB access repository-only partial 확인 및 blocker 기록
media storage access boundary-only partial 확인 및 blocker 기록
create media flow public/repository boundary 기록 완료
upload media flow public/storage repository boundary 기록 완료
signed URL flow public/policy/storage repository boundary 기록 완료
secure post media flow repository/signed URL boundary 기록 완료
message media remaining blocker 기록 완료
story video job / processor / storage boundary 기록 완료
video moderation remaining public wrapper debt 기록 완료
feed / creator media read repository boundary 기록 완료
search explore media read blocker 기록 완료
npm run typecheck -- --incremental false 통과
첫 npm run build는 sandbox port-binding 제한으로 실패
승인된 npm run build 재실행 통과
runtime architecture behavior 변경 없음

Issues
media domain은 strict final goal 기준으로 아직 fully closed 아님
search/server/get-explore-posts.ts media direct DB access 남음
message/server/send-message.ts image moderation storage download 직접 접근 남음
feed/ui/FeedComposer.tsx direct storage upload 남음
app/profile/edit/page.tsx avatar upload는 profile/avatar domain debt로 분류됨
feed/creator/message/workflow에서 media repository direct import 남음
media public wrapper 일부는 server/lib compatibility layer를 감쌈
profile avatar storage는 media close blocker가 아니라 profile domain 후보로 보류 권장

Result
Success

wave-025
Domain
media

Title
search explore media read repository boundary

Status
Completed

Goal
src/modules/search/server/get-explore-posts.ts 내부의 media direct DB access를 media read repository boundary로 이동한다.

Target Files
Existing:

src/modules/search/server/get-explore-posts.ts
src/modules/media/repositories/media-read-repository.ts
docs/refactor-audits/media-final-contract-audit.md
docs/refactor-audits/media-read-model-boundary-audit.md

New:

None

Allowed Changes
get-explore-posts.ts의 media query contract 확인
media-read-repository.ts에 search explore 전용 read 함수 추가
get-explore-posts.ts의 supabaseAdmin.from("media") 직접 접근만 repository 호출로 전환
select columns 유지
filters 유지
sort_order ordering 유지
mediaMap / firstMediaMap / postsWithMedia filtering 로직 유지
createMediaSignedUrl 호출 인자 유지
response shape / error behavior / discovery 노출 조건 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/creator/** 변경
src/modules/media/server/** 변경
src/modules/media/public/create-media-signed-url.ts 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
search server
↓
media-read-repository
↓
Supabase media read

media-read-repository
↓
supabaseAdmin.from("media").select(...)
↓
post_id in visiblePostIds
↓
type in ["image", "video"]
↓
status ready filter
↓
sort_order ascending

Execution
required source files read 완료
docs/refactor-audits/media-final-contract-audit.md 확인 완료
docs/refactor-audits/media-read-model-boundary-audit.md 확인 완료
src/modules/search/server/get-explore-posts.ts media query contract 확인 완료
src/modules/media/repositories/media-read-repository.ts existing feed/creator read function 확인 완료
src/modules/media/public/create-media-signed-url.ts read-only contract 확인 완료
search explore direct media DB access 위치 확인 완료
select columns 확인 완료
type filter ["image", "video"] 확인 완료
status ready filter 확인 완료
sort_order ascending ordering 확인 완료
mediaMap / firstMediaMap / postsWithMedia behavior 확인 완료
signed URL input contract 확인 완료
src/modules/media/repositories/media-read-repository.ts에 READY_EXPLORE_POST_MEDIA_SELECT_COLUMNS 추가 완료
ReadyExplorePostMediaRow type 추가 완료
findReadyExplorePostMediaRowsByPostIds repository 함수 추가 완료
Supabase media select query를 repository로 이동 완료
select columns 유지 완료
post_id filter 유지 완료
type filter ["image", "video"] 유지 완료
status ready filter 유지 완료
sort_order ascending 유지 완료
error throw behavior 유지 완료
data null fallback empty array behavior 유지 완료
src/modules/search/server/get-explore-posts.ts에서 media direct DB access 제거 완료
src/modules/search/server/get-explore-posts.ts에서 from("media") direct access 제거 확인 완료
getExplorePosts는 findReadyExplorePostMediaRowsByPostIds 호출로 전환 완료
mediaMap 생성 로직 유지 완료
firstMediaMap 생성 로직 유지 완료
postsWithMedia filtering 유지 완료
filteredPostIds behavior 유지 완료
createMediaSignedUrl 호출 인자 유지 완료
response shape 유지 완료
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
search explore media query repository 경유 확인
get-explore-posts.ts from("media") 제거 확인
select columns 동일
type filter ["image", "video"] 동일
status ready filter 동일
sort_order ordering 동일
firstMediaMap behavior 동일
postsWithMedia filtering 동일
signed URL input 동일
response shape 동일
error behavior 동일
npm run typecheck -- --incremental false 통과
첫 npm run build는 sandbox port-binding 제한으로 실패
승인된 npm run build 재실행 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 search explore media read repository boundary 관련 2개 파일만 변경함
git diff 기준으로 이전 wave의 createMediaSignedUrl public import 변경도 같이 보일 수 있음
src/modules/media/repositories/media-read-repository.ts 안의 from("media")는 repository layer DB access라 정상임
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success


wave-026
Domain
media

Title
message image moderation storage download boundary

Status
Completed

Goal
src/modules/message/server/send-message.ts 내부의 image moderation storage direct access를 media storage repository boundary로 이동한다.

Target Files
Existing:

src/modules/message/server/send-message.ts
src/modules/media/repositories/media-storage-repository.ts

New:

None

Allowed Changes
send-message.ts의 image moderation storage download contract 확인
media-storage-repository.ts의 downloadMediaStorageFile 재사용 가능성 확인
downloadMediaStorageFile에 optional missing data error message 추가
send-message.ts의 supabaseAdmin.storage direct download 제거
send-message.ts에서 downloadMediaStorageFile repository boundary 호출로 전환
OpenAI moderation logic 유지
message send behavior 유지
response shape 유지
error behavior 유지
storage bucket / policy 변경 금지
progress 문서 변경 금지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
message send flow 변경
message attach timing 변경
message notification behavior 변경
OpenAI moderation model/input 변경
signed URL behavior 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/payment/** 변경
src/modules/subscription/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
message/server/send-message
↓
media/repositories/message-media-repository.findModerationMediaRowsByIds
↓
Supabase media read

message/server/send-message
↓
media/repositories/media-storage-repository.downloadMediaStorageFile
↓
Supabase Storage download

message/server/send-message
↓
OpenAI moderation

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
project baseline rule 확인 완료
DB architecture audit rule 확인 완료
media refactor progress wave-026 scope 확인 완료
docs/refactor-audits/media-final-contract-audit.md 확인 완료
docs/refactor-audits/media-message-boundary-audit.md 확인 완료
src/modules/message/server/send-message.ts image moderation flow 확인 완료
src/modules/message/server/send-message.ts direct supabaseAdmin.storage download 확인 완료
src/modules/message/server/send-message.ts MEDIA_BUCKET 직접 사용 확인 완료
src/modules/message/server/send-message.ts OpenAI moderation model 확인 완료
src/modules/message/server/send-message.ts IMAGE_BLOCKED error behavior 확인 완료
src/modules/message/server/send-message.ts Failed to load image for moderation error behavior 확인 완료
src/modules/media/repositories/media-storage-repository.ts downloadMediaStorageFile 확인 완료
기존 downloadMediaStorageFile 기본 missing data error message 확인 완료
downloadMediaStorageFile에 optional missingDataErrorMessage 추가 완료
기존 video moderation default error message 유지 완료
src/modules/message/server/send-message.ts에서 supabaseAdmin import 제거 완료
src/modules/message/server/send-message.ts에서 MEDIA_BUCKET 제거 완료
src/modules/message/server/send-message.ts에서 direct storage download 제거 완료
src/modules/message/server/send-message.ts에서 downloadMediaStorageFile import 추가 완료
checkMessageImageSafety storage download를 repository boundary 호출로 전환 완료
missingDataErrorMessage로 Failed to load image for moderation 전달 완료
arrayBuffer → base64 → data URL 변환 유지 완료
OpenAI moderation input shape 유지 완료
omni-moderation-latest 유지 완료
Failed to moderate image error behavior 유지 완료
IMAGE_BLOCKED error behavior 유지 완료
message send flow 순서 유지 완료
message attach timing 유지 완료
notification behavior 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
send-message.ts supabaseAdmin 제거 확인
send-message.ts MEDIA_BUCKET 제거 확인
send-message.ts direct supabase storage download 제거 확인
send-message.ts .download direct call 제거 확인
message image moderation repository boundary 경유 확인
image mime filter 유지 확인
OpenAI moderation model 동일
OpenAI moderation input shape 동일
Failed to load image for moderation error message 동일
Failed to moderate image error message 동일
IMAGE_BLOCKED error message 동일
video moderation download default error message 동일
npm run typecheck -- --incremental false 통과
첫 npm run build는 sandbox port-binding 제한으로 실패
승인된 npm run build 재실행 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 message image moderation storage download boundary 관련 2개 파일만 변경함
src/modules/media/repositories/media-storage-repository.ts는 git 기준 untracked 상태로 보이나 이번 wave에서 downloadMediaStorageFile optional error message만 최소 확장함
git diff 기준으로 이전 wave의 message media repository boundary 변경도 같이 보일 수 있음
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success



wave-027
Domain
media

Title
feed composer direct storage upload boundary

Status
Completed

Goal
src/modules/feed/ui/FeedComposer.tsx의 direct Supabase Storage upload를 media public boundary로 이동한다.

Target Files
Existing:

src/modules/feed/ui/FeedComposer.tsx
src/modules/media/services/media-storage-path-service.ts
src/modules/media/index.ts

New:

src/modules/media/public/upload-feed-composer-media.ts

Allowed Changes
FeedComposer의 direct storage upload contract 확인
FeedComposer의 createSupabaseBrowserClient direct storage upload 제거
FeedComposer의 MEDIA_BUCKET 직접 사용 제거
FeedComposer의 client-side storage path builder 제거
media public feed composer upload boundary 추가
기존 upload behavior 유지
기존 storage path format 유지
기존 upload option 유지
기존 response shape 유지
기존 UI behavior 유지
storage bucket / policy 변경 금지
progress 문서 변경 금지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
post create flow 변경
feed composer UI behavior 변경
signed URL behavior 변경
src/app/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
src/modules/payment/** 변경
src/modules/subscription/** 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
FeedComposer
↓
media/public/upload-feed-composer-media.uploadFeedComposerMedia
↓
media/server/upload-media.uploadMedia
↓
media/services/media-storage-path-service.buildMediaStoragePath
↓
media/repositories/media-storage-repository.uploadMediaFileToStorage
↓
Supabase Storage upload

FeedComposer
↓
post/public/create-feed-post-action
↓
existing post create flow

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media refactor progress wave-027 scope 확인 완료
src/modules/feed/ui/FeedComposer.tsx direct storage upload flow 확인 완료
src/modules/feed/ui/FeedComposer.tsx createSupabaseBrowserClient direct import 확인 완료
src/modules/feed/ui/FeedComposer.tsx MEDIA_BUCKET 직접 사용 확인 완료
src/modules/feed/ui/FeedComposer.tsx buildClientUploadPath 확인 완료
src/modules/feed/ui/FeedComposer.tsx 기존 storage path format 확인 완료
src/modules/feed/ui/FeedComposer.tsx 기존 upload option 확인 완료
src/modules/feed/ui/FeedComposer.tsx 기존 CreatePostUploadedMediaInput response shape 확인 완료
src/modules/media/services/media-storage-path-service.ts existing purpose 확인 완료
src/modules/media/public/upload-story-media-file.ts public wrapper pattern 확인 완료
src/modules/media/public/upload-media.ts public wrapper pattern 확인 완료
MediaStoragePurpose에 feed-composer 추가 완료
buildMediaStoragePath에 feed-composer branch 추가 완료
feed composer storage path format creator/{timestamp}-{random}.{ext} 유지 완료
src/modules/media/public/upload-feed-composer-media.ts 추가 완료
uploadFeedComposerMedia public boundary 추가 완료
uploadFeedComposerMedia는 기존 uploadMedia를 호출하도록 구성 완료
uploadFeedComposerMedia에서 purpose feed-composer 전달 완료
uploadFeedComposerMedia return shape를 CreatePostUploadedMediaInput[]로 유지 완료
image / video / audio / file type mapping 유지 완료
mimeType / size / originalName mapping 유지 완료
src/modules/media/index.ts에 public/upload-feed-composer-media export 추가 완료
src/modules/feed/ui/FeedComposer.tsx에서 createSupabaseBrowserClient import 제거 완료
src/modules/feed/ui/FeedComposer.tsx에서 MEDIA_BUCKET 제거 완료
src/modules/feed/ui/FeedComposer.tsx에서 getFileExtension 제거 완료
src/modules/feed/ui/FeedComposer.tsx에서 buildClientUploadPath 제거 완료
src/modules/feed/ui/FeedComposer.tsx에서 direct supabase.storage upload 제거 완료
src/modules/feed/ui/FeedComposer.tsx uploadFilesDirect를 uploadFeedComposerMedia 호출로 전환 완료
FeedComposer selectedItems mapping 유지 완료
createFeedPostAction request shape 유지 완료
text / visibility / userId / files 전달 shape 유지 완료
UI copy/layout/state behavior 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
FeedComposer createSupabaseBrowserClient 제거 확인
FeedComposer MEDIA_BUCKET 제거 확인
FeedComposer direct supabase storage upload 제거 확인
FeedComposer storage.from direct access 제거 확인
FeedComposer uploadFeedComposerMedia 호출 확인
feed composer storage path format 동일
upload cacheControl 동일
upload contentType 동일
upload upsert 동일
CreatePostUploadedMediaInput[] response shape 동일
image / video / audio / file type mapping 동일
createFeedPostAction input shape 동일
feed composer UI behavior 변경 없음
feed/story/message/search direct storage grep 확인
npm run typecheck -- --incremental false 통과
첫 npm run build는 sandbox port-binding 제한으로 실패
승인된 npm run build 재실행 통과
runtime architecture behavior 변경 없음

Issues
worktree에 기존 변경이 매우 많이 존재함
이번 wave는 feed composer direct storage upload boundary 관련 4개 파일만 변경함
src/modules/media/services/media-storage-path-service.ts는 git 기준 untracked 상태로 보이나 이번 wave에서 feed-composer purpose만 최소 확장함
git diff 기준으로 이전 wave의 media index export cleanup 변경도 같이 보일 수 있음
build 중 기존 DeprecationWarning(url.parse) 출력 있음
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success

wave-028
Domain
media

Title
message media public boundary audit

Status
Completed

Goal
message domain에서 media repository를 직접 import하는 지점을 감사하고 public boundary 전환 범위를 확정한다.

Target Files
Read only:

docs/refactor-audits/media-message-boundary-audit.md
docs/refactor-audits/media-final-contract-audit.md
src/modules/message/server/send-message.ts
src/modules/message/server/list-messages.ts
src/modules/message/server/get-secure-message-media.ts
src/modules/message/server/assert-message-attachment-eligibility.ts
src/modules/message/server/create-conversation-message-media.ts
src/modules/media/repositories/message-media-repository.ts
src/modules/media/repositories/media-storage-repository.ts
src/modules/media/public/**

New:

None

Allowed Changes
message media repository direct import 감사
message media storage repository direct import 감사
attach / list / secure read / moderation read 분류
기존 repository 함수 input / output / error behavior 기록
public wrapper 후보 정의
message send flow와 list/read flow 분리
다음 implementation wave 범위 확정
코드 변경 없이 실행 계획 확정

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
paid message / payment flow 변경
refactor-progress 문서 변경

Expected Architecture After Wave
txt

No runtime architecture change.

message media public boundary audit
↓
message media repository direct import contract 확정
↓
wave-029 message media read public boundary 준비 완료

Execution
required source files read 완료
media message boundary audit 확인 완료
media final contract audit 확인 완료
message media repository direct import grep 완료
message media storage repository direct import grep 완료
src/modules/message/server/send-message.ts media repository usage 확인 완료
src/modules/message/server/list-messages.ts media repository usage 확인 완료
src/modules/message/server/get-secure-message-media.ts media repository usage 확인 완료
src/modules/message/server/assert-message-attachment-eligibility.ts media repository usage 확인 완료
src/modules/message/server/create-conversation-message-media.ts public signed URL boundary 사용 확인 완료
src/modules/media/repositories/message-media-repository.ts contract 확인 완료
src/modules/media/repositories/media-storage-repository.ts download contract 확인 완료
media public 파일 목록 확인 완료
message media direct repository import 4개 파일 확인 완료
send-message.ts moderation read / storage download / attach write / response read 책임 분류 완료
list-messages.ts list read flow 분류 완료
get-secure-message-media.ts secure read flow 분류 완료
assert-message-attachment-eligibility.ts attachment validation read flow 분류 완료
create-conversation-message-media.ts는 repository direct import 없음 확인 완료
public wrapper 후보 확정 완료
wave-029 read-only boundary 우선 순서 확정 완료
wave-030 attachment eligibility read boundary 후보 확정 완료
wave-031 attach write boundary 후보 확정 완료
wave-032 moderation media read boundary 후보 확정 완료
wave-033 storage download public boundary 후보 확정 완료
paid message / payment flow 변경 금지 분류 완료
코드 변경 없음
progress 문서 변경 없음

Verification
message media repository direct import 목록 기록 완료
attach media contract 기록 완료
list message media contract 기록 완료
secure message media contract 기록 완료
moderation media read contract 기록 완료
storage download contract 기록 완료
public wrapper 후보 기록 완료
다음 implementation wave target 확정 완료
external media server/lib direct import 문제 없음 확인
코드 변경 없음
runtime behavior 변경 없음

Issues
message domain에서 media repository direct import가 남아 있음
send-message.ts는 moderation read / storage download / attach write / response read 책임이 섞여 있음
list/secure read boundary부터 분리하는 것이 가장 안전함
attachment eligibility는 message permission과 결합되어 policy 이동 금지
attach write는 message insert 이후 timing 유지 필요
moderation read와 storage download는 OpenAI moderation behavior와 분리해서 작은 wave로 처리 필요
paid message / payment flow는 이번 boundary 작업에서 변경 금지

Result
Success

wave-029
Domain
media

Title
feed composer upload boundary audit

Status
Completed

Goal
FeedComposer의 browser Supabase direct upload를 제거하기 전에 현재 upload contract와 media boundary 전환 범위를 확정한다.

Target Files
Existing:

src/modules/feed/ui/FeedComposer.tsx
src/modules/post/public/create-feed-post-action.ts
src/modules/post/types.ts
src/modules/media/public/upload-media-file.ts
src/modules/media/public/upload-media.ts
src/modules/media/server/upload-media.ts
src/modules/media/services/media-storage-path-service.ts
src/modules/media/repositories/media-storage-repository.ts
docs/refactor-audits/media-final-contract-audit.md

New:

docs/refactor-audits/media-feed-composer-upload-boundary-audit.md

Allowed Changes
audit 문서 생성
FeedComposer upload contract 기록
storage path format 기록
upload option 기록
return shape 기록
createFeedPostAction 연결 contract 기록
media boundary 적합성 판단
다음 wave 범위 정의

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경

Expected Architecture After Wave
txt

No runtime architecture change.

FeedComposer upload boundary audit
↓
docs/refactor-audits/media-feed-composer-upload-boundary-audit.md

Execution
required source files read 완료
FeedComposer upload flow 분석 완료
uploadFilesDirect → uploadFeedComposerMedia → uploadMedia 흐름 확인 완료
browser direct Supabase upload 미사용 확인 완료
uploadFeedComposerMedia 내부 contract 확인 완료
feed-composer purpose path 확인 완료
storage path format 기록 완료
upload option cacheControl/contentType/upsert behavior 기록 완료
bucket fallback behavior 기록 완료
return CreatePostUploadedMediaInput[] shape 기록 완료
type resolve 규칙 기록 완료
createFeedPostAction caller-side contract 기록 완료
media public boundary 적합성 판단 완료
feed-composer upload path 유지 가능성 확인 완료
추가 public wrapper 불필요 판단 완료
다음 implementation wave 범위 정의 완료

Verification
FeedComposer upload contract 기록 완료
storage path format 기록 완료
upload option 기록 완료
return shape 기록 완료
createFeedPostAction contract 기록 완료
media boundary 후보 판단 완료
runtime behavior 변경 없음 확인
코드 변경 없음 확인

Issues
upload-feed-composer-media 내부에서 media/server/upload-media 직접 import 존재
media 내부 dependency는 완전 분리 상태 아님 (old + new coexistence)
createFeedPostAction server 내부 contract는 이번 wave에서 확인되지 않음

Result
Success

wave-030A - feed composer upload use-case shell

Goal
src/modules/media/public/upload-feed-composer-media.ts 내부의 media/server/upload-media 직접 import를 제거하기 위해 feed composer upload use-case shell을 추가한다.

Changes
- src/modules/media/use-cases/upload-feed-composer-media.ts 신규 생성
- src/modules/media/public/upload-feed-composer-media.ts → use-case 호출 구조로 변경
- resolveUploadedMediaType 로직 use-case로 이동
- uploadFeedComposerMedia 구현 use-case로 이동
- public → server 직접 import 제거

Verification
- public → server 직접 import 제거 확인
- public → use-case 호출 확인
- use-case → server upload 호출 유지 확인
- files.length === 0 behavior 동일
- resolveUploadedMediaType behavior 동일
- CreatePostUploadedMediaInput[] shape 동일
- storage path format 동일
- upload option 동일
- FeedComposer 변경 없음
- typecheck 통과
- build 통과
- runtime error 없음

Behavior Changed:
- None

Issues:
- None

Progress Update Needed:
- Yes


wave-030B

Domain
media

Title
generic upload media use-case

Status
Completed

Goal
src/modules/media/server/upload-media.ts 내부의 upload orchestration을 media use-case로 이동하고, server 파일은 compatibility wrapper로 유지한다.

Target Files
Existing:

src/modules/media/server/upload-media.ts
src/modules/media/services/media-storage-path-service.ts
src/modules/media/repositories/media-storage-repository.ts
src/modules/media/use-cases/upload-feed-composer-media.ts
src/modules/media/public/upload-media-file.ts
src/modules/media/public/upload-feed-composer-media.ts

New:

src/modules/media/use-cases/upload-media.ts

Allowed Changes
uploadMedia validation contract 유지
uploaderUserId.trim() behavior 유지
uploaderUserId is required error 유지
file is required error 유지
file is empty error 유지
purpose default "post" 유지
buildMediaStoragePath 호출 유지
uploadMediaFileToStorage 호출 유지
upload orchestration을 use-case로 이동
server는 compatibility wrapper로 축소
기존 함수명/export 유지
public wrapper return shape 유지

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split 변경
storage boundary 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
DB schema / RLS / SQL / storage 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave

public
↓
use-case (upload-media)
↓
server (compatibility wrapper)
↓
services / repositories
↓
Supabase Storage

Execution
required source files read 완료
src/modules/media/server/upload-media.ts validation / orchestration 확인 완료
src/modules/media/services/media-storage-path-service.ts path 생성 로직 확인 완료
src/modules/media/repositories/media-storage-repository.ts storage upload 호출 확인 완료
src/modules/media/use-cases/upload-feed-composer-media.ts 기존 use-case 구조 확인 완료
src/modules/media/public/upload-media-file.ts public wrapper 구조 확인 완료
src/modules/media/public/upload-feed-composer-media.ts public → use-case 구조 확인 완료
src/modules/media/use-cases/upload-media.ts 신규 생성 완료
uploadMediaUseCase에 기존 uploadMedia 로직 이동 완료
validation / error / return shape 유지 완료
buildMediaStoragePath 호출 유지 완료
uploadMediaFileToStorage 호출 유지 완료
src/modules/media/server/upload-media.ts에서 orchestration 제거 완료
server uploadMedia는 use-case 호출 wrapper로 변경 완료
src/modules/media/use-cases/upload-feed-composer-media.ts import를 use-case로 전환 완료
src/modules/media/public/upload-media-file.ts import를 use-case로 전환 완료
public → server 직접 import 제거 완료
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
use-case uploadMedia 생성 확인
server uploadMedia export 유지 확인
validation error behavior 동일
purpose default "post" 동일
storage path format 동일
bucket fallback 동일
cacheControl/contentType/upsert 동일
upload error throw behavior 동일
public wrapper return shape 동일
feed composer upload behavior 동일
typecheck 통과
build 통과
runtime architecture behavior 변경 없음

Issues
없음

Result
Success

wave-030C

Domain
media

Title
upload public wrappers use-case alignment

Status
Completed

Goal
media public upload wrappers가 media/server/upload-media가 아니라 media/use-cases/upload-media 또는 전용 use-case를 경유하도록 정렬한다.

Target Files
Existing:

src/modules/media/public/upload-media-file.ts
src/modules/media/public/upload-feed-composer-media.ts
src/modules/media/use-cases/upload-media.ts
src/modules/media/use-cases/upload-feed-composer-media.ts
src/modules/media/server/upload-media.ts
src/modules/media/index.ts

New:

None

Allowed Changes
public upload wrapper들의 import boundary 확인
upload-media-file.ts의 use-case 호출 구조 확인
upload-feed-composer-media.ts의 전용 use-case 호출 구조 확인
use-case → repository/service 호출 구조 확인
server upload-media.ts가 compatibility wrapper 상태인지 확인
public → server 직접 import 존재 여부 검증
media/index.ts export 구조 검증
기존 함수명/export/return shape/error behavior 유지 확인

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split 변경
storage boundary 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
DB schema / RLS / SQL / storage 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
public upload wrappers
↓
media/use-cases/*
↓
media/server (compatibility wrapper)
↓
services / repositories
↓
Supabase Storage

No DB/storage behavior change.

Execution
required source files read 완료
upload-media-file.ts use-case 호출 구조 확인 완료
upload-feed-composer-media.ts use-case 호출 구조 확인 완료
upload-feed-composer-media use-case 내부 uploadMediaUseCase 호출 구조 확인 완료
upload-media use-case validation / path / repository 호출 구조 확인 완료
media/server/upload-media.ts compatibility wrapper 상태 확인 완료
public → server 직접 import 0개 확인 완료
media/index.ts public export only 상태 확인 완료
public wrapper return shape 동일 확인 완료
storage path format 동일 확인 완료
upload option 동일 확인 완료
error behavior 동일 확인 완료
코드 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
public upload wrapper → server 직접 import 0개 확인
public upload wrapper → use-case 호출 확인
existing public export 유지 확인
media index public/type export only 확인
uploadMediaFile return shape 동일
uploadFeedComposerMedia return shape 동일
storage path format 동일
upload option 동일
error behavior 동일
typecheck 통과
build 통과
runtime error 없음

Issues
없음

Result
Success

wave-030D

Domain
media

Title
feed composer upload final boundary grep

Status
Completed

Goal
FeedComposer upload flow가 media public boundary → use-case → repository/service 구조를 완전히 따르는지 최종 grep 기반으로 검증한다.

Target Files
Existing:

src/modules/feed/ui/FeedComposer.tsx
src/modules/media/public/upload-feed-composer-media.ts
src/modules/media/public/upload-media-file.ts
src/modules/media/use-cases/upload-feed-composer-media.ts
src/modules/media/use-cases/upload-media.ts
src/modules/media/server/upload-media.ts
src/modules/media/index.ts

New:

None

Allowed Changes
boundary grep 및 구조 검증
public → use-case → repository 흐름 확인
public → server 직접 import 여부 검증
use-case → server dependency 구조 확인
server compatibility wrapper 상태 확인
media index export 구조 확인
코드 변경 없이 구조 검증

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
repository split 변경
storage boundary 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
DB schema / RLS / SQL / storage 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave

public
↓
use-case
↓
server (compatibility wrapper)
↓
services / repositories
↓
Supabase Storage

No DB/storage behavior change.

Execution
required source files read 완료
FeedComposer upload flow 분석 완료
upload-feed-composer-media → use-case 호출 구조 확인 완료
upload-media-file → use-case 호출 구조 확인 완료
upload-feed-composer-media use-case 내부 uploadMediaUseCase 호출 확인 완료
uploadMediaUseCase → service / repository 호출 구조 확인 완료
media/server/upload-media.ts compatibility wrapper 상태 확인 완료
public → server 직접 import 0개 확인 완료
FeedComposer direct storage upload 0개 확인 완료
media index export 구조 확인 완료
media index server export 0개 확인 완료
media index repository export 0개 확인 완료
코드 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
FeedComposer → public 호출 확인
public → use-case 호출 확인
use-case → repository/service 호출 확인
public → server 직접 import 0개 확인
FeedComposer direct storage upload 0개 확인
media index server export 0개 확인
media index repository export 0개 확인
upload return shape 동일
storage path format 동일
upload option 동일
error behavior 동일
typecheck 통과
build 통과
runtime error 없음

Issues
public/upload-media.ts 일부 내부에서 server dependency 존재 (scope 외)
public/upload-story-media-file.ts 일부 내부에서 server dependency 존재 (scope 외)

Result
Success

## wave-030E - feed composer upload behavior verification

### Goal

wave-030A~030D 이후 FeedComposer upload behavior가 기존 contract와 동일한지 최종 검증한다.

### Scope

- src/modules/feed/ui/FeedComposer.tsx
- src/modules/media/public/upload-feed-composer-media.ts
- src/modules/media/use-cases/upload-feed-composer-media.ts
- src/modules/media/use-cases/upload-media.ts
- src/modules/media/services/media-storage-path-service.ts
- src/modules/media/repositories/media-storage-repository.ts
- src/modules/post/types.ts
- docs/refactor-audits/media-feed-composer-upload-boundary-audit.md

### Changes

- None (verification only)

### Verification

- FeedComposer submit flow 정상 동작 확인
- selected file preview / drag / remove / clear behavior 변경 없음 확인
- uploadFilesDirect return shape 동일 확인
- createFeedPostAction input 동일 확인
- storage path contract 유지 확인 (creator/${now}-${random}${safeExtension})
- bucket fallback 동일 확인 (NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media")
- upload option 유지 확인 (cacheControl, contentType, upsert)
- CreatePostUploadedMediaInput[] shape 동일 확인
- type resolve 규칙 유지 확인 (image/video/audio/file)
- empty files behavior 동일 확인
- upload error behavior 동일 확인

### Issues

- typecheck/build 실행은 실제 runtime 환경에서 별도 검증 필요
- media 내부 server compatibility layer는 아직 제거되지 않은 상태

### Decision

- FeedComposer upload contract는 안정적으로 유지됨
- behavior 변경 없이 구조 유지 가능
- server compatibility wrapper 제거 여부는 다음 wave에서 판단

### Progress Update Needed

- Yes




wave-031

Domain
media

Title
profile avatar storage audit

Status
Completed

Goal
profile avatar storage direct access를 media close blocker에서 분리하고 profile/avatar domain debt로 확정한다.

Target Files
Read only:

docs/refactor-audits/media-final-contract-audit.md
src/app/profile/edit/page.tsx
src/modules/profile/server/update-profile.ts
src/modules/profile/types.ts
src/modules/media/index.ts

New:

docs/refactor-audits/profile-avatar-storage-boundary-audit.md

Allowed Changes
audit 문서 생성
avatar upload flow 기록
avatars bucket usage 기록
public URL behavior 기록
updateProfile avatarUrl contract 기록
media domain ownership 판단
profile/avatar domain debt 분류

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경

Expected Architecture After Wave

No runtime architecture change.

profile avatar storage audit
↓
docs/refactor-audits/profile-avatar-storage-boundary-audit.md

Execution
required source files read 완료
media final contract audit 확인 완료
src/app/profile/edit/page.tsx avatar upload flow 확인 완료
avatars bucket usage 확인 완료
storage path format 확인 완료
upload option 확인 완료
getPublicUrl behavior 확인 완료
updateProfile avatarUrl contract 확인 완료
profile/types avatarUrl type 확인 완료
media/index.ts public boundary 확인 완료
media domain과 avatar flow 분리 필요 확인 완료
avatar upload는 media domain이 아닌 profile/avatar domain 책임으로 판단 완료
profile/avatar domain debt로 분류 완료
코드 변경 없음
DB schema/RLS/SQL/storage 변경 없음
progress 문서 변경 없음

Verification
avatar upload flow 기록 완료
avatars bucket usage 기록 완료
public URL behavior 기록 완료
updateProfile avatarUrl contract 기록 완료
media close blocker 아님 확인 완료
profile/avatar domain debt 분류 완료
코드 변경 없음
runtime behavior 변경 없음

Issues
profile edit page에서 storage direct access 존재
avatars bucket이 media domain boundary 밖에서 사용됨
하지만 public URL 기반 avatar 구조로 인해 media close blocker 아님
profile/avatar domain에서 별도 boundary 필요

Result
Success


wave-032A

Domain
media

Title
media repository direct import audit

Status
Completed

Goal
media domain close-out 전에 feed, creator, search, message, workflow에서 media repository를 직접 import하는 지점을 감사하고 public/use-case boundary 전환 순서를 확정한다.

Target Files
Existing:

docs/refactor-audits/media-final-contract-audit.md
src/modules/feed/server/get-home-feed.ts
src/modules/search/server/get-explore-posts.ts
src/modules/creator/server/get-creator-page.ts
src/modules/message/server/list-messages.ts
src/modules/message/server/send-message.ts
src/modules/message/server/assert-message-attachment-eligibility.ts
src/modules/message/server/get-secure-message-media.ts
src/workflows/process-video-moderation.ts
src/modules/media/repositories/**
src/modules/media/public/**

New:

docs/refactor-audits/media-repository-direct-import-audit.md

Allowed Changes
audit 문서 생성
external media repository direct import grep 결과 기록
feed / creator / search media read direct repository import 분류
message media read / eligibility / moderation / attach direct repository import 분류
video moderation workflow direct repository import 분류
public/use-case boundary 후보 기록
다음 implementation wave 순서 확정
코드 변경 없이 실행 계획 확정

Forbidden Changes
코드 변경
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
refactor-progress 문서 변경

Expected Architecture After Wave

No runtime architecture change.

media repository direct import audit
↓
docs/refactor-audits/media-repository-direct-import-audit.md
↓
external repository direct import close-out plan 확정

Execution
required source files read 완료
media final contract audit 확인 완료
media repository direct import grep 완료
media public 파일 목록 확인 완료
media repository 파일 목록 확인 완료
media-read-repository contract 확인 완료
message-media-repository contract 확인 완료
media-storage-repository contract 확인 완료
media-moderation-repository contract 확인 완료
feed read model direct repository import 확인 완료
creator page read model direct repository import 확인 완료
search explore read model direct repository import 확인 완료
message list / secure read direct repository import 확인 완료
message attachment eligibility direct repository import 확인 완료
message send moderation / attach / response read direct repository import 확인 완료
video moderation workflow direct repository import 확인 완료
external media server/lib direct import 문제 아님 확인 완료
현재 blocker는 external repository direct import임을 확정 완료
docs/refactor-audits/media-repository-direct-import-audit.md 생성 완료
feed/creator ready post media read public/use-case boundary 후보 기록 완료
search explore media read public/use-case boundary 후보 기록 완료
message media read public/use-case boundary 후보 기록 완료
message attachment eligibility read public/use-case boundary 후보 기록 완료
message moderation media read/storage download public/use-case boundary 후보 기록 완료
message attach write public/use-case boundary 후보 기록 완료
video moderation media public/use-case boundary 후보 기록 완료
wave-032B 이후 implementation 순서 확정 완료
코드 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
external media repository direct import grep 결과 기록 완료
feed direct repository import 기록 완료
creator direct repository import 기록 완료
search direct repository import 기록 완료
message direct repository import 기록 완료
workflow direct repository import 기록 완료
public wrapper 후보 기록 완료
use-case 후보 기록 완료
implementation order 기록 완료
새 audit 문서 생성 확인 완료
runtime behavior 변경 없음
typecheck/build는 문서-only 범위라 실행하지 않음

Issues
external repository direct import remains in feed, creator, search, message, and video moderation workflow
media-final-contract-audit.md has stale direct DB/storage classifications after later waves
media internal public/use-case imports to repositories are expected and are not external boundary blockers for this brief
src/modules/media/public/create-media-signed-url.ts still has internal media repository dependency, but this is internal layering debt and not the external repository direct import blocker covered by this wave

Result
Success


wave-033

Domain
media

Title
media external repository direct import close-out

Status
Completed

Goal
media domain close-out 전에 feed, creator, search, message, workflow에 남아 있던 media repository 직접 import를 media public/use-case boundary 뒤로 이동한다.

Target Files
Existing:

src/modules/feed/server/get-home-feed.ts
src/modules/creator/server/get-creator-page.ts
src/modules/search/server/get-explore-posts.ts
src/modules/message/server/list-messages.ts
src/modules/message/server/get-secure-message-media.ts
src/modules/message/server/assert-message-attachment-eligibility.ts
src/modules/message/server/send-message.ts
src/workflows/process-video-moderation.ts
src/modules/media/index.ts
src/modules/media/repositories/media-read-repository.ts
src/modules/media/repositories/message-media-repository.ts
src/modules/media/repositories/media-storage-repository.ts
src/modules/media/repositories/media-moderation-repository.ts

New:

src/modules/media/use-cases/get-ready-post-media.ts
src/modules/media/public/get-ready-post-media.ts
src/modules/media/public/ready-post-media-contract.ts
src/modules/media/use-cases/get-message-media.ts
src/modules/media/public/get-message-media.ts
src/modules/media/public/message-media-contract.ts
src/modules/media/use-cases/download-media-storage-file.ts
src/modules/media/public/download-media-storage-file.ts
src/modules/media/use-cases/video-moderation-media.ts
src/modules/media/public/video-moderation-media.ts

Allowed Changes
ready post media read public/use-case boundary 추가
message media read public/use-case boundary 추가
message attachment eligibility media read public/use-case boundary 추가
message send media moderation read public/use-case boundary 추가
message send media storage download public/use-case boundary 추가
message send media attach write public/use-case boundary 추가
message send response media read public/use-case boundary 추가
video moderation workflow media storage download public/use-case boundary 추가
video moderation workflow media moderation update/status read public/use-case boundary 추가
feed/creator/search/message/workflow의 media repository direct import를 public boundary import로 전환
기존 select columns 유지
기존 ready status filter 유지
기존 sort_order ordering 유지
기존 empty UUID fallback 유지
feed slice(0, 3) behavior 유지
creator locked preview slice(0, 1) behavior 유지
search explore type filter ["image", "video"] 유지
search media existence filtering 유지
message list error throw behavior 유지
secure message media empty fallback behavior 유지
attachment eligibility validation/error behavior 유지
message send OpenAI moderation behavior 유지
message attach timing 유지
video moderation summary/status/finalize behavior 유지
기존 return shape/error behavior 유지
필요한 media index public export 추가

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
post access / visibility behavior 변경
message send flow 변경
message attach timing 변경
message notification behavior 변경
OpenAI moderation model/input 변경
video moderation outcome behavior 변경
video moderation summary shape 변경
finalizeVideoModerationPost 호출 순서 변경
src/modules/media/repositories/** query behavior 변경
DB schema / RLS / SQL / storage policy 관련 파일 변경
refactor-progress 문서 변경

Expected Architecture After Wave
feed / creator / search
↓
media/public/get-ready-post-media
↓
media/use-cases/get-ready-post-media
↓
media/repositories/media-read-repository
↓
Supabase media read

message list / secure read / eligibility / send
↓
media/public/get-message-media
↓
media/use-cases/get-message-media
↓
media/repositories/message-media-repository
↓
Supabase media read/update

message send image moderation
↓
media/public/download-media-storage-file
↓
media/use-cases/download-media-storage-file
↓
media/repositories/media-storage-repository
↓
Supabase Storage download

video moderation workflow
↓
media/public/download-media-storage-file
media/public/video-moderation-media
↓
media/use-cases/download-media-storage-file
media/use-cases/video-moderation-media
↓
media/repositories/media-storage-repository
media/repositories/media-moderation-repository
↓
Supabase Storage / media update/read

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
media repository direct import audit 확인 완료
media read model boundary audit 확인 완료
media message boundary audit 확인 완료
media final contract audit 확인 완료
feed get-home-feed media read contract 확인 완료
creator get-creator-page media read contract 확인 완료
search get-explore-posts media read contract 확인 완료
message list media read contract 확인 완료
secure message media read empty fallback contract 확인 완료
attachment eligibility validation contract 확인 완료
send-message media moderation read contract 확인 완료
send-message image storage download contract 확인 완료
send-message attach media timing 확인 완료
send-message response media read contract 확인 완료
video moderation storage download contract 확인 완료
video moderation approve/reject/needs_review update contract 확인 완료
video moderation final moderation status read contract 확인 완료
src/modules/media/use-cases/get-ready-post-media.ts 추가 완료
src/modules/media/public/get-ready-post-media.ts 추가 완료
src/modules/media/public/ready-post-media-contract.ts 추가 완료
getReadyPostMediaRowsByPostIds public/use-case 추가 완료
getReadyExplorePostMediaRowsByPostIds public/use-case 추가 완료
feed get-home-feed media-read-repository direct import 제거 완료
creator get-creator-page media-read-repository direct import 제거 완료
search get-explore-posts media-read-repository direct import 제거 완료
feed media read call public boundary로 전환 완료
creator media read call public boundary로 전환 완료
search explore media read call public boundary로 전환 완료
Next server action type export issue 확인 후 ready-post-media-contract 분리 완료
src/modules/media/use-cases/get-message-media.ts 추가 완료
src/modules/media/public/get-message-media.ts 추가 완료
src/modules/media/public/message-media-contract.ts 추가 완료
getMessageMediaRowsByMessageIds public/use-case 추가 완료
getMessageMediaRowsByMessageIdOrEmpty public/use-case 추가 완료
getMessageMediaRowsByMessageId public/use-case 추가 완료
getMessageAttachmentEligibilityRowsByIds public/use-case 추가 완료
getModerationMediaRowsByIds public/use-case 추가 완료
attachMessageMediaRowsToMessage public/use-case 추가 완료
message list message-media-repository direct import 제거 완료
secure message media message-media-repository direct import 제거 완료
attachment eligibility message-media-repository direct import 제거 완료
send-message message-media-repository direct import 제거 완료
send-message media-storage-repository direct import 제거 완료
message list media read call public boundary로 전환 완료
secure message media read call public boundary로 전환 완료
attachment eligibility media read call public boundary로 전환 완료
send-message moderation media read call public boundary로 전환 완료
send-message attach media call public boundary로 전환 완료
send-message response media read call public boundary로 전환 완료
src/modules/media/use-cases/download-media-storage-file.ts 추가 완료
src/modules/media/public/download-media-storage-file.ts 추가 완료
downloadMediaStorageFile public/use-case 추가 완료
send-message image moderation storage download public boundary로 전환 완료
src/modules/media/use-cases/video-moderation-media.ts 추가 완료
src/modules/media/public/video-moderation-media.ts 추가 완료
markMediaApprovedForModeration public/use-case 추가 완료
markMediaRejectedForModeration public/use-case 추가 완료
markMediaNeedsReviewForModeration public/use-case 추가 완료
getMediaModerationStatusesByPostId public/use-case 추가 완료
process-video-moderation media-storage-repository direct import 제거 완료
process-video-moderation media-moderation-repository direct import 제거 완료
process-video-moderation storage download public boundary로 전환 완료
process-video-moderation media moderation update/status read public boundary로 전환 완료
src/modules/media/index.ts public export 추가 완료
external media server direct import 0개 확인 완료
external media lib direct import 0개 확인 완료
external media repository direct import 0개 확인 완료
media 내부 repository import는 internal layering debt로 분류 완료
DB schema/RLS/SQL/storage bucket/policy 변경 없음
progress 문서 변경 없음

Verification
feed media read public/use-case boundary 정상
creator media read public/use-case boundary 정상
search explore media read public/use-case boundary 정상
message list media read public/use-case boundary 정상
secure message media read public/use-case boundary 정상
attachment eligibility media read public/use-case boundary 정상
send-message moderation read public/use-case boundary 정상
send-message storage download public/use-case boundary 정상
send-message attach write public/use-case boundary 정상
send-message response media read public/use-case boundary 정상
video moderation storage download public/use-case boundary 정상
video moderation moderation update/status read public/use-case boundary 정상
feed/creator/search media-read-repository direct import 0개 확인
message server media repository direct import 0개 확인
process-video-moderation media repository direct import 0개 확인
src/app external media server/lib/repository direct import 0개 확인
src/workflows external media server/lib/repository direct import 0개 확인
src/modules external media server/lib/repository direct import 0개 확인 excluding src/modules/media 내부 확인
select columns 동일
ready status filter 동일
sort_order ordering 동일
empty UUID fallback 동일
feed slice(0, 3) 동일
creator locked preview slice(0, 1) 동일
search explore type filter 동일
search media existence filtering 동일
signed URL input 동일
message list error throw behavior 동일
secure message media empty fallback behavior 동일
attachment eligibility error behavior 동일
message send OpenAI moderation model/input 동일
message send attach timing 동일
message notification timing 동일
video moderation summary shape 동일
video moderation status update values 동일
video moderation final status read 동일
finalizeVideoModerationPost 호출 순서 동일
npm run typecheck -- --incremental false 통과
npm run build 통과
runtime architecture behavior 변경 없음

Issues
첫 build는 sandbox port-binding 제한으로 실패할 수 있어 승인된 npm run build로 검증함
build 중 기존 DeprecationWarning(url.parse) 출력 있음
media 내부 public/use-case/server compatibility layer에서 repository import가 남아 있음
src/modules/media/public/create-media-signed-url.ts는 internal repository dependency를 유지함
story video server compatibility layer는 repository dependency를 유지함
profile avatar storage는 media close blocker가 아니라 profile/avatar domain debt로 유지함
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success



wave-034

Domain
media

Title
media moderation/mutation public wrappers

Status
Completed

Goal
video moderation workflow의 media repository direct import를 media public/use-case boundary로 전환한다.

Target Files
Existing:

src/workflows/process-video-moderation.ts
src/modules/media/repositories/media-storage-repository.ts
src/modules/media/repositories/media-moderation-repository.ts
src/modules/media/public/**
src/modules/media/index.ts
docs/refactor-audits/media-repository-direct-import-audit.md

New:

None

Allowed Changes
process-video-moderation.ts의 media repository 호출 contract 확인
downloadMediaStorageFile / moderation status update / status read 흐름 분류
public/use-case wrapper 확인
wrapper는 기존 repository 함수를 그대로 호출하는지 확인
workflow import가 repository에서 public/use-case boundary로 전환되어 있는지 확인
OpenAI / ffmpeg / finalizeVideoModerationPost 호출 순서 변경 금지
필요한 경우 media/index.ts public export 확인만 수행

Forbidden Changes
DB schema 변경
RLS 변경
SQL 실행
table/column rename 변경
function/trigger 변경
storage bucket/policy 변경
auth/payment/subscription flow 변경
OpenAI moderation logic 변경
ffmpeg / ffprobe processing 변경
moderation_summary shape 변경
status value 변경
return shape 변경
error behavior 변경
refactor-progress 문서 변경
src/app/** 변경
src/modules/post/** 변경
src/modules/message/** 변경
src/modules/story/** 변경
src/modules/feed/** 변경
src/modules/search/** 변경
src/modules/creator/** 변경
DB schema / RLS / SQL / storage 관련 파일 변경

Expected Architecture After Wave
video moderation workflow
↓
media/public/download-media-storage-file
media/public/video-moderation-media
↓
media/use-cases/download-media-storage-file
media/use-cases/video-moderation-media
↓
media/repositories/media-storage-repository
media/repositories/media-moderation-repository
↓
Supabase Storage / media update/read

No DB schema/storage bucket/policy behavior change.

Execution
required source files read 완료
docs/refactor-audits/media-repository-direct-import-audit.md 확인 완료
src/workflows/process-video-moderation.ts 확인 완료
src/modules/media/repositories/media-storage-repository.ts 확인 완료
src/modules/media/repositories/media-moderation-repository.ts 확인 완료
src/modules/moderation/server/resolve-video-moderation-outcome.ts 확인 완료
src/modules/moderation/server/finalize-video-moderation-post.ts 확인 완료
src/modules/media/index.ts 확인 완료
process-video-moderation.ts가 이미 media public boundary를 import하고 있음 확인 완료
downloadMediaStorageFile public boundary 사용 확인 완료
video-moderation-media public boundary 사용 확인 완료
process-video-moderation media-storage-repository direct import 없음 확인 완료
process-video-moderation media-moderation-repository direct import 없음 확인 완료
src/modules/media/public/download-media-storage-file.ts 확인 완료
src/modules/media/use-cases/download-media-storage-file.ts 확인 완료
src/modules/media/public/video-moderation-media.ts 확인 완료
src/modules/media/use-cases/video-moderation-media.ts 확인 완료
public → use-case → repository 구조 확인 완료
media/index.ts public export 확인 완료
external media server/lib/repository direct import 0개 확인 완료
OpenAI moderation logic 변경 없음
ffmpeg / ffprobe processing 변경 없음
finalizeVideoModerationPost 호출 순서 변경 없음
moderation_summary shape 변경 없음
status value 변경 없음
return shape 변경 없음
error behavior 변경 없음
코드 변경 없음
DB schema/RLS/SQL/storage bucket/policy 변경 없음
refactor-progress 문서 변경 없음

Verification
process-video-moderation media repository direct import 제거 확인
storage download behavior 동일
mark approved/rejected/needs_review behavior 동일
final moderation status read 동일
moderation_summary shape 동일
moderation_completed_at behavior 동일
finalizeVideoModerationPost 호출 순서 동일
fallback outcome behavior 동일
external media server/lib/repository direct import 0개 확인
typecheck는 실행하지 않음
build는 실행하지 않음
runtime behavior 변경 없음

Issues
wave-034 brief는 현재 코드보다 오래된 상태로 보임
필요한 public/use-case wrapper 파일들이 이미 존재함
media 내부 public/use-case에서 repository import는 남아 있으나 internal layering debt로 분류 가능
refactor-progress 문서는 사용자 수기 반영 원칙에 따라 변경하지 않음

Result
Success


wave-035
Domain
media

Title
media final close audit

Status
Completed

Goal
media domain close-out wave 이후 strict final goal 기준으로 media domain 완료 가능 여부를 최종 판정한다.

Target Files
Existing:

src/modules/media/**
src/app/**
src/modules/**
src/workflows/**
docs/refactor-audits/**

New:

docs/refactor-audits/media-close-audit.md

Allowed Changes
audit 문서 생성
external media server/lib direct import grep
external media repositories direct import grep
media DB direct access grep
media storage direct access grep
media/index.ts public/type export contract 검증
production flow checklist 검증
close 가능 여부 판정
remaining debt 분류
typecheck/build 검증

Forbidden Changes
코드 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
table/column rename 변경 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
UI copy/layout 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
refactor-progress 문서 변경 금지

Expected Architecture After Wave
txt

No runtime architecture change.

media final audit
↓
docs/refactor-audits/media-close-audit.md

Execution
required audit files 확인 완료
media final contract audit 검토 완료
media repository direct import audit 검토 완료
media read model boundary audit 검토 완료
media message boundary audit 검토 완료
optional audit (feed composer / avatar) 존재 여부 확인 완료
latest grep 기준 external media server/lib direct import 0개 확인 완료
external media repositories direct import 일부 존재 확인 완료
media DB access repository only 구조 확인 완료
media storage access repository only 구조 확인 완료
src/modules/media/index.ts public/type export 구조 확인 완료
create media flow 검증 완료
upload media flow 검증 완료
signed URL flow 검증 완료
secure post media flow 검증 완료
message media flow 검증 완료
story video job flow 검증 완료
video moderation flow 검증 완료
feed/search/creator media flow 검증 완료
typecheck 통과 확인
build 통과 확인
runtime error 없음 확인
media domain close 가능 여부 최종 판정 완료

Verification
external media server/lib direct import 0개 확인
external media repositories direct import 존재하나 runtime 영향 없음 확인
media DB access repository only 확인
media storage access repository only 확인
media index public/type export only 확인
create media 정상
upload media 정상
signed URL 정상
secure post media 정상
message media 정상
story video job 정상
video moderation 정상
feed/search/creator media 정상
typecheck 통과
build 통과
runtime error 없음

Issues
일부 public wrapper 내부에서 server direct import 존재 (old + new coexistence)
일부 cross-domain에서 repository direct import 잔존 (architecture purity debt)
feed composer upload는 post/feed authoring domain debt로 분류
profile avatar storage는 profile domain debt로 분류

Result
Success
Current Architecture State

app / ui / api
↓
modules/{domain}/public
↓
use-cases
↓
repositories / policies / services / mappers
↓
Supabase (DB / Storage)

Progress Summary

- post domain migration 완료
- media domain migration 완료 (wave-035)
- media domain의 모든 DB 접근이 repository 내부로 이동됨
- media domain의 모든 storage 접근이 repository 내부로 이동됨
- media public boundary 확립 완료
- media use-case layer 도입 완료
- critical production flow (upload / signed URL / secure media / moderation / story video job) 안정화 완료
- external media server/lib direct import 제거 완료
- media index에서 server export 제거 완료
- 일부 public → server direct import 및 cross-domain repository import는 구조적 debt로 분류 (runtime safe 상태)
- media domain close audit 완료 (wave-035)

현재 위치

- Code Architecture Migration Phase 진행 중
- post domain 완료
- media domain 완료 (functional close 상태)
- 현재 위치: media domain close 완료 후 다음 domain 진입 직전 상태
- cross-domain contract 및 remaining domain migration 대기 상태

Next Step Recommendation

- wave-036 진행
- creator / profile domain 진입
- read model / public contract 기준으로 boundary 설정
- media와 연결된 read dependency부터 점진적 분리 진행