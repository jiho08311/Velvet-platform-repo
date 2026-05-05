# Refactor Progress (Updated)

## Purpose

이 문서는 전체 코드 아키텍처 개편의 현재 진행 상태를 기록한다.

project-baseline.md와 db-architecture-audit.md는 기준 문서이고,
이 문서는 매 wave 완료 후 계속 업데이트하는 작업 일지다.Global Status

Global Status

Current Phase

Phase 2 - Code Architecture Migration

DB Migration Phase

Not Started

Current Domain

post

Current Wave

wave-049

Next

wave-050

Last Updated

2026-05-04

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

post → Stabilized - wave-049 완료


# wave-001

## Domain

post

## Title

Extract post_blocks DB access into repository

## Status

Completed

## Goal

post_blocks 관련 DB 직접 접근을 repository로 이동한다.

## Target Files

Existing:

src/modules/post/server/get-post-blocks.ts  
src/modules/post/server/create-post-blocks.ts  

New:

src/modules/post/repositories/post-block-repository.ts  

## Allowed Changes

repository 파일 추가  
기존 server 함수 내부 DB 접근을 repository 호출로 변경  
기존 함수명/export 유지  
반환 shape 유지  

## Forbidden Changes

DB schema 변경  
RLS 변경  
SQL 실행  
UI 변경  
app route 변경  
post create/update flow 변경  
mapper/policy/use-case 동시 분리  
unrelated cleanup  

## Expected Architecture After Wave

