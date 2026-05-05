# Media Read Model Boundary Audit

## Purpose

feed / search / creator domain에서 media read model 직접 DB 접근을 감사하고,  
media read repository 및 public boundary로 안전하게 전환하기 위한 범위를 확정한다.

이 문서는 코드 변경 없이 read-only audit 결과를 기록하는 문서다.

---

## Scope

Read only:

- src/modules/feed/server/get-home-feed.ts
- src/modules/search/server/get-explore-posts.ts
- src/modules/creator/server/get-creator-page.ts
- src/modules/media/public/create-media-signed-url.ts

---

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

---

## Feed Media Read Contract

### Table

- media

### Select Columns

- id
- post_id
- storage_path
- type
- mime_type
- status
- sort_order

### Input

- publishedPostIds

### Filters

- post_id in publishedPostIds
- status = "ready"

### Fallback

- postIds empty → dummy UUID

### Ordering

- sort_order asc

### Mapping

- mediaMap: Map<post_id, MediaRow[]>
- selectedMediaRows = slice(0, 3)

### Signed URL Input

- storagePath
- viewerUserId
- creatorUserId
- visibility
- canView
- isSubscribed = false
- hasPurchased = false

### Risk

- High

### Notes

- feed preview media 개수 제한 (slice 3)
- access / renderInput / like/comment flow와 강하게 연결됨

---

## Search / Explore Media Read Contract

### Table

- media

### Select Columns

- id
- post_id
- storage_path
- mime_type
- sort_order
- type

### Input

- visiblePostIds

### Filters

- post_id in visiblePostIds
- type in ["image", "video"]
- status = "ready"

### Ordering

- sort_order asc

### Mapping

- mediaMap
- firstMediaMap
- postsWithMedia filtering

### Signed URL Input

- storagePath
- viewerUserId = creator.user_id
- creatorUserId = creator.user_id
- visibility = "public"
- canView = true
- hasPurchased = true

### Risk

- High

### Notes

- image/video filter가 discovery eligibility에 영향
- firstMediaMap 존재 여부가 post 포함 조건
- mediaCount / 대표 imageUrl 결정

---

## Creator Page Media Read Contract

### Table

- media

### Select Columns

- id
- post_id
- storage_path
- type
- mime_type
- status
- sort_order

### Input

- publishedPostIds

### Filters

- post_id in publishedPostIds
- status = "ready"

### Fallback

- postIds empty → dummy UUID

### Ordering

- sort_order asc

### Mapping

- mediaMap
- allMediaRows
- previewMediaRows:
  - locked → slice(0, 1)
  - unlocked → all

### Signed URL Input

- storagePath
- viewerUserId
- creatorUserId
- visibility
- canView
- hasPurchased
- allowPreview

### Risk

- High

### Notes

- locked preview / paid teaser와 강하게 연결됨
- allowPreview가 access policy에 직접 영향

---

## Signed URL Input Contract

### Function

- createMediaSignedUrl

### Input

- storagePath
- viewerUserId
- creatorUserId
- visibility
- canView
- isSubscribed
- hasPurchased
- expiresIn
- allowPreview

### Behavior

- empty storagePath → ""
- denied access → ""
- default expiresIn = 3600

### Risk

- Critical

### Notes

- 이미 public boundary + policy + repository 분리 완료
- 이번 wave에서 변경 대상 아님

---

## Common Repository Candidate

### Function

- findReadyPostMediaRowsByPostIds(postIds)

### Shared Logic

- post_id in postIds
- status = "ready"
- sort_order asc
- dummy UUID fallback

### Applicable Domains

- feed
- creator page

### Repository Scope

포함:

- DB select
- filter
- ordering
- error throw

제외:

- slice logic
- signed URL mapping
- access 판단
- renderInput 구성

---

## Domain-specific Repository Candidate

### Function

- findReadyExploreMediaRowsByPostIds(postIds)

### Domain

- search / explore

### 이유

- type filter 필요 (image/video)
- firstMediaMap 의존
- discovery eligibility에 영향

---

## Recommended Wave-022 Scope

### Goal

- feed + creator media read query를 repository로 이동

### Target Files

- src/modules/media/repositories/media-read-repository.ts
- src/modules/feed/server/get-home-feed.ts
- src/modules/creator/server/get-creator-page.ts

### 제외

- search/explore
- signed URL
- storage repository

---

## Recommended Wave-023 Scope

### Goal

- search/explore media read repository 분리

### Target

- src/modules/search/server/get-explore-posts.ts

---

## Do Not Change

- media select columns
- ready status filter
- image/video filter (search)
- sort_order ordering
- fallback UUID
- feed slice(0, 3)
- creator slice(0, 1)
- signed URL input
- renderInput behavior
- response shape
- DB schema / RLS / SQL / storage policy

---

## Wave-021 Result

Status:

Completed

Behavior Changed:

None

Files Changed:

- None (chat output only)

Verification:

- feed media query contract 기록 완료
- search media query contract 기록 완료
- creator media query contract 기록 완료
- signed URL input contract 기록 완료
- 공통 repository 후보 분류 완료
- domain-specific 후보 분류 완료
- wave-022 범위 확정 완료
- 코드 변경 없음

Issues:

- media read query가 domain마다 다르게 확장되어 있음
- search/explore는 discovery logic과 결합되어 있어 분리 난이도 높음

Progress Update Needed:

- Yes