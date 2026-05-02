# Refactor Progress

## Purpose

이 문서는 전체 코드 아키텍처 개편의 현재 진행 상태를 기록한다.

`project-baseline.md`와 `db-architecture-audit.md`는 기준 문서이고,  
이 문서는 매 wave 완료 후 계속 업데이트하는 작업 일지다.

---

# Global Status

## Current Phase

Phase 2 - Code Architecture Migration

## DB Migration Phase

Not Started

## Current Domain

post

## Current Wave

wave-001 (In Progress)

## Last Updated

2026-05-01

---

# Global Rules Reminder

- DB schema 변경 금지
- RLS policy 변경 금지
- SQL migration 실행 금지
- table/column rename 금지
- function/trigger 변경 금지
- storage bucket/policy 변경 금지
- payment/auth flow 변경 금지
- old + new 공존 허용
- old 사용처 0개 확인 전 삭제 금지
- 한 번에 한 도메인
- 한 번에 한 wave
- 한 번에 하나의 목적만 수행

---

# Completed Setup

## Documents

- [x] `docs/db-architecture-audit.md` 작성
- [x] `docs/project-baseline.md` 작성
- [x] `docs/refactor-brief-template.md` 작성
- [x] `docs/refactor-progress.md` 작성 및 초기화

## Flow Audit

- [x] 전체 production flow raw audit 수행
- [x] post domain flow audit 수행
- [x] media/payment deep audit 수행
- [x] db architecture audit에 위험도 반영

---

# Domain Status

## 1. post

### Status

In Progress - wave-001 실행 중

### Completed

- post domain current file structure 확인
- post DB direct access 확인
- post import usage 확인
- post production flow audit 수행
- post mutation flow audit 수행
- post access/visibility flow audit 수행
- post purchase/commerce CTA flow audit 수행
- post media/signed URL dependency 확인
- post interactions flow audit 수행

### Key Findings

- `modules/post/server/*`가 DB access, use-case, mapper, policy 역할을 동시에 가짐
- app/api/ui가 post server 내부 구현을 직접 import함
- `getPostById`, `getCreatorFeed`, `getPostAccess`는 cross-domain shared read/access contract임
- `updatePostStatus`는 create/update/moderation에서 공유되는 critical function임
- `post_blocks`, `post_likes`, `comments`, `comment_likes`는 첫 wave 대상으로 적합함
- `CreatePostComposer.tsx`에서 Supabase storage 직접 접근이 있음
- media signed URL은 media domain public boundary 필요

### Current Recommended Next Waves

- wave-002: `post_likes` repository 분리
- wave-003: `comments` repository 분리
- wave-004: `comment_likes` repository 분리
- wave-005: `getPostById` public wrapper 추가

### Files Identified for Wave 001

- `src/modules/post/server/get-post-blocks.ts`
- `src/modules/post/server/create-post-blocks.ts`
- `src/modules/post/repositories/post-block-repository.ts`

### Do Not Touch Yet

- `src/modules/post/server/get-post-by-id.ts` internals
- `src/modules/post/server/get-creator-feed.ts` internals
- `src/modules/post/server/update-post-action.ts`
- `src/modules/post/server/update-post-status.ts`
- `src/workflows/create-post-with-media-workflow.ts`
- payment / media / subscription behavior
- DB schema / RLS / SQL

### Verification Pending (wave-001 기준)

- post create
- post detail
- feed page

---

## 2. media

### Status

Audited - not started

### Key Notes

- infra domain
- signed URL shared usage
- public boundary 필요

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

---

## 5. message

### Status

Not Started

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

post

### Title

Extract post_blocks DB access into repository

### Status

In Progress

### Goal

`post_blocks` 관련 DB 직접 접근을 `post-block-repository`로 이동한다.

### Target Files

Existing:

- `src/modules/post/server/get-post-blocks.ts`
- `src/modules/post/server/create-post-blocks.ts`

New:

- `src/modules/post/repositories/post-block-repository.ts`

### Allowed Changes

- repository 파일 추가
- 기존 server 함수 내부 DB 접근을 repository 호출로 변경
- 기존 함수명/export 유지
- 반환 shape 유지

### Forbidden Changes

- DB schema 변경
- RLS 변경
- SQL 실행
- UI 변경
- app route 변경
- post create/update flow 변경
- mapper/policy/use-case 동시 분리
- unrelated cleanup

### Expected Architecture After Wave

```txt
server/get-post-blocks.ts
server/create-post-blocks.ts
  ↓
repositories/post-block-repository.ts
  ↓
Supabase post_blocks

Execution Started
repository 파일 생성 시작
get-post-blocks.ts 리팩토링 진행 중
create-post-blocks.ts 리팩토링 진행 중
Verification

Pending

Result

Pending