# Refactor Brief Template
## 0. Execution Context (필수)

이 wave는 반드시 아래 컨텍스트와 함께 실행되어야 한다.

### Required Documents

- project-baseline.md
- db-architecture-audit.md
- refactor-progress.md
- 해당 wave brief

### Recommended Inputs

- Target Files의 원본 코드

예:

- src/modules/post/server/get-post-blocks.ts
- src/modules/post/server/create-post-blocks.ts

### Execution Instruction

아래 규칙을 반드시 지킨다:

- scope 밖 작업 금지
- DB schema 변경 금지
- RLS 변경 금지
- SQL 실행 금지
- UI 변경 금지
- app route 변경 금지
- payment/auth/subscription flow 변경 금지
- 기존 함수명/export 유지
- return shape 변경 금지

### One-Line Rule

```txt
"이 wave는 Target Files 안에서만 작업한다"
## 0. Metadata

### Brief ID
wave-000

### Domain
post / media / subscription / payment / message / notification / creator-profile / payout / admin

### Title
짧고 명확한 작업명

### Status
Planned / In Progress / Completed / Failed / Rolled Back

### Last Updated
YYYY-MM-DD

---

## 1. Goal

이번 wave의 목표는 단 하나다.

```txt
[한 문장으로 작성]

예:

post_blocks DB 직접 접근을 post-block-repository로 이동한다.
2. Background
Why this wave exists
이 작업이 필요한 이유
현재 구조의 문제
이전 audit에서 발견된 위험
Related Audit
관련 flow audit 이름
관련 DB audit 섹션

예:

Related Audit:
- Post - interactions (likes / comments / blocks)
- DB Architecture Audit > post
3. Scope
In Scope

이번 wave에서 건드려도 되는 것.

Out of Scope

이번 wave에서 절대 건드리면 안 되는 것.

4. Target Files
Existing Files

수정 가능한 기존 파일.

New Files

새로 만들 수 있는 파일.

Forbidden Files

이번 wave에서 열거나 수정하지 말아야 하는 파일.

5. Current Behavior Contract

이번 wave에서 반드시 유지해야 하는 기존 동작.

Input
기존 함수/API/action이 받는 입력
Output
기존 반환값 형태
기존 response shape
Error Behavior
기존 error throw 방식
기존 error response 방식
Permission Behavior
기존 권한 판단 유지
Side Effects
기존 DB write
기존 revalidate
기존 redirect
기존 notification/payment/media side effect
DB Tables
이번 wave가 건드리는 기존 DB table
Storage Buckets
해당 없으면 None
6. Current Problem

현재 코드의 문제를 짧게 정리한다.

예:

- server 함수가 Supabase에 직접 접근한다.
- DB 접근 책임이 repository로 분리되어 있지 않다.
- app/ui/public contract와 내부 구현이 분리되어 있지 않다.
7. Target Architecture

이번 wave 이후 기대 구조.

[before/after 구조 작성]

예:

Before:
server/get-post-blocks.ts
  ↓
Supabase post_blocks

After:
server/get-post-blocks.ts
  ↓
repositories/post-block-repository.ts
  ↓
Supabase post_blocks
8. Refactor Strategy

작업 순서.

예:

1. repository 파일을 추가한다.
2. 기존 Supabase query를 repository 함수로 이동한다.
3. 기존 server 함수는 repository를 호출하도록 변경한다.
4. 기존 함수명/export/return shape는 유지한다.
9. Allowed Changes

이번 wave에서 허용되는 변경.

repository 추가
public wrapper 추가
import 경로 변경
내부 DB 접근 이동
mapper 추가
기존 함수 내부 구현 교체
타입 import 정리
10. Forbidden Changes

이번 wave에서 금지되는 변경.

DB schema 변경
RLS policy 변경
SQL migration 실행
table/column rename
function/trigger 변경
storage bucket/policy 변경
payment/auth/subscription flow 변경
UI copy 변경
UI layout 변경
return shape 변경
permission behavior 변경
error behavior 변경
unrelated cleanup
대규모 파일 이동
다른 domain 동시 리팩토링
11. Implementation Rules
Minimal Change Rule
기존 파일 구조와 로직을 최대한 유지한다.
필요한 부분만 변경한다.
기존 export 이름은 유지한다.
Old + New Coexistence Rule
old 코드는 즉시 삭제하지 않는다.
new layer를 추가하고 old가 new를 호출하거나, new가 old를 감싸도록 한다.
old 사용처 0개 확인 전 삭제하지 않는다.
Import Boundary Rule
app/ui는 public만 사용해야 한다.
repository/use-case 내부 구현을 app/ui가 직접 import하지 않는다.
DB Access Rule
Supabase 접근은 repository에서만 한다.
이번 wave가 repository extraction이 아니라면 DB 접근 위치를 바꾸지 않는다.
12. Verification Checklist
Static Checks
 TypeScript 통과
 lint 통과
 import 에러 없음
 unused export/import 없음
Contract Checks
 기존 input 유지
 기존 output 유지
 기존 error behavior 유지
 기존 permission behavior 유지
 기존 side effect 유지
Flow Checks

이번 wave와 관련된 flow만 체크한다.

 관련 page/API/action 정상
 관련 UI 변화 없음
 관련 DB table 동일하게 사용
 관련 storage behavior 동일
Global Safety Checks
 DB schema 변경 없음
 RLS 변경 없음
 SQL 실행 없음
 payment/auth flow 변경 없음
13. Manual Test Plan

실제로 확인할 동작.

예:

1. 게시글 생성 시 post_blocks가 정상 저장되는지 확인
2. 게시글 상세에서 blocks가 기존과 동일하게 표시되는지 확인
3. feed/creator page에서 에러가 없는지 확인
14. Rollback Plan

문제 발생 시 되돌리는 방법.

Files to Revert
Rollback Steps

예:

1. 새 repository 파일 삭제
2. 기존 server 파일의 Supabase query 복구
3. 변경된 import 제거
15. Completion Criteria

이 wave가 완료됐다고 볼 기준.

 brief scope 안의 변경만 수행됨
 verification checklist 통과
 manual test 통과
 progress 문서 업데이트 완료
 다음 wave가 명확함
16. Progress Update

작업 완료 후 docs/refactor-progress.md에 기록할 내용.

## wave-000

### Status
Completed / Failed / Rolled Back

### Files Changed
- 

### Result
- 

### Verification
- 

### Notes
- 
17. Notes

추가 주의사항.


이 템플릿이면 다음부터는 각 wave마다 아래만 채우면 돼.

```txt
Goal
Scope
Target Files
Contract
Strategy
Verification
Rollback