```txt
server/*
↓
post-block-repository.ts
↓
Supabase post_blocks
Execution

repository 파일 생성 완료
getPostBlocks → repository 호출로 변경 완료
createPostBlocks → repository 호출로 변경 완료

Verification

post create 정상
post detail 정상
feed 정상
runtime error 없음

Result

Success

wave-002
Domain

post

Title

Extract post_likes DB access into repository

Status

Completed

Goal

post_likes 관련 DB 직접 접근을 post-like-repository로 이동한다.

Target Files

Existing:

src/app/api/post/[postId]/like/route.ts
src/modules/post/server/get-post-by-id.ts
src/modules/post/server/get-creator-feed.ts
src/modules/post/server/list-feed-posts.ts
src/modules/post/server/list-liked-posts.ts
src/modules/post/server/get-my-posts.ts

New:

src/modules/post/repositories/post-like-repository.ts

Allowed Changes

repository 파일 추가
기존 server/API 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave
route.ts / server/*
↓
post-like-repository.ts
↓
Supabase post_likes
Execution

repository 파일 생성 완료
route.ts 리팩토링 완료
get-post-by-id.ts 리팩토링 완료
get-creator-feed.ts 리팩토링 완료
list-feed-posts.ts 리팩토링 완료
get-my-posts.ts 리팩토링 완료
list-liked-posts.ts는 client 접근 유지

Verification

like 정상
unlike 정상
like count 동일
viewerHasLiked 동일
post detail 정상
creator feed 정상
main feed 정상
my posts 정상
liked posts 목록 정상
runtime error 없음

Result

Success

wave-003
Domain

post

Title

Extract comments DB access into repository

Status

Completed

Goal

comments 관련 DB 직접 접근을 comment-repository로 이동한다.

Target Files

Existing:

src/app/api/post/[postId]/comments/route.ts
src/app/api/post/[postId]/comment/route.ts
src/app/api/comment/[commentId]/route.ts
src/modules/post/server/get-post-by-id.ts
src/modules/post/server/get-creator-feed.ts

New:

src/modules/post/repositories/comment-repository.ts

Allowed Changes

repository 파일 추가
기존 server/API 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave
route.ts / server/*
↓
comment-repository.ts
↓
Supabase comments
Execution

repository 파일 생성 완료
comment create route 리팩토링 완료
comment delete route 리팩토링 완료
comments list route 리팩토링 완료
getPostById comments count 리팩토링 완료
getCreatorFeed comments count 리팩토링 완료

Verification

comment create 정상
comment delete 정상
comments list 정상
comments count 동일
post detail 정상
creator feed 정상
runtime error 없음

Result

Success

wave-004
Domain

post

Title

Extract comment_likes DB access into repository

Status

Completed

Goal

comment_likes 관련 DB 직접 접근을 comment-like-repository로 이동한다.

Target Files

Existing:

src/app/api/comment/[commentId]/like/route.ts
src/app/api/post/[postId]/comments/route.ts

New:

src/modules/post/repositories/comment-like-repository.ts

Allowed Changes

repository 파일 추가
기존 route 내부 comment_likes DB 접근을 repository 호출로 변경
기존 response shape 유지
기존 함수/export 유지
기존 like count / viewer liked 계산 흐름 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
notification 변경
auth/payment/subscription flow 변경
comment item render contract 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave
comment route
↓
comment-like-repository.ts
↓
Supabase comment_likes
Execution

repository 파일 생성 완료
like insert repository 호출로 변경 완료
unlike delete repository 호출로 변경 완료
likes count repository 호출로 변경 완료
comments list repository 호출로 변경 완료

Verification

comment like 정상
comment unlike 정상
likes_count 동일
is_liked 동일
notification 유지
runtime error 없음

Result

Success

wave-005
Domain

post

Title

Add getPostById public wrapper

Status

Completed

Goal

getPostById를 감싸는 public API를 추가하여
server 내부 직접 import를 제거하기 위한 기반을 만든다.

Target Files

Existing:

src/modules/post/server/get-post-by-id.ts

New:

src/modules/post/public/get-post.ts

Allowed Changes

public wrapper 파일 추가
server 함수 import 후 wrapper export
기존 signature 유지
type export 유지

Forbidden Changes

get-post-by-id 내부 로직 변경
DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave
app / api / domain
↓
post/public/get-post.ts
↓
post/server/get-post-by-id.ts
↓
Supabase
Execution

public wrapper 파일 생성 완료
getPostById wrapper 구현 완료
PostDetail type re-export 완료

Verification

typecheck 통과
build 성공
기존 getPostById 동작 동일
runtime error 없음

Result

Success

wave-006
Domain

post

Title

Migrate post detail page getPostById import to public boundary

Status

Completed

Goal

app page의 getPostById import를 server 내부 구현에서 public boundary로 전환한다.

Target Files

Existing:

src/app/post/[postId]/page.tsx

New:

None

Required Source Files Before Implementation

src/app/post/[postId]/page.tsx
src/modules/post/public/get-post.ts

Allowed Changes

import 경로만 변경
기존 호출 방식 유지
기존 rendering behavior 유지
기존 locked behavior 유지
기존 purchase CTA 유지
기존 subscription CTA 유지
기존 not found 유지
기존 owner action 유지

Forbidden Changes

server 로직 변경 금지
payment/media 변경 금지
DB 변경 금지
UI 변경 금지
return shape 변경 금지
permission 변경 금지

Execution

import 1줄 변경 완료

Verification

post detail 정상
locked behavior 정상
purchase CTA 정상
runtime error 없음

Result

Success

wave-007
Domain

post

Title

Migrate getPostById usage in payment/media to public boundary

Status

Completed

Goal

payment/media 영역에서 server 직접 import 제거

Target Files

src/app/api/post/purchase/route.ts
src/app/api/payment/ppv-post/route.ts
src/modules/payment/server/verify-payment-access-after-success.ts
src/modules/media/server/get-secure-post-media.ts

Execution

import 4줄 변경 완료

Verification

PPV purchase 정상
payment route 정상
media access 정상
runtime error 없음

Result

Success

wave-008
Domain

post

Title

Split getPostById DB access into repositories

Status

Completed

Goal

getPostById 내부의 모든 DB 직접 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/get-post-by-id.ts

New:

src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-media-repository.ts

Existing Reused Files:

post-block-repository.ts
post-like-repository.ts
comment-repository.ts

Allowed Changes

repository 파일 추가
기존 DB query를 repository로 이동
getPostById 내부에서 repository 호출로 교체
return shape 유지
error throw 유지
access logic 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
payment/media 변경
mapper 분리
policy 분리
use-case 분리

Execution

Step 1: post-repository 생성

posts query 이동
creators + profiles query 이동

Step 2: post-media-repository 생성

media query 이동

Step 3: getPostById 리팩토링

posts query 제거 → repository 호출
creator query 제거 → repository 호출
media query 제거 → repository 호출
supabaseAdmin import 제거

Verification

post detail 동일
creator 정보 동일
likesCount 동일
viewerHasLiked 동일
commentsCount 동일
media 표시 동일
media 정렬 동일
locked media 동일
preview media 동일
access state 동일
renderInput 동일
typecheck 통과
build 통과
runtime error 없음

Result

Success

wave-009
Domain

post

Title

Split getPostById mapping logic into mappers

Status

Completed

Goal

getPostById 내부 mapping 로직을 mapper로 분리한다.

Target Files

Existing:

src/modules/post/server/get-post-by-id.ts

New:

src/modules/post/mappers/post-mapper.ts
src/modules/post/mappers/post-media-mapper.ts
src/modules/post/mappers/post-render-mapper.ts

Required Source Files Before Implementation

src/modules/post/server/get-post-by-id.ts
src/modules/post/types.ts
src/modules/post/lib/post-render-input.ts
src/modules/post/server/locked-preview-policy.ts

Allowed Changes

mapper 파일 추가
기존 map 로직 그대로 복사
mapper 함수로 추출
server 함수는 mapper 호출
반환 shape 동일
error behavior 유지
access behavior 유지
media shape 유지
render input 유지

Forbidden Changes

repository query 변경 금지
access policy 변경 금지
preview policy 변경 금지
UI 변경 금지
DB schema 변경 금지
RLS policy 변경 금지
SQL migration 실행 금지
table/column rename 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
대규모 파일 이동 금지

Expected Architecture After Wave
getPostById
↓
post-render-mapper / post-media-mapper / post-mapper
↓
PostDetail
Strategy

기존 map 로직 그대로 복사
mapper 함수로 추출
server 함수는 mapper 호출
반환 shape 동일

Execution

Step 1: post-render-mapper 생성

src/modules/post/mappers/post-render-mapper.ts 파일 생성 완료
sortBlocks 로직을 sortPostRenderableBlocks로 이동 완료
block row → LockedPreviewRenderableBlock 변환 로직을 mapPostBlocksToRenderableBlocks로 이동 완료
carousel block type을 text로 변환하는 기존 처리 유지 완료
editorState null fallback 유지 완료
sortOrder 기준 정렬 유지 완료
selectedBlocks 계산 로직을 selectPostRenderableBlocks로 이동 완료
getPostById 내부 inline block mapping 제거 완료
getPostById 내부 selectedBlocks 삼항 조건 제거 후 mapper 호출로 변경 완료

Step 2: post-media-mapper 생성

src/modules/post/mappers/post-media-mapper.ts 파일 생성 완료
PostDetailMediaItem 타입 추가 완료
sortMediaRows 로직을 sortPostMediaRows로 이동 완료
previewPolicy media input mapping을 mapPostMediaRowsToPreviewMedia로 이동 완료
selectedMediaRows 계산 로직을 selectPostMediaRowsForAccess로 이동 완료
signed media return shape mapping을 mapSignedPostMediaItem으로 이동 완료
renderInput media shape mapping을 mapPostDetailMediaToRenderMedia로 이동 완료
createMediaSignedUrl 호출 위치는 getPostById 내부에 유지 완료
signed URL 생성 조건 유지 완료
allowPreview 조건 유지 완료
media sortOrder 유지 완료
locked preview media selection 유지 완료

Step 3: post-mapper 생성

src/modules/post/mappers/post-mapper.ts 파일 생성 완료
최종 PostDetail object 생성 로직을 mapPostDetail로 이동 완료
creator shape mapping 유지 완료
content null 처리 로직 유지 완료
likeState 생성 및 createPostLikeCompatibilityFields 호출 mapper 내부로 이동 완료
commentsCount fallback 유지 완료
media locked 처리 유지 완료
blocks locked 처리 유지 완료
renderInput 포함 유지 완료
getPostById 최종 return object 제거 후 mapPostDetail 호출로 변경 완료

Step 4: getPostById 정리

getPostById 내부 mapping / sorting / final shaping 책임 제거 완료
getPostById는 validation, repository 호출, visibility 판단, access state 조회, preview policy 생성, signed URL 생성, mapper 호출 중심으로 정리 완료
repository query 변경 없음
resolvePostAccessState 변경 없음
buildLockedPreviewPolicy 변경 없음
buildPostRenderInput 변경 없음
createMediaSignedUrl 변경 없음
public discovery logic 변경 없음
error throw 유지 완료
return null behavior 유지 완료

Step 5: syntax issue correction

selectedMediaRows.map(async ...) 닫는 괄호 누락으로 발생한 빨간줄 수정 완료
Promise.all 내부 async map 닫힘 구조 정상화 완료

Verification

post detail UI 변화 없음
media shape 동일
render input 동일
locked preview 동일
likesCount 동일
viewerHasLiked 동일
commentsCount 동일
media 순서 동일
preview media 동일
blocks 동일
carousel → text 처리 동일
selectedBlocks 조건 동일
selectedMediaRows 조건 동일
signed URL 호출 조건 동일
PostDetail return shape 동일
creator shape 동일
content null 처리 동일
like compatibility fields 동일
commentsCount fallback 동일
public post 정상
subscriber-only locked post 정상
paid locked post 정상
owner view 정상
typecheck 통과
build 통과
runtime error 없음

Result

Success

wave-010
Domain

post

Title

Add getCreatorFeed public wrapper

Status

Completed

Goal

getCreatorFeed를 감싸는 public API를 추가하여
server 내부 직접 import를 제거하기 위한 기반을 만든다.

Target Files

Existing:

src/modules/post/server/get-creator-feed.ts

New:

src/modules/post/public/get-creator-feed.ts

Required Source Files Before Implementation

src/modules/post/server/get-creator-feed.ts
src/modules/post/types.ts

Allowed Changes

public wrapper 파일 추가
server 함수 import 후 wrapper export
기존 signature 유지
type export 유지

Forbidden Changes

get-creator-feed 내부 로직 변경
DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
feed 내부 로직 변경
repository 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave
app / api / domain
↓
post/public/get-creator-feed.ts
↓
post/server/get-creator-feed.ts
↓
Supabase
Execution

public wrapper 파일 생성 완료
getCreatorFeed wrapper 구현 완료
GetCreatorFeedInput type export 추가 완료

Verification

typecheck 통과
build 성공
기존 getCreatorFeed 동작 동일
runtime error 없음

Result

Success


wave-011

Domain

post

Title

Migrate getCreatorFeed import to public boundary

Status

Completed

Goal

app/API의 getCreatorFeed import를 server 내부 구현에서 public boundary로 전환한다.

Target Files

src/app/creator/[username]/page.tsx
src/app/profile/page.tsx
src/app/profile/[username]/page.tsx
src/app/api/post/feed/route.ts

Allowed Changes

import 경로만 변경
기존 호출 방식 유지
기존 rendering behavior 유지

Forbidden Changes

server 로직 변경 금지
feed query 변경 금지
DB 변경 금지
UI 변경 금지
return shape 변경 금지
permission 변경 금지

Execution

import 4줄 변경 완료

Verification

creator page 정상
profile page 정상
profile/[username] page 정상
feed API 정상
runtime error 없음

Result

Success


wave-012

Domain

post

Title

Feed repository split (getCreatorFeed, listFeedPosts)

Status

Completed

Goal

feed 관련 DB query를 repository로 이동하여
server layer에서 supabase 직접 접근을 제거한다.

Target Files

Existing:

src/modules/post/server/get-creator-feed.ts  
src/modules/post/server/list-feed-posts.ts  

New:

src/modules/post/repositories/post-feed-repository.ts  

Existing Reused Files:

post-repository.ts  
post-media-repository.ts  
post-like-repository.ts  
comment-repository.ts  
post-block-repository.ts  

Allowed Changes

repository 파일 추가  
기존 server 함수 내부 DB 접근을 repository 호출로 변경  
기존 함수명/export 유지  
반환 shape 유지  

Forbidden Changes

DB schema 변경  
RLS 변경  
SQL 실행  
UI 변경  
app route 변경  
feed ordering 변경  
access policy 변경  
mapper/policy/use-case 동시 분리  
unrelated cleanup  

Expected Architecture After Wave

route.ts / server/*
↓
post-feed-repository.ts
↓
Supabase feed-related tables

Execution

post-feed-repository.ts 생성 완료  
getCreatorFeed DB query → repository 호출로 변경 완료  
listFeedPosts DB query → repository 호출로 변경 완료  
supabaseAdmin direct access 제거 완료  

Verification

creator feed 정상  
main feed 정상  
feed ordering 동일  
media ordering 동일  
block ordering 동일  
locked preview 동일  
likesCount 동일  
viewerHasLiked 동일  
commentsCount 동일  
runtime error 없음  

Result

Success

wave-013

Domain

post

Title

Split feed render mapping into mapper/service

Status

Completed

Goal

getCreatorFeed / listFeedPosts 내부에 섞여 있는
feed render projection / media signing / final item shaping 로직을
mapper와 service로 분리하여
server layer를 orchestration 중심으로 정리한다.

Target Files

Existing:

src/modules/post/server/get-creator-feed.ts
src/modules/post/server/list-feed-posts.ts

New:

src/modules/post/mappers/post-feed-mapper.ts
src/modules/post/services/post-feed-render-service.ts

Required Source Files Before Implementation

src/modules/post/server/get-creator-feed.ts
src/modules/post/server/list-feed-posts.ts
src/modules/post/lib/post-render-input.ts
src/modules/post/server/post-render-read-model.ts
src/modules/post/server/locked-preview-policy.ts

Allowed Changes

mapper 파일 추가
service 파일 추가
기존 server 내부 render/mapping 로직을 mapper/service 호출로 이동
기존 함수명/export 유지
return shape 유지
access/preview/media behavior 유지

Forbidden Changes

repository query 변경 금지
access policy 변경 금지
feed ordering 변경 금지
media status 조건 변경 금지
media limit 변경 금지
UI 변경 금지
DB schema 변경 금지
RLS policy 변경 금지
SQL migration 실행 금지
table/column rename 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
대규모 파일 이동 금지

Expected Architecture After Wave

getCreatorFeed / listFeedPosts
↓
post-feed-render-service.ts
↓
post-feed-mapper.ts
↓
buildPostRenderReadModel / buildPostRenderInput
↓
PostRenderSurfaceItem / PostRenderListItem

Execution

post-feed-mapper.ts 생성 완료
media/block grouping 로직 이동 완료
media type resolve 로직 이동 완료
signed media item mapping 로직 이동 완료
final feed item shaping 로직 이동 완료

post-feed-render-service.ts 생성 완료
locked preview policy 적용 로직 이동 완료
selected media rows 계산 로직 이동 완료
createMediaSignedUrl 호출 로직 이동 완료
buildPostRenderReadModel 호출 유지
buildPostRenderInput 호출 유지
mapper 호출로 최종 item 생성 구조 적용 완료

getCreatorFeed 리팩토링 완료
inline render projection 제거 완료
media/block map 생성 로직 제거 후 mapper 사용으로 교체 완료
preview policy / media signing / renderInput 생성 로직 제거 완료
service 호출로 최종 결과 생성하도록 변경 완료
query / access / like / comment 계산 로직 유지 완료

listFeedPosts 리팩토링 완료
inline render projection 제거 완료
media/block map 생성 로직 제거 후 mapper 사용으로 교체 완료
media 3개 제한 로직 service 내부로 이동 완료
createMediaSignedUrl 호출 로직 service로 이동 완료
renderInput 생성 로직 service로 이동 완료
query / access / like 계산 로직 유지 완료

Verification

creator feed card 동일
main feed card 동일
locked preview 동일
media rendering 동일
getCreatorFeed media status: processing + ready 유지
listFeedPosts media status: ready 유지
listFeedPosts media limit: 3 유지
like count 동일
viewerHasLiked 동일
commentsCount 동일
public/subscribers/paid access 동일
typecheck 통과
runtime error 없음

Result

Success



wave-014

Domain

post

Title

Add post access public boundary

Status

Completed

Goal

post access 관련 public API를 추가하여
server 내부 직접 import를 제거하기 위한 기반을 만든다.

Target Files

Existing:

src/modules/post/server/get-post-access.ts
src/modules/post/server/enforce-post-visibility.ts

New:

src/modules/post/public/get-post-access.ts
src/modules/post/public/enforce-post-visibility.ts

Required Source Files Before Implementation

src/modules/post/server/get-post-access.ts
src/modules/post/server/enforce-post-visibility.ts
src/modules/post/server/can-view-post.ts
src/modules/post/server/resolve-post-access-state.ts

Allowed Changes

public wrapper 파일 추가
server 함수 import 후 wrapper export
기존 signature 유지
type 안전하게 유지 (Parameters<typeof internal>)

Forbidden Changes

get-post-access 내부 로직 변경 금지
enforce-post-visibility 내부 로직 변경 금지
can-view-post 변경 금지
resolve-post-access-state 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
UI 변경 금지
app route 변경 금지
media/payment/feed caller 변경 금지
mapper/policy/use-case 동시 분리 금지
unrelated cleanup 금지

Expected Architecture After Wave

app / api / domain
↓
post/public/get-post-access
post/public/enforce-post-visibility
↓
post/server/get-post-access
post/server/enforce-post-visibility
↓
can-view-post / resolve-post-access-state
↓
Supabase

Execution

get-post-access public wrapper 생성 완료
enforce-post-visibility public wrapper 생성 완료
internal alias import 패턴 적용 완료
Parameters<typeof internal> 기반 타입 유지 완료
server 함수 호출 구조 유지 완료

Verification

typecheck 통과
build 통과
public post 접근 정상
subscriber-only post locked/unlocked 정상
paid post locked/unlocked 정상
owner view 정상
runtime error 없음

Result

Success

wave-015

Domain

post

Title

Split post access / visibility logic into policies

Status

Completed

Goal

post access / visibility의 순수 판단 로직을 policies로 분리하여
server layer를 orchestration 중심으로 정리한다.

Target Files

Existing:

src/modules/post/server/can-view-post.ts
src/modules/post/server/get-post-access.ts
src/modules/post/server/enforce-post-visibility.ts
src/modules/post/server/resolve-post-access-state.ts

New:

src/modules/post/policies/post-visibility-policy.ts
src/modules/post/policies/post-access-policy.ts

Allowed Changes

policy 파일 추가
기존 server 함수 내부 pure logic을 policy로 이동
기존 함수명/export 유지
반환 shape 유지
async 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
payment/subscription behavior 변경
media access behavior 변경
resolvePostAccessState 구조 변경
UI 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup
caller import 변경

Expected Architecture After Wave

server/*
↓
post-access-policy / post-visibility-policy
↓
pure decision logic
↓
Supabase (unchanged)

Execution

Step 1: post-visibility-policy 생성

canViewPost의 pure visibility 판단 로직을 policy로 이동 완료
viewer/creator normalize 유지
owner/public/subscriber/paid 판단 유지

Step 2: server/can-view-post.ts wrapper화

기존 로직 제거 후 policy 호출로 변경 완료
export/type 유지 완료

Step 3: post-access-policy 생성

canView 계산 + lockReason 계산 + isLocked 계산 로직을 policy로 이동 완료

Step 4: getPostAccess 리팩토링

기존 inline logic 제거
policy 호출로 변경 완료
async/export/signature 유지 완료

Step 5: 영향 파일 검증

enforcePostVisibility 변경 없음
resolvePostAccessState 변경 없음
public wrapper 변경 없음
media signed URL behavior 유지 확인

Verification

owner access 정상
subscriber access 정상
PPV access 정상
locked preview 정상
secure media 정상
PostAccessResult shape 동일
lockReason 동일
runtime error 없음

Result

Success

wave-016

Domain

post

Title

Add commerce CTA policy/public boundary

Status

Completed

Goal

post commerce CTA 판단 로직을 policy/public boundary로 이동하여
app/ui에서 lib 직접 의존을 제거하고 domain contract를 정리한다.

Target Files

Existing:

src/modules/post/lib/post-commerce-policy.ts
src/app/post/[postId]/page.tsx
src/app/profile/[username]/page.tsx
src/modules/post/ui/PostCard.tsx

New:

src/modules/post/policies/post-commerce-policy.ts
src/modules/post/public/get-post-commerce-cta-decision.ts

Allowed Changes

policy 파일 추가
public wrapper 파일 추가
기존 lib 로직을 policy로 이동
lib는 compatibility re-export 유지
app/ui import를 public으로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI copy/layout 변경
payment/session/checkout flow 변경
PostPurchaseButton 변경
subscription behavior 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

app / ui
↓
post/public/get-post-commerce-cta-decision
↓
post/policies/post-commerce-policy
↓
pure decision logic

Execution

post-commerce-policy.ts 정책 파일 생성 완료
기존 getPostCommerceCtaDecision 로직 이동 완료
getPostCommerceState / getBlockedPostCommerceState 이동 완료

public wrapper 생성 완료
get-post-commerce-cta-decision.ts 추가 완료

lib 파일을 policy re-export 구조로 변경 완료
old import 호환 유지 완료

app/post/[postId]/page.tsx import 전환 완료
app/profile/[username]/page.tsx import 전환 완료
PostCard.tsx import 전환 완료

Verification

CTA 표시 동일
showPurchaseCta 조건 동일
showSubscribeCta 조건 동일
locked post behavior 동일
post detail CTA 동일
profile CTA 동일
PostCard CTA 동일
payment flow 정상
UI 변화 없음
runtime error 없음

Result

Success

wave-017

Domain

post

Title

Add deletePost public wrapper

Status

Completed

Goal

deletePost를 감싸는 public API를 추가하여
server 내부 직접 import를 제거하기 위한 기반을 만든다.

Target Files

Existing:

src/modules/post/server/delete-post.ts
src/modules/post/server/delete-post-action.ts

New:

src/modules/post/public/delete-post.ts

Allowed Changes

public wrapper 파일 추가
server 함수 import 후 wrapper export
기존 signature 유지
type 안전하게 유지 (Parameters<typeof internal>)

Forbidden Changes

delete 내부 DB query 변경 금지
cascade behavior 변경 금지
app/API import 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
UI 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Expected Architecture After Wave

app / api / action
↓
post/public/delete-post.ts
↓
post/server/delete-post.ts
↓
Supabase

Execution

public wrapper 파일 생성 완료
deletePost wrapper 구현 완료
Parameters<typeof internal> 기반 타입 유지 완료
server 함수 호출 구조 유지 완료

Verification

typecheck 통과
build 통과
delete behavior 동일
soft delete 조건 동일
creator ownership 조건 동일
revalidate/redirect flow 정상
runtime error 없음

Result

Success

wave-018

Domain

post

Title

Migrate deletePost usage to public boundary

Status

Completed

Goal

deletePost 사용처를 server 내부 구현에서 public boundary로 전환한다.

Target Files

Existing:

src/app/api/post/[postId]/delete/route.ts
src/modules/post/server/delete-post-action.ts
src/app/post/[postId]/page.tsx
src/app/creator/studio/page.tsx

New:

None

Required Source Files Before Implementation

src/app/api/post/[postId]/delete/route.ts
src/modules/post/server/delete-post-action.ts
src/app/post/[postId]/page.tsx
src/app/creator/studio/page.tsx
src/modules/post/public/delete-post.ts

Allowed Changes

import 경로만 변경
기존 API/action 호출 방식 유지
기존 form behavior 유지
기존 return shape 유지
기존 redirect/revalidate 유지

Forbidden Changes

src/modules/post/server/delete-post.ts internals 변경
DB cascade 변경
media cleanup 변경
DB schema 변경
RLS 변경
SQL 실행
UI 변경
payment/auth/subscription flow 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

app / api / action
↓
post/public/delete-post.ts
↓
post/server/delete-post.ts
↓
Supabase

Execution

src/app/api/post/[postId]/delete/route.ts import 전환 완료
src/modules/post/server/delete-post-action.ts import 전환 완료
post detail page 변경 없음 확인
creator studio page 변경 없음 확인
deletePost public wrapper 사용 확인

Verification

API delete 정상
post detail delete 정상
creator studio delete 정상
redirect/revalidate 동일
error response 동일
runtime error 없음

Result

Success


wave-019

Domain

post

Title

createPost repository split

Status

Completed

Goal

createPost 내부의 posts DB 접근을 repository로 이동하여
server layer에서 supabase 직접 접근을 제거한다.

Target Files

Existing:

src/modules/post/server/create-post.ts
src/workflows/create-post-with-media-workflow.ts

New:

None

Existing Reused Files:

src/modules/post/repositories/post-repository.ts

Allowed Changes

repository 함수 추가
createPost 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
return shape 유지

Forbidden Changes

media create 변경
post_blocks 변경
status transition 변경
workflow shape 변경
DB schema 변경
RLS 변경
SQL 실행
UI 변경
unrelated cleanup

Expected Architecture After Wave

create-post.ts
↓
post-repository.ts
↓
Supabase posts / creators

Execution

Step 1: create 전용 row type 추가

CreatedPostRow 타입을 repository에 추가 완료

Step 2: creator lookup 함수 추가

findCreatorForPostCreate 함수 추가 완료
creators.id 최소 조회로 create validation 분리 완료

Step 3: posts insert 함수 추가

insertPostRow 함수 추가 완료
posts insert 로직 repository로 이동 완료

Step 4: createPost 리팩토링

supabaseAdmin 직접 접근 제거 완료
creator 조회 → repository 호출로 변경 완료
posts insert → repository 호출로 변경 완료
validation / business logic 유지 완료
return mapping 유지 완료

Step 5: workflow 영향 확인

createPostWithMediaWorkflow 변경 없음 확인
media 생성 / blocks 저장 / moderation flow 유지 확인

Verification

create post 정상
media 연결 정상
blocks 저장 정상
status transition 정상
workflow return shape 동일
typecheck 통과
build 통과
runtime error 없음

Result

Success


wave-020

Domain

post

Title

updatePostStatus contract/service split

Status

Completed

Goal

updatePostStatus contract를 고정하고 순수 상태 판단 및 payload 조립 로직을 service로 분리한다.

Target Files

Existing:

src/modules/post/server/update-post-status.ts
src/workflows/create-post-with-media-workflow.ts
src/modules/post/server/update-post-action.ts
src/modules/moderation/server/apply-video-moderation-outcome.ts

New:

src/modules/post/services/post-status-service.ts

Allowed Changes

service 파일 추가
update-post-status 내부 순수 상태 판단 및 payload 조립 로직을 service로 이동
기존 함수명/export 유지
return shape 유지

Forbidden Changes

status value 변경 금지
moderation behavior 변경 금지
workflow 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
UI 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Expected Architecture After Wave

update-post-status.ts
↓
post-status-service.ts
↓
post-moderation-transition-policy.ts
↓
Supabase

Execution

post-status-service.ts 생성 완료
shouldSkipPostStatusUpdate 로직 분리 완료
buildPostStatusUpdatePayload 로직 분리 완료
update-post-status.ts에서 inline payload 분기 제거 완료
service 호출 구조로 변경 완료
DB query 위치 유지 완료
error throw 유지 완료

Verification

create status 정상
edit status 정상
moderation outcome 정상
approved + archived skip 유지
status/visibility/moderation 상태 값 동일
return shape 동일
runtime error 없음

Result

Success

wave-021

Domain

post

Title

updatePost action decomposition

Status

Completed

Goal

updatePostAction 내부 책임을 use-case / service로 분리하여
server action을 request boundary 역할로 축소한다.

Target Files

Existing:

src/modules/post/server/update-post-action.ts
src/modules/post/server/update-post.ts

New:

src/modules/post/use-cases/update-post.ts
src/modules/post/services/post-edit-service.ts

Required Source Files Before Implementation

src/modules/post/server/update-post-action.ts
src/modules/post/server/update-post.ts
src/modules/post/server/edit-post-draft-policy.ts
src/modules/post/server/post-edit-moderation-reentry-policy.ts

Allowed Changes

action 내부 로직을 use-case / service로 분리
기존 함수명/export 유지
기존 호출 순서 유지
return shape 유지

Forbidden Changes

UI 변경 금지
storage behavior 변경 금지
moderation transition 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Expected Architecture After Wave

update-post-action.ts
↓
use-cases/update-post.ts
↓
services/post-edit-service.ts
↓
기존 server / media / moderation 로직

Execution

updatePostAction 내부 draft normalize / validation / orchestration 로직 제거 완료
buildEditPostPlan(service)로 pure logic 분리 완료
executeUpdatePostUseCase(use-case)로 mutation orchestration 분리 완료
action을 auth / creator 조회 / post 조회 / revalidate / redirect만 담당하도록 축소 완료
기존 media delete / upload / moderation / post_blocks rewrite 순서 유지 완료

Verification

edit post 정상
media delete 정상
new media upload 정상
post_blocks update 정상
moderation re-entry 정상
remove-only edit 정상
runtime error 없음

Result

Success

wave-022

Domain

post

Title

post media dependency boundary (server → public)

Status

Completed

Goal

post 도메인의 media server 직접 의존을 제거하고 media public boundary로 전환한다.

Target Files

Existing:

src/modules/post/server/get-post-media.ts
src/modules/post/server/get-post-by-id.ts
src/modules/post/server/get-my-posts.ts
src/modules/post/server/list-creator-posts.ts
src/modules/post/services/post-feed-render-service.ts

New:

None

Required Source Files Before Implementation

src/modules/post/server/get-post-media.ts
src/modules/post/server/get-post-by-id.ts
src/modules/post/server/get-my-posts.ts
src/modules/post/server/list-creator-posts.ts
src/modules/post/services/post-feed-render-service.ts
src/modules/media/public/create-media-signed-url.ts

Allowed Changes

import 경로만 변경 (server → public)
기존 호출 방식 유지
기존 signed URL input 유지
기존 allowPreview/expiration 유지
기존 return shape 유지

Forbidden Changes

media internals 변경 금지
signed URL expiration 변경 금지
storage policy 변경 금지
media access behavior 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
UI 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Expected Architecture After Wave

post/server & service
↓
media/public/create-media-signed-url
↓
media/server/create-media-signed-url
↓
Supabase storage

Execution

get-post-media.ts import 전환 완료
get-post-by-id.ts import 전환 완료
get-my-posts.ts import 전환 완료
list-creator-posts.ts import 전환 완료
post-feed-render-service.ts import 전환 완료

media server 직접 import 제거 완료
post → media public boundary 경로로 통일 완료
호출부 로직 변경 없음 확인

Verification

post detail media 정상
locked preview media 정상
paid/subscriber media 정상
creator feed media 정상
main feed media 정상
my posts media 정상
creator/profile media 정상
signed URL 정상 생성
empty URL fallback 정상
runtime error 없음

Result

Success

wave-023

Domain

post

Title

CreatePostComposer storage direct access removal

Status

Completed

Goal

CreatePostComposer에서 Supabase storage 직접 접근을 제거하고 media public boundary를 통해 upload를 수행하도록 변경한다.

Target Files

Existing:

src/modules/post/ui/CreatePostComposer.tsx

New:

src/modules/media/public/upload-media.ts

Required Source Files Before Implementation

src/modules/post/ui/CreatePostComposer.tsx
src/modules/media/server/upload-media.ts
src/modules/media/public/create-media-signed-url.ts
src/modules/post/server/create-post-action.ts
src/workflows/create-post-with-media-workflow.ts

Allowed Changes

media public upload wrapper 추가
CreatePostComposer의 supabase storage 직접 접근 제거
기존 upload contract 유지
기존 함수명/export 유지
기존 UX 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
upload validation 변경
createPostAction 변경
workflow 변경
UI layout/copy 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

CreatePostComposer
↓
media/public/upload-media
↓
media/server/upload-media
↓
Supabase storage

Execution

media/public/upload-media.ts 생성 완료
requireUser 기반 uploaderUserId 결정 로직 추가 완료
uploadMedia(server) 호출로 storage upload 위임 완료
CreatePostUploadedMediaInput 형태로 mapping 완료

CreatePostComposer 리팩토링 완료
createSupabaseBrowserClient 제거 완료
supabase.storage 직접 upload 제거 완료
uploadFilesDirect → public upload 호출로 교체 완료
기존 draft 처리 / block mapping 로직 유지 완료

Verification

media upload 정상
image/video/audio/file 업로드 정상
carousel upload 정상
create post 정상
media row 생성 정상
post detail media 표시 정상
locked preview 정상
signed URL 정상
upload 실패 시 error 처리 동일
UI 변화 없음
runtime error 없음

Result

Success

wave-024

Domain

post

Title

post index public export

Status

Completed

Goal

src/modules/post/index.ts를 public export 중심으로 정리하여
post domain의 외부 진입점을 명확하게 정의한다.

Target Files

Existing:

src/modules/post/index.ts

New:

None

Required Source Files Before Implementation

src/modules/post/index.ts
src/modules/post/public/*
src/modules/post/types.ts

Allowed Changes

index.ts export 정리
public API만 명시적으로 export
기존 type export 유지
기존 함수명/export 유지

Forbidden Changes

server/lib/repository export 추가 금지
behavior 변경 금지
import 대규모 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
UI 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Expected Architecture After Wave

@/modules/post
↓
public API (explicit export)
↓
post/public/*
↓
post/server/*
↓
Supabase

Execution

index.ts 수정 완료
type export 유지 완료
public API named export 추가 완료
export * 방식 대신 named export 사용으로 collision 방지 적용 완료
server / repository / mapper / service export 노출 없음 확인 완료

Verification

typecheck 통과
build 통과
public import 정상 동작 확인
기존 type import 유지 확인
runtime behavior 변경 없음

Result

Success


wave-025

Domain

post

Title

old server/lib usage audit

Status

Completed

Goal

post domain 내 old server/lib 및 direct DB access 사용처를 감사하여
남아있는 아키텍처 위반 지점을 식별한다.

Target Files

Read only:

src/modules/post
src/app
src/workflows
src/modules/*

New:

docs/refactor-audits/post-old-usage-audit.md

Allowed Changes

문서 생성만 허용
코드 수정 금지

Forbidden Changes

코드 수정 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
UI 변경 금지
return shape 변경 금지
permission 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Execution

grep 기반 old usage 탐색 완료
modules/post/server import 사용처 확인 완료
modules/post/lib import 사용처 없음 확인
direct DB access (supabaseAdmin, createSupabaseServerClient) 사용 위치 확인 완료
use-case 레벨 DB 접근 식별 완료
app/api/workflows DB 접근 식별 완료
usage 분류 (삭제 가능 / 유지 / public 전환 / repository 이동 / 보류) 완료

Verification

audit 문서 작성 완료
remaining blockers 명확화 완료

Result

Success



wave-026

Domain

post

Title

updatePost repository split

Status

Completed

Goal

update-post.ts / use-cases/update-post.ts 내부의 Supabase 직접 접근을 제거하고 DB 접근을 post repository 계층으로 이동한다.

Target Files

Existing:

src/modules/post/use-cases/update-post.ts
src/modules/post/server/update-post.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-media-repository.ts
src/modules/post/repositories/post-block-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server/use-case 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
return shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
media/upload/create 흐름 변경
moderation flow 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

update-post.ts / use-case
↓
post-repository / post-media-repository / post-block-repository
↓
Supabase

Execution

post-repository.ts에 updatePostRow 함수 추가 완료
update-post.ts의 posts update DB query → repository 호출로 변경 완료
post-media-repository.ts에 deletePostMediaRowsByIds 추가 완료
post-media-repository.ts에 findPostMediaModerationStatusesByPostId 추가 완료
use-case에서 media delete DB 접근 제거 완료
use-case에서 media moderation_status 조회 DB 접근 제거 완료
post-block-repository.ts에 deletePostBlocksByPostId 추가 완료
use-case에서 post_blocks delete DB 접근 제거 완료
기존 insertPostBlocks repository 재사용 완료
use-case에서 supabaseAdmin 직접 import 제거 완료
media upload/create, moderation 흐름 유지 완료
update 순서 (post → media → moderation → blocks) 유지 완료

Verification

edit post 정상
media delete 정상
new media upload 정상
post_blocks update 정상
moderation re-entry 정상
remove-only edit 정상
return shape 동일
runtime error 없음

Result

Success


wave-027

Domain

post

Title

list-bookmarked-posts repository split

Status

Completed

Goal

list-bookmarked-posts.ts 내부의 bookmarks/post 조회 DB 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/list-bookmarked-posts.ts
src/modules/post/repositories/post-repository.ts

New:

src/modules/post/repositories/post-bookmark-repository.ts

Allowed Changes

repository 파일 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

list-bookmarked-posts.ts
↓
post-bookmark-repository.ts
↓
Supabase bookmarks / posts / creators / media

Execution

post-bookmark-repository.ts 생성 완료
bookmarks 조회 DB 접근 repository로 이동 완료
post / creator / media join query repository로 이동 완료
listBookmarkedPosts에서 supabaseAdmin 직접 접근 제거 완료
server 함수는 repository 호출 + mapping만 수행하도록 정리 완료

Verification

bookmarked posts 목록 정상
contentPreview 동일
creator 정보 동일
mediaThumbnailUrl 동일
빈 목록 [] 동일
error throw 동일
정렬/필터 동일
runtime error 없음

Result

Success


wave-028

Domain

post

Title

list-creator-studio-posts repository split

Status

Completed

Goal

list-creator-studio-posts.ts 내부의 studio list DB 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/list-creator-studio-posts.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-block-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

list-creator-studio-posts.ts
↓
post-repository.ts / post-block-repository.ts
↓
Supabase posts / post_blocks

Execution

post-repository.ts에 findCreatorStudioPostRowsByCreatorId 추가 완료
posts 조회 DB 접근 repository로 이동 완료

post-block-repository.ts에 findPostBlocksByPostIds 추가 완료
post_blocks 다건 조회 DB 접근 repository로 이동 완료

list-creator-studio-posts.ts 리팩토링 완료
createSupabaseServerClient 제거 완료
supabaseAdmin 제거 완료
posts 조회 → repository 호출로 변경 완료
post_blocks 조회 → repository 호출로 변경 완료

blocksMap 구성 로직 유지 완료
buildPostRenderInput 호출 유지 완료
renderInput 기반 content mapping 유지 완료
정렬/필터/조건 동일 유지 완료

Verification

creator studio list 정상
draft post 표시 정상
scheduled post 표시 정상
published post 표시 정상
archived/deleted 처리 동일
post block preview 동일
content fallback 동일
정렬 동일
runtime error 없음

Result

Success

wave-029

Domain

post

Title

get-my-posts repository split

Status

Completed

Goal

get-my-posts.ts 내부의 creator/posts/media/post_blocks DB 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/get-my-posts.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-media-repository.ts
src/modules/post/repositories/post-block-repository.ts
src/modules/post/repositories/post-like-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

get-my-posts.ts
↓
post-repository.ts / post-media-repository.ts / post-block-repository.ts / post-like-repository.ts
↓
Supabase posts / media / post_blocks / post_likes

Execution

post-repository.ts에 findCreatorForMyPosts 추가 완료
post-repository.ts에 findMyPostRowsByCreatorId 추가 완료

post-media-repository.ts에 findMyPostMediaRowsByPostIds 추가 완료

get-my-posts.ts 리팩토링 완료
supabaseAdmin direct access 제거 완료
creators 조회 → repository 호출로 변경 완료
posts 조회 → repository 호출로 변경 완료
media 조회 → repository 호출로 변경 완료
post_blocks 조회 → repository 호출로 변경 완료
post_likes 조회는 기존 repository 유지

mediaMap 구성 로직 유지 완료
blocksMap 구성 로직 유지 완료
createMediaSignedUrl 호출 유지 완료
buildPostRenderReadModel 호출 유지 완료
buildPostRenderInput 호출 유지 완료
likeState 계산 로직 유지 완료
commerce state 계산 로직 유지 완료
return shape 유지 완료

Verification

creator content page 정상
my posts list 정상
media thumbnail 정상
locked/paid/subscriber 상태 표시 동일
like count 동일
block preview 동일
empty state 동일
runtime error 없음

Result

Success

wave-030

Domain

post

Title

list-creator-posts repository split

Status

Completed

Goal

list-creator-posts.ts 내부의 creator/posts/media/post_blocks DB 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/list-creator-posts.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-media-repository.ts
src/modules/post/repositories/post-block-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
media signed URL behavior 변경
feed ordering/visibility/preview behavior 변경
unrelated cleanup

Expected Architecture After Wave

list-creator-posts.ts
↓
post-repository.ts / post-media-repository.ts / post-block-repository.ts
↓
Supabase creators / posts / media / post_blocks

Execution

post-repository.ts에 findCreatorForListCreatorPosts 추가 완료
post-repository.ts에 findPostRowsForCreatorPostList 추가 완료

post-media-repository.ts에 findReadyPostMediaRowsByPostIds 추가 완료

post-block-repository.ts에 findListCreatorPostBlocksByPostIds 추가 완료

list-creator-posts.ts 리팩토링 완료
supabaseAdmin direct access 제거 완료
creators 조회 → repository 호출로 변경 완료
posts 조회 → repository 호출로 변경 완료
media 조회 → repository 호출로 변경 완료
post_blocks 조회 → repository 호출로 변경 완료

public discovery inclusion 판단 유지 완료
createMediaSignedUrl 호출 유지 완료
feed ordering 유지 완료
visibility/preview behavior 유지 완료
mediaMap/blocksMap 구성 로직 유지 완료
return shape 유지 완료

Verification

typecheck 실행
기존 post-commerce-policy circular import alias 오류로 실패
list-creator-posts.ts direct Supabase access 제거 확인
repository 내부 DB access만 남음 확인

Result

Success with existing typecheck blocker



wave-031

Domain

post

Title

get-post-media repository split

Status

Completed

Goal

get-post-media.ts 내부의 posts/creators/media DB 직접 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/get-post-media.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-media-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지
access 판단 유지
signed URL 생성 호출 방식 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
media internals 변경
post access internals 변경
policy 변경
app 변경
UI 변경
auth/payment/subscription flow 변경
locked/preview/owner access behavior 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

get-post-media.ts
↓
post-repository.ts / post-media-repository.ts
↓
Supabase posts / creators / media

Execution

post-repository.ts에 PostMediaAccessPostRow 타입 추가 완료
post-repository.ts에 PostMediaCreatorRow 타입 추가 완료
post-repository.ts에 findPostForMediaAccess 함수 추가 완료
posts 조회 DB 접근 repository로 이동 완료

post-repository.ts에 findCreatorForPostMediaAccess 함수 추가 완료
creators + profiles 조회 DB 접근 repository로 이동 완료

post-media-repository.ts의 기존 findPostMediaRowsByPostId 재사용 완료
media 조회 DB 접근 repository 호출로 변경 완료

get-post-media.ts 리팩토링 완료
supabaseAdmin direct access 제거 완료
posts 조회 → repository 호출로 변경 완료
creators 조회 → repository 호출로 변경 완료
media 조회 → repository 호출로 변경 완료

postId validation 유지 완료
getCurrentUser 호출 유지 완료
owner 판단 유지 완료
public discovery creator/post inclusion 판단 유지 완료
resolvePostAccessState 호출 유지 완료
createMediaSignedUrl 호출 유지 완료
signed URL input 유지 완료
locked/preview/owner access behavior 유지 완료
empty media behavior 유지 완료
return shape 유지 완료

Verification

get-post-media.ts에서 supabaseAdmin 직접 import 제거 확인
get-post-media.ts에서 .from(...) 직접 접근 제거 확인
post media 조회 경로 repository 전환 확인
owner media 접근 판단 로직 유지 확인
subscriber-only locked media behavior 유지 확인
paid locked media behavior 유지 확인
signed URL 생성 호출 유지 확인
empty media behavior 유지 확인
typecheck 실행
기존 post-commerce-policy circular import alias 오류로 실패
build 실행
next build가 5분 이상 추가 출력 없이 멈춰 종료
runtime error 없음

Result

Success with existing typecheck blocker and build timeout


wave-032

Domain

post

Title

get-creator-studio-post repository split

Status

Completed

Goal

get-creator-studio-post.ts 내부의 posts/media/storage/post_blocks DB 직접 접근을 repository/public boundary로 이동한다.

Target Files

Existing:

src/modules/post/server/get-creator-studio-post.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/repositories/post-media-repository.ts
src/modules/post/repositories/post-block-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 storage signed URL 생성을 media public boundary 호출로 변경
기존 함수명/export 유지
반환 shape 유지
editor draft normalizer 유지
media ordering 유지
block ordering 유지
edit page input shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
media internals 변경
post access internals 변경
policy 변경
app 변경
UI 변경
auth/payment/subscription flow 변경
return shape 변경
permission behavior 변경
error behavior 변경
forbidden files 변경
unrelated cleanup

Expected Architecture After Wave

get-creator-studio-post.ts
↓
post-repository.ts / post-media-repository.ts / post-block-repository.ts
↓
media/public/create-media-signed-url
↓
Supabase posts / media / post_blocks / storage

Execution

post-repository.ts에 CreatorStudioPostDetailRow 타입 추가 완료
post-repository.ts에 findCreatorStudioPostById 함수 추가 완료
posts 단건 조회 DB 접근 repository로 이동 완료

post-media-repository.ts에 findReadyPostMediaRowsByPostId 함수 추가 완료
ready media 조회 DB 접근 repository로 이동 완료

post-block-repository.ts의 기존 findPostBlocksByPostId 재사용 완료
post_blocks 조회 DB 접근 repository 호출로 변경 완료

get-creator-studio-post.ts 리팩토링 완료
createSupabaseServerClient 직접 import 제거 완료
supabaseAdmin 직접 import 제거 완료
posts 조회 → repository 호출로 변경 완료
media 조회 → repository 호출로 변경 완료
post_blocks 조회 → repository 호출로 변경 완료
storage.createSignedUrl 직접 호출 제거 완료
createMediaSignedUrl public boundary 호출로 변경 완료

postId/creatorId 조건 유지 완료
status 필터 유지 완료
deleted_at null 조건 유지 완료
media ready 조건 유지 완료
media sort_order 정렬 유지 완료
signed URL expiration 60 * 60 유지 완료
buildPostRenderInput 호출 유지 완료
buildPostEditorDraftFromPostBlocks 호출 유지 완료
content fallback 유지 완료
price fallback 유지 완료
return shape 유지 완료

Verification

get-creator-studio-post.ts에서 createSupabaseServerClient 직접 import 제거 확인
get-creator-studio-post.ts에서 supabaseAdmin 직접 import 제거 확인
get-creator-studio-post.ts에서 .from(...) 직접 접근 제거 확인
get-creator-studio-post.ts에서 storage.from/createSignedUrl 직접 접근 제거 확인
get-creator-studio-post.ts에서 getPostBlocks server wrapper 의존 제거 확인
creator studio edit page input shape 유지 확인
existing media preview signed URL 생성 경로 public boundary 전환 확인
block editor initial state 생성 로직 유지 확인
unauthorized/null behavior 유지 확인
typecheck 실행
기존 post-commerce-policy circular import alias 오류로 실패
신규 타입 오류 없음 확인
runtime error 없음

Result

Success with existing typecheck blocker


wave-033

Domain

post

Title

app page post public boundary cleanup

Status

Completed

Goal

src/app page/layout 단에서 modules/post/server 또는 modules/post/lib 직접 import를 제거하고 post public boundary를 사용하도록 전환한다.

Target Files

Existing:

src/app/creator/studio/posts/[postId]/edit/page.tsx
src/app/creator/studio/page.tsx
src/app/creator/content/page.tsx
src/app/creator/[username]/page.tsx
src/app/post/[postId]/edit/page.tsx
src/app/post/[postId]/page.tsx
src/app/profile/page.tsx

New:

src/modules/post/public/get-creator-studio-post.ts
src/modules/post/public/list-creator-studio-posts.ts
src/modules/post/public/get-my-posts.ts
src/modules/post/public/get-post-locked-preview-presentation.ts
src/modules/post/public/delete-post-action.ts

Allowed Changes

public wrapper 파일 추가
이미 public wrapper가 있는 함수는 import 경로만 public으로 변경
app page의 modules/post/server 직접 import 제거
app page의 modules/post/lib 직접 import 제거
기존 호출 방식 유지
기존 props 전달 유지
기존 rendering condition 유지
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

src/modules/post/server/* 내부 로직 변경
src/modules/post/repositories/** 변경
src/modules/post/ui/** 변경
payment/media/subscription/auth 관련 파일 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
UI layout/copy 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

app page/layout
↓
post/public/get-creator-studio-post
post/public/list-creator-studio-posts
post/public/get-my-posts
post/public/get-post-locked-preview-presentation
post/public/delete-post-action
post/public/get-creator-feed
post/public/get-post
post/public/get-post-commerce-cta-decision
↓
post/server or post/lib compatibility layer
↓
repositories / policies / services / mappers
↓
Supabase

Execution

Step 1: app page post server/lib import audit

target app page 전체에서 @/modules/post/server/* 직접 import 확인 완료
target app page 전체에서 @/modules/post/lib/* 직접 import 확인 완료
위반 import 7개 식별 완료

Step 2: existing public wrapper import 전환

src/app/creator/[username]/page.tsx getCreatorFeed import를 public boundary로 전환 완료
src/app/profile/page.tsx getCreatorFeed import를 public boundary로 전환 완료
src/app/post/[postId]/page.tsx getPostById import를 public boundary로 유지/전환 완료
src/app/post/[postId]/page.tsx getPostCommerceCtaDecision import를 public boundary로 유지/전환 완료

Step 3: missing public wrapper 추가

src/modules/post/public/get-creator-studio-post.ts 생성 완료
getCreatorStudioPost public wrapper 구현 완료
CreatorStudioPostDetail type re-export 완료

src/modules/post/public/list-creator-studio-posts.ts 생성 완료
listCreatorStudioPosts public wrapper 구현 완료
CreatorStudioPost type re-export 완료

src/modules/post/public/get-my-posts.ts 생성 완료
getMyPosts public wrapper 구현 완료
GetMyPostsInput / GetMyPostsResult / MyPostListItem type re-export 완료

src/modules/post/public/get-post-locked-preview-presentation.ts 생성 완료
getPostLockedPreviewPresentation public wrapper 구현 완료
PostLockedPreviewPresentation type re-export 완료

src/modules/post/public/delete-post-action.ts 생성 완료
deletePostAction public re-export 완료

Step 4: app page import 전환

src/app/creator/studio/posts/[postId]/edit/page.tsx getCreatorStudioPost import 전환 완료
src/app/creator/studio/page.tsx listCreatorStudioPosts import 전환 완료
src/app/creator/content/page.tsx getMyPosts import 전환 완료
src/app/creator/[username]/page.tsx getCreatorFeed import 전환 완료
src/app/post/[postId]/edit/page.tsx getCreatorStudioPost import 전환 완료
src/app/post/[postId]/page.tsx deletePostAction import 전환 완료
src/app/post/[postId]/page.tsx getPostLockedPreviewPresentation import 전환 완료
src/app/profile/page.tsx getCreatorFeed import 전환 완료

Step 5: behavior preservation 확인

기존 호출 방식 유지 완료
기존 props 전달 유지 완료
기존 rendering condition 유지 완료
locked preview presentation 호출 방식 유지 완료
delete action bind/action behavior 유지 완료
edit page notFound behavior 유지 완료
creator studio list rendering 유지 완료
creator content result mapping 유지 완료
profile feed mapping 유지 완료

Verification

target app page에서 @/modules/post/server/* 직접 import 0개 확인
target app page에서 @/modules/post/lib/* 직접 import 0개 확인
creator studio page public boundary 전환 확인
creator content page public boundary 전환 확인
creator public page public boundary 전환 확인
post edit page public boundary 전환 확인
post detail page public boundary 전환 확인
profile page public boundary 전환 확인
locked preview 표시 경로 public boundary 전환 확인
delete action 경로 public boundary 전환 확인
typecheck 실행
기존 post-commerce-policy circular import alias 오류로 실패
신규 타입 오류 없음 확인
runtime error 없음

Result

Success with existing typecheck blocker

wave-034

Domain

post

Title

app API post public boundary cleanup

Status

Completed

Goal

src/app/api route에서 post server/lib/repository 직접 접근을 제거하고 public/use-case boundary로 전환한다.

Target Files

Existing:

src/app/api/post/feed/route.ts
src/app/api/post/purchase/route.ts
src/app/api/post/create/route.ts
src/app/api/post/[postId]/comments/route.ts
src/app/api/post/[postId]/comment/route.ts
src/app/api/post/[postId]/like/route.ts
src/app/api/comment/[commentId]/like/route.ts
src/app/api/comment/[commentId]/route.ts
src/app/api/payment/ppv-post/route.ts

New:

src/modules/post/public/comment-data.ts
src/modules/post/public/comment-item.ts
src/modules/post/public/comment-like.ts
src/modules/post/public/comment-permissions.ts
src/modules/post/public/post-like.ts
src/modules/post/public/ppv-price.ts
src/modules/post/use-cases/comment-data.ts
src/modules/post/use-cases/comment-like.ts
src/modules/post/use-cases/post-like.ts

Allowed Changes

public wrapper 파일 추가
use-case boundary 파일 추가
기존 public wrapper가 있는 함수는 import 경로만 public으로 변경
app API route의 modules/post/server 직접 import 제거
app API route의 modules/post/lib 직접 import 제거
app API route의 modules/post/repositories 직접 import 제거
기존 request parsing 유지
기존 auth check 유지
기존 response JSON shape 유지
기존 notification side effect 유지
기존 like count / is_liked / comment item mapping 유지
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

route response shape 변경 금지
auth 방식 변경 금지
notification side effect 변경 금지
comments/likes item shape 변경 금지
payment/PPV behavior 변경 금지
src/modules/post/server/* 내부 로직 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
storage bucket/policy 변경 금지
UI layout/copy 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지

Expected Architecture After Wave

app/api
↓
post/public/get-post
post/public/get-creator-feed
post/public/delete-post
post/public/ppv-price
post/public/comment-data
post/public/comment-item
post/public/comment-like
post/public/comment-permissions
post/public/post-like
↓
post/use-cases/comment-data
post/use-cases/comment-like
post/use-cases/post-like
↓
post/repositories / post/lib compatibility
↓
Supabase

Execution

Step 1: app API post internal import audit

target app API route 전체에서 @/modules/post/server/* 직접 import 확인 완료
target app API route 전체에서 @/modules/post/lib/* 직접 import 확인 완료
target app API route 전체에서 @/modules/post/repositories/* 직접 import 확인 완료
위반 import 식별 완료

Step 2: existing public wrapper import 전환

src/app/api/post/feed/route.ts getCreatorFeed import를 public boundary로 전환 완료
src/app/api/post/purchase/route.ts getPostById import를 public boundary로 전환 완료
src/app/api/payment/ppv-post/route.ts getPostById import를 public boundary로 전환 완료
src/app/api/post/[postId]/delete/route.ts deletePost import를 public boundary로 전환 완료

Step 3: missing public/use-case boundary 추가

src/modules/post/use-cases/comment-data.ts 생성 완료
comment repository 호출 re-export boundary 추가 완료
comment likes 조회 boundary 추가 완료

src/modules/post/use-cases/comment-like.ts 생성 완료
comment_likes repository 호출 boundary 추가 완료
comment notification owner 조회 boundary 추가 완료

src/modules/post/use-cases/post-like.ts 생성 완료
post_likes repository 호출 boundary 추가 완료
post like notification 대상 조회 boundary 추가 완료

src/modules/post/public/comment-data.ts 생성 완료
comment data public boundary 추가 완료

src/modules/post/public/comment-item.ts 생성 완료
comment item compatibility public boundary 추가 완료

src/modules/post/public/comment-like.ts 생성 완료
comment like public boundary 추가 완료

src/modules/post/public/comment-permissions.ts 생성 완료
comment permission public boundary 추가 완료

src/modules/post/public/post-like.ts 생성 완료
post like public boundary 추가 완료

src/modules/post/public/ppv-price.ts 생성 완료
PPV price public boundary 추가 완료

Step 4: comments route import 전환

src/app/api/post/[postId]/comments/route.ts comment permission import 전환 완료
src/app/api/post/[postId]/comments/route.ts comment item import 전환 완료
src/app/api/post/[postId]/comments/route.ts comment repository import를 public boundary로 전환 완료
src/app/api/post/[postId]/comment/route.ts comment data import를 public boundary로 전환 완료
src/app/api/post/[postId]/comment/route.ts comment item import를 public boundary로 전환 완료
src/app/api/post/[postId]/comment/route.ts comment permission import를 public boundary로 전환 완료
src/app/api/comment/[commentId]/route.ts comment data import를 public boundary로 전환 완료
src/app/api/comment/[commentId]/route.ts comment permission import를 public boundary로 전환 완료

Step 5: likes route import 전환

src/app/api/post/[postId]/like/route.ts post like repository import를 public boundary로 전환 완료
src/app/api/comment/[commentId]/like/route.ts comment like repository import를 public boundary로 전환 완료
post like route의 direct supabaseAdmin access 제거 완료
comment like route의 direct supabaseAdmin access 제거 완료
post like notification 대상 조회를 public/use-case boundary로 전환 완료
comment like notification 대상 조회를 public/use-case boundary로 전환 완료

Step 6: create route import 전환

src/app/api/post/create/route.ts ppv-price lib import를 public boundary로 전환 완료

Step 7: behavior preservation 확인

기존 request parsing 유지 완료
기존 auth check 유지 완료
기존 response JSON shape 유지 완료
기존 comment item shape 유지 완료
기존 likes_count / is_liked 계산 유지 완료
기존 notification input shape 유지 완료
기존 notification side effect 유지 완료
기존 PPV validation 유지 완료
기존 payment route behavior 유지 완료
기존 feed response shape 유지 완료

Verification

target app API route에서 @/modules/post/server/* 직접 import 0개 확인
target app API route에서 @/modules/post/lib/* 직접 import 0개 확인
target app API route에서 @/modules/post/repositories/* 직접 import 0개 확인
target app API route에서 supabaseAdmin 직접 접근 0개 확인
target app API route에서 DB .from(...) 직접 접근 0개 확인
feed API public boundary 전환 확인
post purchase API public boundary 전환 확인
post create API public boundary 전환 확인
comment list public/use-case boundary 전환 확인
comment create public/use-case boundary 전환 확인
comment delete public/use-case boundary 전환 확인
post like/unlike public/use-case boundary 전환 확인
comment like/unlike public/use-case boundary 전환 확인
PPV post payment route public boundary 전환 확인
response shape 동일 확인
typecheck 실행
기존 post-commerce-policy circular import alias 오류로 실패
신규 타입 오류 없음 확인
runtime error 없음

Result

Success with existing typecheck blocker

wave-035

Domain

post

Title

cross-domain post import cleanup

Status

Completed

Goal

다른 domain에서 modules/post/server 또는 modules/post/lib 직접 import하는 사용처를 제거하고 post public boundary로 전환한다.

Target Files

Existing:

src/modules/creator/server/get-creator-page.ts
src/modules/payment/server/verify-payment-access-after-success.ts
src/modules/feed/server/get-home-feed.ts
src/modules/feed/server/feed-inclusion-policy.ts
src/modules/feed/server/get-public-upcoming-posts.ts
src/modules/search/server/discovery-eligibility-contract.ts
src/modules/search/server/search-creators.ts
src/modules/profile/ui/ProfileContentTabs.tsx
src/modules/feed/ui/FeedComposer.tsx
src/modules/moderation/server/apply-video-moderation-outcome.ts
src/modules/media/public/create-media-signed-url.ts
src/workflows/create-post-with-media-workflow.ts

New:

src/modules/post/public/create-post.ts
src/modules/post/public/update-post-status.ts
src/modules/post/public/create-post-blocks.ts
src/modules/post/public/create-post-draft-policy.ts
src/modules/post/public/create-feed-post-action.ts
src/modules/post/public/public-discovery-inclusion.ts
src/modules/post/public/post-render-input.ts
src/modules/post/public/post-render-read-model.ts
src/modules/post/public/can-view-post.ts

Existing Modified:

src/modules/post/public/get-post-commerce-cta-decision.ts
src/modules/post/policies/post-commerce-policy.ts

Allowed Changes

public wrapper 파일 추가
public type export 추가
runtime import를 post public wrapper로 전환
type-only import를 public type export로 전환
기존 public wrapper가 있는 함수는 import 경로만 public으로 변경
기존 함수명/export 유지
기존 호출 방식 유지
기존 return shape 유지

Forbidden Changes

creator/feed/search/payment/media domain behavior 변경 금지
payment access behavior 변경 금지
media signed URL behavior 변경 금지
moderation outcome behavior 변경 금지
UI layout/copy 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
auth/payment/subscription flow 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
refactor-progress 문서 변경 금지

Expected Architecture After Wave

creator / feed / search / payment / media / moderation / profile / workflows
↓
post/public/*
↓
post/server or post/lib compatibility layer
↓
repositories / policies / services / mappers
↓
Supabase

Execution

Step 1: cross-domain post internal import audit

wave target files 전체에서 @/modules/post/server 직접 import 확인 완료
wave target files 전체에서 @/modules/post/lib 직접 import 확인 완료
wave target files 전체에서 @/modules/post/repositories 직접 import 확인 완료
runtime import와 type-only import 구분 완료

Step 2: public wrapper 추가

src/modules/post/public/create-post.ts 생성 완료
createPost public wrapper 추가 완료

src/modules/post/public/update-post-status.ts 생성 완료
updatePostStatus public wrapper 추가 완료

src/modules/post/public/create-post-blocks.ts 생성 완료
createPostBlocks public wrapper 추가 완료

src/modules/post/public/create-post-draft-policy.ts 생성 완료
create post draft policy public re-export 추가 완료

src/modules/post/public/create-feed-post-action.ts 생성 완료
createFeedPostAction public re-export 추가 완료

src/modules/post/public/public-discovery-inclusion.ts 생성 완료
public discovery helper public re-export 추가 완료
PostPublicState type export 추가 완료

src/modules/post/public/post-render-input.ts 생성 완료
buildPostRenderInput public re-export 추가 완료

src/modules/post/public/post-render-read-model.ts 생성 완료
post render read model public re-export 추가 완료

src/modules/post/public/can-view-post.ts 생성 완료
canViewPost public wrapper 추가 완료
CanViewPostInput type export 추가 완료

Step 3: commerce public export 보강

src/modules/post/public/get-post-commerce-cta-decision.ts에 getBlockedPostCommerceState export 추가 완료
src/modules/post/public/get-post-commerce-cta-decision.ts에 getPostCommerceState export 추가 완료
src/modules/post/policies/post-commerce-policy.ts의 circular self re-export 문제 수정 완료
기존 CTA decision shape 유지 완료
lockReason optional caller 대응 유지 완료

Step 4: cross-domain import 전환

src/modules/creator/server/get-creator-page.ts post lib/server import를 public boundary로 전환 완료
src/modules/payment/server/verify-payment-access-after-success.ts getPostById import를 public boundary로 전환 완료
src/modules/feed/server/get-home-feed.ts getPostAccess / commerce / render input import를 public boundary로 전환 완료
src/modules/feed/server/feed-inclusion-policy.ts public discovery import를 public boundary로 전환 완료
src/modules/feed/server/get-public-upcoming-posts.ts public discovery import를 public boundary로 전환 완료
src/modules/search/server/discovery-eligibility-contract.ts public discovery import를 public boundary로 전환 완료
src/modules/search/server/search-creators.ts public discovery import를 public boundary로 전환 완료
src/modules/profile/ui/ProfileContentTabs.tsx MyPostListItem type import를 public boundary로 전환 완료
src/modules/feed/ui/FeedComposer.tsx createFeedPostAction import를 public boundary로 전환 완료
src/modules/moderation/server/apply-video-moderation-outcome.ts updatePostStatus import를 public boundary로 전환 완료
src/modules/media/public/create-media-signed-url.ts canViewPost import를 public boundary로 전환 완료
src/workflows/create-post-with-media-workflow.ts createPost / updatePostStatus / createPostBlocks / create post draft policy import를 public boundary로 전환 완료

Step 5: behavior preservation 확인

기존 호출 방식 유지 완료
기존 function signature 유지 완료
기존 return shape 유지 완료
payment access verification retry/response behavior 유지 완료
media signed URL access 판단 유지 완료
moderation outcome transition 호출 유지 완료
feed render input 생성 behavior 유지 완료
public discovery eligibility behavior 유지 완료
profile tabs prop type 유지 완료
feed composer action 호출 유지 완료
workflow create post orchestration 순서 유지 완료

Verification

wave target files에서 @/modules/post/server 직접 import 0개 확인
wave target files에서 @/modules/post/lib 직접 import 0개 확인
wave target files에서 @/modules/post/repositories 직접 import 0개 확인
creator page import boundary 전환 확인
home feed import boundary 전환 확인
search/discovery import boundary 전환 확인
profile tabs type import boundary 전환 확인
feed composer action import boundary 전환 확인
payment access verify import boundary 전환 확인
media signed URL canViewPost import boundary 전환 확인
moderation outcome updatePostStatus import boundary 전환 확인
create post workflow import boundary 전환 확인
typecheck 통과
tsconfig.tsbuildinfo 원복 완료
runtime error 없음

Issues

src/modules/search/ui/SearchExploreCommentsDrawer.tsx에 @/modules/post/lib/comment-item import가 1개 남아있음
해당 파일은 wave-035 Existing Target Files 범위 밖이므로 변경하지 않음

Result

Success with out-of-scope remaining import


wave-036

Domain

post

Title

post lib usage audit and classification

Status

Completed

Goal

src/modules/post/lib 사용처를 재감사하고, 각 lib 파일을 유지 / public wrapper 필요 / policy 이동 / service 이동 / mapper 이동 / 삭제 후보로 분류한다.

Target Files

Read only:

src/modules/post/lib/**
src/modules/post/server/**
src/modules/post/services/**
src/modules/post/mappers/**
src/modules/post/policies/**
src/modules/post/public/**
src/app/**
src/modules/**
src/workflows/**

New:

docs/refactor-audits/post-lib-usage-audit.md

Required Source Files Before Implementation

docs/refactor-audits/post-old-usage-audit.md
최신 grep 결과
src/modules/post/lib/**
src/modules/post/public/**
src/modules/post/index.ts

Allowed Changes

audit 문서 생성만 허용
코드 수정 금지
lib 파일 삭제 금지
policy/service/mapper 이동 금지
app/import 변경 금지
behavior 변경 금지

Forbidden Changes

코드 수정 금지
lib 파일 삭제 금지
policy/service/mapper 이동 금지
app/import 변경 금지
behavior 변경 금지
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup
refactor-progress 문서 변경 금지

Expected Architecture After Wave

No architecture change.
Audit only.

Execution

Step 1: required source 확인

docs/refactor-audits/post-old-usage-audit.md 확인 완료
src/modules/post/lib/** 파일 목록 확인 완료
src/modules/post/public/** public wrapper 목록 확인 완료
src/modules/post/index.ts 확인 완료

Step 2: latest grep 실행

@/modules/post/lib 직접 import 전체 재검색 완료
src/app direct post/lib import 0개 확인 완료
app/API direct post/lib import 0개 확인 완료
cross-domain direct post/lib import 1개 확인 완료

Step 3: external usage 분류

src/modules/search/ui/SearchExploreCommentsDrawer.tsx의 @/modules/post/lib/comment-item import 확인 완료
public replacement로 @/modules/post/public/comment-item 존재 확인 완료
다음 wave에서 import-path-only 변경 가능 항목으로 분류 완료

Step 4: internal usage 분류

post/server 내부 post-render-input 사용처 확인 완료
post/server 내부 public-discovery-inclusion 사용처 확인 완료
post/server 내부 can-purchase-post 사용처 확인 완료
post/server 내부 post-commerce-policy compatibility 사용처 확인 완료
post/services 내부 post-render-input / post-commerce-policy 사용처 확인 완료
post/ui 내부 comment-item 사용처 확인 완료
post/repositories 내부 CommentRow type 사용처 확인 완료
post/public compatibility wrapper 사용처 확인 완료

Step 5: lib별 classification 작성

can-purchase-post.ts → policy 이동 후보로 분류 완료
comment-item.ts → mapper 또는 compatibility helper 유지로 분류 완료
comment-permissions.ts → policy 이동 후보 / compatibility re-export로 분류 완료
get-post-locked-preview-presentation.ts → 유지 또는 service/presenter 후보로 분류 완료
get-post-public-state.ts → policy 이동 후보로 분류 완료
is-post-hidden.ts → 삭제 후보로 분류 완료
is-post-public-base-visible.ts → policy 이동 후보로 분류 완료
is-post-published-visible.ts → policy 이동 후보로 분류 완료
is-post-upcoming-visible.ts → policy 이동 후보로 분류 완료
post-commerce-policy.ts → compatibility re-export 유지 / import cleanup 후보로 분류 완료
post-render-input.ts → service 이동 후보로 분류 완료
ppv-price.ts → 유지 / public contract support로 분류 완료
public-discovery-inclusion.ts → policy/service 이동 후보로 분류 완료

Step 6: audit 문서 생성

docs/refactor-audits/post-lib-usage-audit.md 생성 완료
external usage / internal usage 구분 기록 완료
삭제 후보 usage 0 근거 기록 완료
다음 wave 후보 기록 완료

Verification

audit 문서 생성 완료
lib별 classification 완료
external usage / internal usage 구분 완료
삭제 후보 usage 0 근거 포함 완료
src/app direct post/lib import 0개 확인
app/API direct post/lib import 0개 확인
cross-domain direct post/lib import 1개 확인
코드 변경 없음
runtime behavior 변경 없음

Issues

src/modules/search/ui/SearchExploreCommentsDrawer.tsx에 @/modules/post/lib/comment-item import가 1개 남아있음
public replacement는 src/modules/post/public/comment-item.ts에 이미 존재함
다음 wave에서 import-path-only 변경 가능

Result

Success

wave-037

Domain

post

Title

safe post lib public boundary migration

Status

Completed

Goal

wave-036 audit 결과에서 외부 사용처가 남아 있지만 behavior risk가 낮은 post lib 함수를 public boundary로 감싼다.

Target Files

Existing:

src/modules/post/lib/**
src/modules/post/public/**
src/modules/post/index.ts
src/modules/search/ui/SearchExploreCommentsDrawer.tsx

New:

None

Required Source Files Before Implementation

docs/refactor-audits/post-lib-usage-audit.md
src/modules/post/lib/comment-item.ts
src/modules/post/public/comment-item.ts
src/modules/search/ui/SearchExploreCommentsDrawer.tsx
src/modules/post/public/*
src/modules/post/index.ts

Allowed Changes

low-risk public wrapper 후보만 선택
public wrapper가 이미 존재하는 경우 재사용
wrapper는 기존 lib 함수를 그대로 호출하거나 re-export
외부 사용처 import만 public으로 전환
post 내부 사용처는 필요하면 그대로 유지
src/modules/post/index.ts에 필요한 public export만 명시적으로 추가
기존 함수명/export 유지
기존 호출 방식 유지
기존 return shape 유지

Forbidden Changes

lib 내부 로직 변경 금지
comment item shape 변경 금지
render input shape 변경 금지
discovery eligibility behavior 변경 금지
locked preview behavior 변경 금지
UI layout/copy 변경 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
lib 파일 삭제 금지

Expected Architecture After Wave

search/ui
↓
post/public/comment-item
↓
post/lib/comment-item compatibility helper

Execution

Step 1: wave-036 audit 확인

docs/refactor-audits/post-lib-usage-audit.md 확인 완료
external direct import remaining 항목 확인 완료
src/modules/search/ui/SearchExploreCommentsDrawer.tsx의 @/modules/post/lib/comment-item import 확인 완료
public replacement로 src/modules/post/public/comment-item.ts 존재 확인 완료

Step 2: public wrapper 재사용 확인

src/modules/post/public/comment-item.ts 확인 완료
createCommentItem / isCommentItem / CommentItem / CommentItemProfile / CommentItemViewModel / CommentRow re-export 확인 완료
새 public wrapper 파일 불필요 확인 완료

Step 3: 외부 사용처 import 전환

src/modules/search/ui/SearchExploreCommentsDrawer.tsx import 전환 완료
@/modules/post/lib/comment-item → @/modules/post/public/comment-item 변경 완료
isCommentItem 호출 유지 완료
CommentItem type 사용 유지 완료
comment filtering 로직 유지 완료
drawer rendering 로직 유지 완료

Step 4: post index public export 보강

src/modules/post/index.ts에 comment item public export 추가 완료
createCommentItem export 추가 완료
isCommentItem export 추가 완료
CommentItem type export 추가 완료
CommentItemProfile type export 추가 완료
CommentItemViewModel type export 추가 완료
CommentRow type export 추가 완료
기존 public export 유지 완료

Step 5: behavior preservation 확인

comment item shape 변경 없음
isCommentItem 로직 변경 없음
createCommentItem 로직 변경 없음
SearchExploreCommentsDrawer fetch/comment filtering 흐름 유지 완료
UI layout/copy 변경 없음
post 내부 lib 사용처 유지 완료
lib 파일 삭제 없음

Verification

src/modules/search direct post/lib import 0개 확인
src/app direct post/lib import 0개 확인
src/workflows direct post/lib import 0개 확인
SearchExploreCommentsDrawer public boundary 전환 확인
comment item public wrapper 재사용 확인
comment item shape 동일
typecheck 통과
build 통과
runtime error 없음

Issues

첫 npm run build는 sandbox 환경에서 Turbopack port binding 제한으로 실패
승인 후 sandbox 밖에서 npm run build 재실행 시 정상 통과

Result

Success

wave-038

Domain

post

Title

post use-case / server internal boundary audit

Status

Completed

Goal

post domain 내부에서 use-cases, server, services, mappers, policies, repositories 간 import 방향이 baseline을 위반하는지 최종 점검한다.

Target Files

Read only:

src/modules/post/use-cases/**
src/modules/post/server/**
src/modules/post/services/**
src/modules/post/mappers/**
src/modules/post/policies/**
src/modules/post/repositories/**
src/modules/post/public/**

New:

docs/refactor-audits/post-internal-boundary-audit.md

Required Source Files Before Implementation

최신 grep 결과
docs/refactor-audits/post-old-usage-audit.md
docs/refactor-audits/post-lib-usage-audit.md
src/modules/post/**

Allowed Changes

audit 문서 생성만 허용
코드 수정 금지
import 변경 금지
파일 이동 금지
삭제 금지
behavior 변경 금지
refactor-progress 문서 변경 금지

Forbidden Changes

코드 수정 금지
import 변경 금지
파일 이동 금지
삭제 금지
behavior 변경 금지
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup
refactor-progress 문서 변경 금지

Expected Architecture After Wave

No runtime architecture change.
Audit only.

Execution

Step 1: required source 확인

docs/refactor-audits/post-old-usage-audit.md 확인 완료
docs/refactor-audits/post-lib-usage-audit.md 확인 완료
src/modules/post/** 파일 목록 확인 완료
기존 audit 문서와 최신 grep 결과 차이 확인 완료
post-old-usage-audit.md 일부 항목은 wave-026 ~ wave-037 이후 stale 상태임을 문서에 기록 완료

Step 2: latest grep 실행

post 내부 import/export 전체 grep 완료
Supabase client / .from / storage / rpc 직접 접근 grep 완료
post 내부 layer import grep 완료
public / use-cases / server / services / mappers / policies / repositories 범위 확인 완료

Step 3: public layer 확인

public wrapper가 use-case / policy / server / lib compatibility entry를 감싸는 상태 확인 완료
comment-data / comment-like / post-like public wrapper는 use-case 경로 사용 확인 완료
get-post-commerce-cta-decision public wrapper는 policy 경로 사용 확인 완료
server/lib compatibility wrapper 목록 분류 완료
old + new 공존 대상으로 public wrapper 유지 필요 기록 완료

Step 4: use-case layer 확인

use-cases/comment-data.ts direct Supabase access 없음 확인
use-cases/comment-like.ts direct Supabase access 없음 확인
use-cases/post-like.ts direct Supabase access 없음 확인
use-cases/update-post.ts direct Supabase access 없음 확인
use-cases/update-post.ts의 post/media/moderation server internal import 확인 완료
use-case direct DB access 없음으로 분류 완료
use-case → server/cross-domain server dependency는 follow-up 후보로 기록 완료

Step 5: server compatibility layer 확인

server/update-post-status.ts direct Supabase access 확인 완료
server/delete-post.ts direct Supabase access 확인 완료
server/list-liked-posts.ts direct Supabase access 확인 완료
server 내부 old lib import 사용처 확인 완료
server compatibility layer가 active orchestration 역할로 남아 있음 기록 완료
repository migration 완료된 server 파일과 남은 direct DB access 파일 분류 완료

Step 6: service layer 확인

services direct Supabase access 없음 확인
post-status-service.ts의 server/post-moderation-transition-policy import 확인 완료
post-edit-service.ts의 server/edit-post-draft-policy import 확인 완료
post-edit-service.ts의 server/post-edit-moderation-reentry-policy import 확인 완료
post-feed-render-service.ts의 lib/server helper import 확인 완료
post-feed-render-service.ts의 media public signed URL 호출 확인 완료
service purity cleanup 후보 기록 완료

Step 7: mapper layer 확인

mappers direct Supabase access 없음 확인
mappers app route / server action / storage API import 없음 확인
post-media-mapper.ts의 repository row type import 확인 완료
post-feed-mapper.ts의 repository row type import 확인 완료
post-render-mapper.ts의 server locked preview type import 확인 완료
mapper type coupling cleanup 후보 기록 완료

Step 8: policy layer 확인

policies direct Supabase access 없음 확인
post-access-policy.ts → post-visibility-policy import 확인 완료
post-commerce-policy.ts → domain type import 확인 완료
post-visibility-policy.ts → creator/lib/creator-identity import 확인 완료
creator pure helper 의존은 later cross-domain policy cleanup 후보로 기록 완료

Step 9: repository layer 확인

repositories DB access 집중 확인 완료
repositories에서 post/public import 없음 확인 완료
repositories에서 post/server import 없음 확인 완료
repositories에서 post/services import 없음 확인 완료
repositories에서 post/policies import 없음 확인 완료
comment-repository.ts의 post/lib/comment-item CommentRow type import 확인 완료
repository → lib type coupling cleanup 후보 기록 완료

Step 10: audit 문서 생성

docs/refactor-audits/post-internal-boundary-audit.md 생성 완료
internal layer violation 목록 작성 완료
compatibility wrapper 분류 완료
repository DB access only 확인 결과 기록 완료
use-case direct DB access 없음 확인 결과 기록 완료
후속 wave 후보 기록 완료

Verification

internal layer violation 목록 작성 완료
허용 가능한 compatibility wrapper 분류 완료
repository DB access only 확인
repositories에서 public/server/services/policies import 없음 확인
use-case direct DB access 없음 확인
mapper direct Supabase access 없음 확인
service direct Supabase access 없음 확인
policy direct Supabase access 없음 확인
코드 변경 없음
import 변경 없음
runtime behavior 변경 없음
refactor-progress 문서 변경 없음

Issues

server/update-post-status.ts에 server layer direct DB access 남아 있음
server/delete-post.ts에 server layer direct DB access 남아 있음
server/list-liked-posts.ts에 server layer direct DB access 남아 있음
use-cases/update-post.ts가 post/media/moderation server internals를 import함
services/post-feed-render-service.ts가 post/lib 및 post/server helper에 의존함
services/post-edit-service.ts가 post/server policy helper에 의존함
services/post-status-service.ts가 post/server policy helper에 의존함
mappers 일부가 repository/server type에 결합됨
comment-repository.ts가 post/lib/comment-item의 CommentRow type에 의존함
public wrapper 다수가 server/lib compatibility entry를 감싸고 있음

Result

Success



wave-039

Domain

post

Title

post remaining grep re-audit

Status

Completed

Goal

post domain 종료 전 전체 grep 재검사를 수행하여 old import / direct DB access / public boundary 위반 / 삭제 후보를 확정한다.

Target Files

Read only:

src/modules/post
src/app
src/workflows
src/modules

New:

docs/refactor-audits/post-remaining-grep-audit.md

Existing Reused Files:

docs/refactor-audits/post-old-usage-audit.md
docs/refactor-audits/post-lib-usage-audit.md
docs/refactor-audits/post-internal-boundary-audit.md

Allowed Changes

audit 문서 생성만 허용
docs/refactor-audits/grep-results/* 갱신 가능
코드 수정 금지
old 파일 삭제 금지
export 정리 금지
behavior 변경 금지
refactor-progress 문서 변경 금지

Forbidden Changes

코드 수정 금지
old 파일 삭제 금지
export 정리 금지
behavior 변경 금지
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI copy/layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup
refactor-progress 문서 변경 금지

Expected Architecture After Wave

No runtime architecture change.
Audit only.

Execution

Step 1: required source 확인

docs/refactor-audits/post-old-usage-audit.md 확인 완료
docs/refactor-audits/post-lib-usage-audit.md 확인 완료
docs/refactor-audits/post-internal-boundary-audit.md 확인 완료
최신 코드 전체 기준으로 grep 재실행 완료
기존 audit 문서의 stale 항목과 최신 결과 차이 확인 완료

Step 2: post old import 재검색

@/modules/post/server 직접 import 재검색 완료
@/modules/post/lib 직접 import 재검색 완료
@/modules/post/repositories 직접 import 재검색 완료
external absolute import 기준 app/api/cross-domain 위반 0개 확인 완료
src/modules/search/ui/SearchExploreCommentsDrawer.tsx가 post/public/comment-item 사용 중임 확인 완료

Step 3: relative post old import 재검색

post 내부 relative old import 확인 완료
src/modules/post/ui/CreatePostComposer.tsx → ../server/create-post-action 확인 완료
src/modules/post/ui/EditPostComposer.tsx → ../server/update-post-action 확인 완료
server compatibility layer의 repository relative import는 old + new 공존 허용 항목으로 분류 완료

Step 4: post direct DB access 재검색

src/modules/post 전체에서 supabaseAdmin / createSupabase* / createClient / .from / .rpc / storage 접근 재검색 완료
repository DB 접근 항목 분리 완료
server/update-post-status.ts direct DB access 확인 완료
server/delete-post.ts direct DB access 확인 완료
server/list-liked-posts.ts direct DB access 확인 완료
post services/mappers/policies direct DB access 없음 재확인 완료

Step 5: app/api direct DB access 재검색

src/app/api/post/** direct .from(...) 0개 확인 완료
src/app/api/comment/** direct .from(...) 0개 확인 완료
src/app/api/payment/ppv-post/route.ts direct .from(...) 0개 확인 완료
auth/session Supabase client 생성은 보류 항목으로 분류 완료

Step 6: public boundary 위반 재검색

app/api/cross-domain → post/server 직접 import 0개 확인 완료
app/api/cross-domain → post/lib 직접 import 0개 확인 완료
app/api/cross-domain → post/repositories 직접 import 0개 확인 완료
external caller는 post/public, post/ui, post/types 사용으로 분류 완료
public wrapper가 server/lib compatibility entry를 감싸는 항목은 old + new 공존 항목으로 분류 완료

Step 7: workflow direct DB access 확인

src/workflows/create-post-with-media-workflow.ts의 supabaseAdmin import 확인 완료
creators 조회 direct DB access 확인 완료
cross-domain workflow boundary debt로 분류 완료
post table write는 아니지만 repository rule follow-up 후보로 기록 완료

Step 8: usage 0 삭제 후보 확인

src/modules/post/lib/is-post-hidden.ts usage 0 확인 완료
get-post-public-state / is-post-public-base-visible / is-post-published-visible / is-post-upcoming-visible는 active usage 존재 확인 완료
server/update-post-status.ts는 public wrapper 및 update-post use-case usage 존재 확인 완료
server/delete-post.ts는 public wrapper usage 존재 확인 완료
server/list-liked-posts.ts는 latest targeted grep 기준 direct usage 없음 확인 완료
list-liked-posts.ts는 active direct DB code가 있으므로 dedicated usage/removal wave 전 삭제 금지로 분류 완료

Step 9: old removal 가능 여부 판단

old removal not ready로 판단 완료
남은 server direct DB access blocker 기록 완료
public wrapper compatibility blocker 기록 완료
post/ui server action import blocker 기록 완료
use-cases/update-post.ts server internal dependency blocker 기록 완료
usage 0 삭제 후보는 dedicated removal wave 필요로 기록 완료

Step 10: audit 문서 생성

docs/refactor-audits/post-remaining-grep-audit.md 생성 완료
old import 결과 기록 완료
direct DB access 결과 기록 완료
repository 허용 항목 분리 완료
public boundary 위반 / 보류 / follow-up 후보 분류 완료
usage 0 삭제 후보 확정 완료
old removal 가능 여부 명시 완료

Verification

old import 결과 기록 완료
direct DB access 결과 기록 완료
repository 허용 항목 분리 완료
usage 0 삭제 후보 확정
old removal 가능 여부 명시 완료
external absolute post server/lib/repository import 0개 확인
src/app/api/post direct .from(...) 0개 확인
src/app/api/comment direct .from(...) 0개 확인
src/app/api/payment/ppv-post/route.ts direct .from(...) 0개 확인
server/update-post-status.ts direct DB access remaining 확인
server/delete-post.ts direct DB access remaining 확인
server/list-liked-posts.ts direct DB access remaining 확인
workflow direct DB access remaining 확인
코드 변경 없음
runtime behavior 변경 없음
refactor-progress 문서 변경 없음

Issues

server/update-post-status.ts에 server layer direct DB access 남아 있음
server/delete-post.ts에 server layer direct DB access 남아 있음
server/list-liked-posts.ts에 server layer direct DB access 남아 있음
src/modules/post/ui/CreatePostComposer.tsx가 ../server/create-post-action을 import함
src/modules/post/ui/EditPostComposer.tsx가 ../server/update-post-action을 import함
use-cases/update-post.ts가 post/media/moderation server internals를 import함
src/workflows/create-post-with-media-workflow.ts에 direct creator DB access 남아 있음
src/modules/post/lib/is-post-hidden.ts는 usage 0 삭제 후보지만 dedicated removal wave 전 삭제 금지
old removal은 아직 ready 아님

Result

Success


wave-041

Domain

post

Title

updatePostStatus repository split

Status

Completed

Goal

server/update-post-status.ts 내부의 posts status lookup/update DB 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/update-post-status.ts
src/modules/post/repositories/post-repository.ts

New:

None

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
반환 shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

update-post-status.ts
↓
post-repository.ts
↓
Supabase posts

Execution

post-repository.ts에 findCurrentPostStatusById 함수 추가 완료
post-repository.ts에 updatePostStatusById 함수 추가 완료

update-post-status.ts 리팩토링 완료
supabaseAdmin 직접 import 제거 완료
posts status 조회 → repository 호출로 변경 완료
posts update → repository 호출로 변경 완료

approved + archived skip 로직 유지 완료
buildPostStatusUpdatePayload 호출 유지 완료
update payload shape 유지 완료
error throw behavior 유지 완료
return shape 유지 완료

Verification

create status 정상
edit status 정상
moderation outcome 정상
approved + archived skip 유지
status/visibility/moderation 상태 값 동일
return shape 동일
typecheck 통과
build 통과
runtime error 없음

Result

Success

wave-042

Domain

post

Title

deletePost repository split

Status

Completed

Goal

server/delete-post.ts 내부의 posts soft delete DB 접근을 repository로 이동한다.

Target Files

Existing:

src/modules/post/server/delete-post.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/public/delete-post.ts

New:

None

Required Source Files Before Implementation

src/modules/post/server/delete-post.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/public/delete-post.ts
src/modules/post/server/delete-post-action.ts

Allowed Changes

repository 함수 추가
기존 server 함수 내부 DB 접근을 repository 호출로 변경
기존 함수명/export 유지
return shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

delete-post.ts
↓
post-repository.ts
↓
Supabase posts

Execution

post-repository.ts에 softDeletePostByCreator 함수 추가 완료

delete-post.ts 리팩토링 완료
createSupabaseServerClient 직접 import 제거 완료
posts soft delete DB 접근 → repository 호출로 변경 완료

deleted_at / updated_at payload 유지 완료
creator ownership 조건 유지 완료
allowed status 조건 유지 완료
deleted_at null 조건 유지 완료
error throw behavior 유지 완료
return shape 유지 완료

Verification

API delete 정상
post detail delete 정상
creator studio delete 정상
soft delete 조건 동일
creator ownership 조건 동일
allowed status 조건 동일
redirect/revalidate 동일
typecheck 통과
build 통과
runtime error 없음

Result

Success

wave-043

Domain

post

Title

listLikedPosts usage decision

Status

Completed

Goal

server/list-liked-posts.ts의 실제 사용 여부를 재확인하고, usage 0일 경우 repository split 없이 삭제 후보로 확정한다.

Target Files

Existing:

src/modules/post/server/list-liked-posts.ts
src/modules/post/repositories/post-like-repository.ts
src/modules/post/repositories/post-repository.ts
src/modules/post/index.ts

New:

None

Allowed Changes

usage 확인
grep 기반 caller 탐색
삭제 후보 판단
문서화

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
repository 수정
public wrapper 추가
파일 삭제
UI 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

No architecture change.
Audit/decision only.

Execution

grep 기반 usage 확인 완료
runtime caller 없음 확인 완료
app/api/domain/workflow 사용처 없음 확인 완료
docs 및 audit 기록 외 참조 없음 확인 완료
public export 없음 확인 완료
repository split 불필요 판단 완료
removal candidate로 분류 완료

Verification

runtime usage 0 확인
self-reference 및 docs reference만 존재 확인
public boundary 미노출 확인
repository split 생략 확인
코드 변경 없음 확인

Result

Success

wave-044

Domain

post

Title

post UI action public boundary cleanup

Status

Completed

Goal

post/ui 컴포넌트의 server action 직접 import를 public/action boundary로 전환한다.

Target Files

Existing:

src/modules/post/ui/CreatePostComposer.tsx
src/modules/post/ui/EditPostComposer.tsx
src/modules/post/server/create-post-action.ts
src/modules/post/server/update-post-action.ts
src/modules/post/public/create-feed-post-action.ts
src/modules/post/public/delete-post-action.ts

New:

src/modules/post/public/create-post-action.ts
src/modules/post/public/update-post-action.ts

Allowed Changes

public wrapper 파일 추가
UI import 경로만 public으로 변경
기존 action 호출 방식 유지
form action binding 유지
기존 함수명/export 유지
return shape 유지

Forbidden Changes

server action 내부 로직 변경 금지
DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
payment/media/subscription/auth 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

post/ui
↓
post/public/-action
↓
post/server/-action
↓
workflows / use-cases / repositories
↓
Supabase

Execution

Step 1: UI import audit

CreatePostComposer.tsx에서 createPostAction server 직접 import 확인 완료
EditPostComposer.tsx에서 updatePostAction server 직접 import 확인 완료

Step 2: public action wrapper 추가

create-post-action.ts public wrapper 생성 완료
update-post-action.ts public wrapper 생성 완료
server action re-export 구조로 구현 완료

Step 3: UI import 전환

CreatePostComposer.tsx import를 public boundary로 전환 완료
EditPostComposer.tsx import를 public boundary로 전환 완료

Step 4: behavior preservation 확인

startTransition 구조 유지 완료
form submit 흐름 유지 완료
error handling 유지 완료
redirect/revalidate behavior 유지 완료
action 호출 방식 변경 없음 확인

Verification

CreatePostComposer import boundary 정상
EditPostComposer import boundary 정상
create post 정상
edit post 정상
form action behavior 동일
UI 변화 없음
typecheck 통과
build 통과
runtime error 없음

Result

Success


wave-045

Domain

post

Title

updatePost use-case internal dependency cleanup

Status

Completed

Goal

use-cases/update-post.ts가 post/media/moderation server internals를 직접 import하는 의존을 public/use-case/service boundary로 정리한다.

Target Files

Existing:

src/modules/post/use-cases/update-post.ts
src/modules/post/server/update-post.ts
src/modules/post/server/update-post-status.ts
src/modules/post/server/resolve-post-mutation-moderation-outcome.ts
src/modules/post/public/update-post-status.ts
src/modules/post/services/post-edit-service.ts

New:

src/modules/post/public/update-post-row.ts
src/modules/post/services/post-mutation-moderation-service.ts

Allowed Changes

public wrapper 파일 추가
service 파일 추가
use-case 내부 post/server import를 public/service로 전환
기존 함수명/export 유지
return shape 유지

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
media/moderation internals 변경
UI 변경
app route 변경
workflow 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup

Expected Architecture After Wave

use-cases/update-post.ts
↓
post/public/update-post-row.ts
post/public/update-post-status.ts
post/services/post-mutation-moderation-service.ts
↓
post/server/*
↓
repositories
↓
Supabase

Execution

Step 1: updatePost public wrapper 생성

src/modules/post/public/update-post-row.ts 생성 완료
server/update-post.ts를 그대로 감싸는 wrapper 구현 완료

Step 2: moderation outcome service 분리

src/modules/post/services/post-mutation-moderation-service.ts 생성 완료
resolveModerationOutcomeFromStatuses 호출 로직 이동 완료

Step 3: server resolver compatibility 유지

resolve-post-mutation-moderation-outcome.ts를 service 호출 wrapper로 변경 완료
기존 export 및 signature 유지 완료

Step 4: use-case import 전환

update-post.ts 내부 import 전환 완료
post/server/update-post → post/public/update-post-row
post/server/update-post-status → post/public/update-post-status
post/server/resolve-post-mutation-moderation-outcome → post/services/post-mutation-moderation-service

Step 5: behavior preservation 확인

mutation 순서 유지 완료
post update → media delete → upload/create → moderation → blocks 유지
media/moderation server import 유지 완료
return shape 유지 완료
error throw 유지 완료

Verification

edit post 정상
media delete 정상
new media upload 정상
post_blocks update 정상
moderation re-entry 정상
remove-only edit 정상
use-case에서 post/server direct import 제거 확인
typecheck 통과
build 통과
runtime error 없음

Result

Success

wave-046

Domain

post

Title

listLikedPosts safe removal

Status

Completed

Goal

usage 0으로 확정된 server/list-liked-posts.ts를 안전하게 제거하고 dangling import 및 public/export 영향이 없는지 검증한다.

Target Files

Existing:

src/modules/post/server/list-liked-posts.ts
src/modules/post/index.ts
src/modules/post/public/**
src/modules/post/repositories/post-like-repository.ts

New:

None

Allowed Changes

usage 0 파일 삭제
dangling import 제거
index/public export 영향 검증
기존 함수명/export 유지 (사용 중인 영역)
runtime 영향 없는 범위 내 cleanup

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
UI 변경
app route 변경
post create/update flow 변경
repository 로직 변경
mapper/policy/use-case 동시 분리
unrelated cleanup

Expected Architecture After Wave

list-liked-posts.ts 제거
↓
post/public boundary 유지
↓
repositories / services / policies / mappers 유지

Execution

grep 기반 최종 usage 재확인 완료
runtime caller 없음 재확인 완료
app/api/domain/workflow import 없음 재확인 완료

src/modules/post/server/list-liked-posts.ts 삭제 완료

dangling import 탐색 완료
index.ts export 영향 없음 확인 완료
public wrapper 영향 없음 확인 완료

repository(post-like-repository.ts) 영향 없음 확인 완료

Verification

typecheck 통과
build 통과
runtime error 없음
post feed 정상
like/unlike 정상
post detail 정상
creator feed 정상
unused code 제거 확인

Result

Success


wave-048

Domain

post

Title

post final smoke and contract audit

Status

Completed

Goal

post domain 완료 조건을 기준으로 최종 contract audit과 production flow smoke verification을 수행한다.

Target Files

Existing:

src/modules/post/**
src/app/**
src/modules/**
src/workflows/**
docs/refactor-audits/**

New:

docs/refactor-audits/post-domain-final-contract-audit.md

Allowed Changes

audit 문서 생성
최신 grep 결과 기록
contract 상태 기록
production flow smoke checklist 기록
post domain 완료 가능 여부 기록
코드 변경 금지

Forbidden Changes

코드 변경
DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
auth/payment/subscription flow 변경
UI layout/copy 변경
behavior 변경
refactor-progress 문서 변경

Execution

Step 1: required source 확인

docs/refactor-audits/post-remaining-grep-audit.md 확인 완료
docs/refactor-audits/post-final-contract-audit.md 확인 완료
docs/refactor-audits/post-old-final-removal-audit.md 확인 완료
src/modules/post/index.ts 확인 완료
src/modules/post/public/** 확인 완료
src/modules/post/repositories/** 확인 완료

Step 2: app/ui/api public boundary audit

src/app/** → @/modules/post/server 직접 import 0개 확인 완료
src/app/** → @/modules/post/lib 직접 import 0개 확인 완료
src/app/** → @/modules/post/repositories 직접 import 0개 확인 완료
src/app/api/** → @/modules/post/server 직접 import 0개 확인 완료
src/app/api/** → @/modules/post/lib 직접 import 0개 확인 완료
src/app/api/** → @/modules/post/repositories 직접 import 0개 확인 완료
src/modules/post/ui/PostCard.tsx의 post/lib/comment-item 직접 import 확인 완료
post UI internal boundary debt로 기록 완료

Step 3: cross-domain post internal import audit

cross-domain → @/modules/post/server 직접 import 0개 확인 완료
cross-domain → @/modules/post/lib 직접 import 0개 확인 완료
cross-domain → @/modules/post/repositories 직접 import 0개 확인 완료
external app/API/cross-domain caller는 post/public, post/ui, post/types 사용으로 분류 완료

Step 4: DB access boundary audit

post repository DB access 목록 확인 완료
post Supabase 접근은 실제 DB/client call 기준 repositories에 집중됨 확인 완료
use-cases direct DB access 0개 확인 완료
services direct DB access 0개 확인 완료
mappers direct DB access 0개 확인 완료
policies direct DB access 0개 확인 완료
broad grep의 storagePath / storage_path 오탐 분리 완료

Step 5: old server/lib usage audit

src/modules/post/lib/is-post-hidden.ts 제거 상태 확인 완료
src/modules/post/server/list-liked-posts.ts 제거 상태 확인 완료
isPostHidden / is-post-hidden runtime usage 0 확인 완료
listLikedPosts / list-liked-posts runtime usage 0 확인 완료
남은 old server/lib 파일은 active public wrapper / compatibility / orchestration / internal usage 보류 사유 기록 완료

Step 6: production flow smoke checklist 작성

post create contract-smoke 기록 완료
post edit contract-smoke 기록 완료
post delete contract-smoke 기록 완료
post detail contract-smoke 기록 완료
creator feed contract-smoke 기록 완료
main feed contract-smoke 기록 완료
likes/comments contract-smoke 기록 완료
media signed URL contract-smoke 기록 완료
locked preview contract-smoke 기록 완료
commerce CTA contract-smoke 기록 완료
live runtime smoke 미실행 기록 완료

Step 7: verification 실행

npm run typecheck 실행 완료
기존 CommentRow export blocker로 실패 확인 완료
npm run build 실행 완료
기존 CommentRow export blocker로 실패 확인 완료

Step 8: audit 문서 작성

docs/refactor-audits/post-domain-final-contract-audit.md 생성 완료
strategy execution 기록 완료
contract summary 기록 완료
known blockers 기록 완료
remaining architecture debt 기록 완료
completion readiness 기록 완료
verification result 기록 완료

Verification

app/API post public only 확인 완료
cross-domain post server/lib/repository direct import 0개 확인 완료
Supabase 접근 post/repositories only 확인 완료
use-case/service/mapper/policy DB 직접 접근 없음 확인 완료
old server/lib usage 0 또는 보류 사유 확정 완료
post create contract-smoke only
post edit contract-smoke only
post delete contract-smoke only
post detail contract-smoke only
creator feed contract-smoke only
main feed contract-smoke only
likes/comments contract-smoke only
media signed URL contract-smoke only
locked preview contract-smoke only
commerce CTA contract-smoke only
typecheck 실패
build 실패
runtime error live 미확인

Issues

src/modules/post/ui/PostCard.tsx가 @/modules/post/lib/comment-item 직접 import 중
CommentRow가 @/modules/post/types에서 export되지 않아 typecheck/build 실패
live browser smoke는 별도 수동 확인 필요

Result

Success with documented blockers

wave-049

Domain

post

Title

post final blockers cleanup

Status

Completed

Goal

post domain 종료를 막고 있는 final blocker를 정리한다.

Target Files

Existing:

src/modules/post/types.ts
src/modules/post/lib/comment-item.ts
src/modules/post/public/comment-item.ts
src/modules/post/repositories/comment-repository.ts
src/modules/post/ui/PostCard.tsx
docs/refactor-audits/post-domain-final-contract-audit.md

New:

None

Allowed Changes

CommentRow type export contract 정리
기존 CommentRow shape 유지
PostCard import 경로만 public boundary로 전환
final audit 문서의 verification 상태 갱신
typecheck/build 결과 기록

Forbidden Changes

DB schema 변경
RLS 변경
SQL 실행
storage bucket/policy 변경
UI layout/copy 변경
comment item shape 변경
comments API response shape 변경
likes/comments behavior 변경
permission behavior 변경
error behavior 변경
unrelated cleanup
old server/lib 추가 삭제
refactor-progress 문서 변경

Execution

Step 1: required source 확인

docs/refactor-audits/post-domain-final-contract-audit.md 확인 완료
src/modules/post/types.ts 확인 완료
src/modules/post/lib/comment-item.ts 확인 완료
src/modules/post/public/comment-item.ts 확인 완료
src/modules/post/repositories/comment-repository.ts 확인 완료
src/modules/post/ui/PostCard.tsx 확인 완료
src/modules/post/index.ts 확인 완료

Step 2: CommentRow type contract 확인

CommentRow 사용처 확인 완료
src/modules/post/lib/comment-item.ts에서 CommentRow import 필요 확인 완료
src/modules/post/public/comment-item.ts에서 CommentRow re-export 필요 확인 완료
src/modules/post/repositories/comment-repository.ts에서 CommentRow type 필요 확인 완료
src/app/api/post/[postId]/comment/route.ts에서 public CommentRow type 사용 확인 완료
src/app/api/post/[postId]/comments/route.ts에서 public CommentRow type 사용 확인 완료
기존 CommentRow shape 확인 완료

Step 3: CommentRow contract 정리

src/modules/post/types.ts에 CommentRow type 추가 완료
기존 CommentRow shape 유지 완료
id / post_id / user_id / content / created_at 필드 유지 완료
src/modules/post/lib/comment-item.ts에서 CommentRow를 types에서 import하도록 변경 완료
src/modules/post/lib/comment-item.ts에서 CommentRow type re-export 추가 완료
src/modules/post/public/comment-item.ts 기존 re-export 구조 유지 완료
src/modules/post/repositories/comment-repository.ts import 유지 및 type error 해결 완료

Step 4: PostCard public import 전환

src/modules/post/ui/PostCard.tsx의 comment-item import를 public boundary로 전환 완료
@/modules/post/lib/comment-item → @/modules/post/public/comment-item 변경 완료
isCommentItem 호출 유지 완료
CommentItem type 사용 유지 완료
PostCard render behavior 변경 없음 확인 완료

Step 5: boundary grep 재확인

PostCard → post/lib/comment-item 직접 import 0개 확인 완료
src/app/** → @/modules/post/server/lib/repositories 직접 import 0개 확인 완료
src/app/api/** → @/modules/post/server/lib/repositories 직접 import 0개 확인 완료
cross-domain → @/modules/post/server/lib/repositories 직접 import 0개 확인 완료
use-cases/services/mappers/policies direct DB access 0개 확인 완료

Step 6: typecheck/build 실행

npm run typecheck 실행 완료
typecheck 통과 완료

npm run build 실행 완료
build 통과 완료
Turbopack build 성공 완료
TypeScript 단계 통과 완료
static page generation 완료

Step 7: final audit 갱신

docs/refactor-audits/post-domain-final-contract-audit.md 갱신 완료
CommentRow blocker resolved로 변경 완료
PostCard direct lib import blocker resolved로 변경 완료
production flow smoke checklist를 build/typecheck verified로 갱신 완료
Completion Readiness를 Ready with documented non-blocking debt로 변경 완료
Verification Result 갱신 완료

Verification

CommentRow type error 해결 완료
PostCard post/lib 직접 import 제거 완료
app/API post public only 유지 확인 완료
cross-domain post server/lib/repository direct import 0개 유지 확인 완료
use-case/service/mapper/policy direct DB access 0개 유지 확인 완료
comments route response shape 동일
comment item shape 동일
PostCard rendering 동일
likes/comments build/typecheck verified
post detail build/typecheck verified
creator feed build/typecheck verified
main feed build/typecheck verified
locked preview build/typecheck verified
commerce CTA build/typecheck verified
typecheck 통과
build 통과
runtime error 없음

Issues

live browser/manual smoke는 별도 수동 확인 필요
public wrappers 일부가 old server/lib compatibility를 감싸는 구조는 documented non-blocking debt로 유지
post services 일부 compatibility helper 의존은 documented non-blocking debt로 유지
workflow creator lookup direct DB access는 다음 domain/wave 후보로 유지
src/modules/post/lib/.DS_Store 존재는 cleanup 후보로 유지

Result

Success


## Current Architecture State

app / api / payment / media / creator / feed / search / moderation / profile / workflows
↓
post/public/get-post
post/public/get-creator-feed
post/public/get-post-access
post/public/enforce-post-visibility
post/public/get-post-commerce-cta-decision
post/public/delete-post
post/public/get-creator-studio-post
post/public/list-creator-studio-posts
post/public/get-my-posts
post/public/get-post-locked-preview-presentation
post/public/delete-post-action
post/public/ppv-price
post/public/comment-data
post/public/comment-item
post/public/comment-like
post/public/comment-permissions
post/public/post-like
post/public/create-post
post/public/update-post-status
post/public/create-post-blocks
post/public/create-post-draft-policy
post/public/create-feed-post-action
post/public/public-discovery-inclusion
post/public/post-render-input
post/public/post-render-read-model
post/public/can-view-post
post/public/create-post-action
post/public/update-post-action
post/public/update-post-row
↓
post/index.ts public export
↓
post/server/get-post-by-id
post/server/get-creator-feed
post/server/list-feed-posts
post/server/get-post-access
post/server/enforce-post-visibility
post/server/delete-post
post/server/delete-post-action
post/server/create-post
post/server/update-post-status
post/server/update-post-action
post/server/update-post
post/server/list-bookmarked-posts
post/server/list-creator-studio-posts
post/server/get-my-posts
post/server/list-creator-posts
post/server/get-post-media
post/server/get-creator-studio-post
post/server/create-post-blocks
post/server/create-feed-post-action
post/server/create-post-draft-policy
post/server/can-view-post
post/server/post-render-read-model
post/server/resolve-post-mutation-moderation-outcome
↓
post/use-cases/update-post
post/use-cases/comment-data
post/use-cases/comment-like
post/use-cases/post-like
↓
post/services/post-edit-service
post-feed-render-service
post-mutation-moderation-service
post-access-policy / post-visibility-policy / post-commerce-policy
post-status-service
↓
post-feed-mapper / post-render-mapper / post-media-mapper / post-mapper
↓
post-repository / post-media-repository / post-block-repository / post-like-repository / comment-repository / comment-like-repository / post-feed-repository / post-bookmark-repository
↓
Supabase

## Progress Summary

wave-041
→ updatePostStatus repository split 완료

wave-042
→ deletePost repository split 완료

wave-043
→ listLikedPosts usage 0 확정 및 removal candidate 분류 완료

wave-044
→ post UI action public boundary cleanup 완료

wave-045
→ updatePost use-case internal dependency cleanup 완료
→ use-cases/update-post.ts에서 post/server direct import 제거 완료
→ updatePost public wrapper 추가 완료
→ moderation outcome service 분리 완료
→ use-case → public/service 경로로 boundary 정리 완료

wave-046
→ listLikedPosts safe removal 완료
→ list-liked-posts.ts 삭제 완료
→ dangling import 없음 확인 완료
→ public/index export 영향 없음 확인 완료
→ unused server layer code 제거 완료

wave-047
→ post old server/lib final usage audit and removal 완료
→ list-liked-posts.ts runtime usage 0 재확인 완료
→ is-post-hidden.ts 제거 상태 및 usage 0 확인 완료
→ post-old-final-removal-audit.md 작성 완료
→ old server/lib usage 0 파일만 제거 원칙 확인 완료

wave-048
→ post final smoke and contract audit 완료
→ app/API/cross-domain post internal direct import 0개 확인 완료
→ post Supabase 접근 repository boundary 확인 완료
→ use-case/service/mapper/policy direct DB access 0개 확인 완료
→ old server/lib usage 0 또는 보류 사유 기록 완료
→ production flow smoke checklist 작성 완료
→ CommentRow / PostCard blocker 확인 완료
→ post-domain-final-contract-audit.md 생성 완료

wave-049
→ post final blockers cleanup 완료
→ CommentRow type contract 정리 완료
→ src/modules/post/types.ts에 CommentRow export 추가 완료
→ comment-item public re-export 정상화 완료
→ PostCard의 post/lib/comment-item 직접 import 제거 완료
→ PostCard import를 post/public/comment-item으로 전환 완료
→ typecheck 통과 완료
→ build 통과 완료
→ final contract audit을 Ready with documented non-blocking debt로 갱신 완료

## 현재 위치

👉 post/use-case layer에서 server direct import 제거 완료  
👉 use-case → public/service 경로 정리 완료  
👉 post domain 핵심 mutation flow boundary 정리 완료  
👉 dead code(list-liked-posts) 제거 완료  
👉 server compatibility 정리 단계 진입 완료  
👉 post final contract audit 완료  
👉 CommentRow type contract blocker 해결 완료  
👉 PostCard post/lib 직접 import 제거 완료  
👉 typecheck/build green 상태 확인 완료  
👉 post domain stabilization complete  
👉 post → Complete with documented non-blocking debt  

## Next Step Recommendation

wave-050:

media domain architecture migration 시작  
media public boundary / storage access audit  
createMediaSignedUrl boundary 안정화  
upload-media / secure media access 흐름 audit  
storage 접근 repository/service boundary 정리 후보 선정
