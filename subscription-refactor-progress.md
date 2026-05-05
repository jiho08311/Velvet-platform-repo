# Refactor Progress

## Purpose

이 문서는 subscription domain 코드 아키텍처 개편의 현재 진행 상태를 기록한다.

`project-baseline.md`와 `db-architecture-audit.md`는 기준 문서이고,  
이 문서는 subscription domain wave 진행 상태를 추적하는 작업 일지다.
Global Status

Current Phase

Phase 2 - Code Architecture Migration

DB Migration Phase

Not Started

Current Domain

subscription

Current Wave

wave-016

Next Wave

wave-017

Last Updated

2026-05-06

Domain Status

subscription

In Progress - wave-016 완료

### Completed

- post domain migration 완료
- media domain migration 완료
- subscription domain은 아직 코드 변경 전 상태
- payment / post access / creator 연결 위험 영역 확인됨

### Key Findings

- subscription은 post access / visibility와 강하게 연결됨
- subscription은 payment success flow와 연결됨
- subscription status 판단 변경 시 post unlock behavior가 깨질 수 있음
- subscription lifecycle 변경은 현재 phase에서 금지
- 초반 wave는 코드 변경보다 usage audit / DB access audit / public boundary baseline부터 시작해야 함

### Current Recommended Next Waves

- wave-001: subscription production flow and boundary audit
- wave-002: subscription DB access audit
- wave-003: subscription public boundary baseline
- wave-004: active subscription read repository split
- wave-005: subscription access policy boundary audit

### Files Identified for Wave 001

- `src/modules/subscription/**`
- `src/app/subscriptions/**`
- `src/app/api/subscriptions/**`
- `src/modules/post/**`
- `src/modules/payment/**`
- `src/modules/creator/**`
- `src/modules/profile/**`
- `src/workflows/**`
- `docs/refactor-audits/**`

### Do Not Touch Yet

- subscriptions table schema
- subscription status values
- payment 연결 방식
- subscription access behavior
- post access / visibility behavior
- auth/payment/subscription flow
- RLS policies
- DB schema / SQL / migration

### Verification Pending

- subscription production flow audit
- subscription DB direct access audit
- subscription import boundary audit
- active subscription check contract 확인
- creator subscriber list contract 확인
- user subscription list contract 확인
- payment success 연결점 확인
- post access unlock 연결점 확인

---

# Wave Log

## wave-001

### Domain

subscription

### Title

subscription production flow and boundary audit

### Status

Planned

### Goal

subscription domain의 production flow, DB 접근, post/payment/creator 연결점, public boundary 후보를 코드 변경 없이 감사한다.

### Target Files

Read only:

- `src/modules/subscription/**`
- `src/app/subscriptions/**`
- `src/app/api/subscriptions/**`
- `src/modules/post/**`
- `src/modules/payment/**`
- `src/modules/creator/**`
- `src/modules/profile/**`
- `src/workflows/**`

New:

- `docs/refactor-audits/subscription-production-flow-audit.md`

### Allowed Changes

- audit 문서 생성
- subscription production flow 기록
- DB direct access 위치 기록
- post access 연결점 기록
- payment success 연결점 기록
- creator/user subscription list 사용처 기록
- public boundary 후보 기록
- 다음 wave 후보 분류

### Forbidden Changes

- 코드 수정 금지
- DB schema 변경 금지
- RLS 변경 금지
- SQL 실행 금지
- table/column rename 변경 금지
- function/trigger 변경 금지
- storage bucket/policy 변경 금지
- auth/payment/subscription flow 변경 금지
- post access / visibility behavior 변경 금지
- payment success behavior 변경 금지
- subscription status behavior 변경 금지
- UI layout/copy 변경 금지
- return shape 변경 금지
- permission behavior 변경 금지
- error behavior 변경 금지
- unrelated cleanup 금지

### Expected Architecture After Wave

No runtime architecture change.

Audit only.

```txt
app / api / post / payment / creator
  ↓
subscription usage audit
  ↓
DB access / boundary / production flow classification
  ↓
next safe subscription wave selection

wave-001
Domain

subscription

Title

subscription public read wrapper baseline

Status

Completed

Goal

subscription domain의 read server 함수들을 public wrapper로 노출하여
향후 import migration을 위한 안전한 entry point를 생성한다.

Target Files

Existing:

src/modules/subscription/server/get-active-subscription.ts
src/modules/subscription/server/get-viewer-subscription.ts
src/modules/subscription/server/is-subscribed.ts
src/modules/subscription/server/check-subscription.ts

New:

src/modules/subscription/public/get-active-subscription.ts
src/modules/subscription/public/get-viewer-subscription.ts
src/modules/subscription/public/is-subscribed.ts
src/modules/subscription/public/check-subscription.ts
Allowed Changes
public wrapper 생성
server 함수 1:1 re-export
input / output 그대로 유지
Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import 변경 금지
return shape 변경 금지
error behavior 변경 금지
Result
subscription read server 함수 4개에 대한 public wrapper 생성 완료
모든 wrapper는 server 함수 1:1 re-export 방식으로 구현됨
runtime behavior 변경 없음
기존 import 유지됨
Verification
public wrapper 4개 생성 확인
server 함수와 1:1 매핑 확인
추가 로직 없음
DB access 변경 없음
기존 import 변경 없음
return shape 동일
error behavior 동일


## wave-002

### Domain

subscription

### Title

subscription public write wrapper baseline

### Status

Completed

### Goal

subscription domain의 write server 함수들을 public wrapper로 노출하여
write path에 대한 public boundary를 생성한다.

### Target Files

Existing:

- `src/modules/subscription/server/upsert-subscription.ts`
- `src/modules/subscription/server/cancel-subscription.ts`
- `src/modules/subscription/server/unsubscribe.ts`
- `docs/refactor-audits/subscription-db-access-audit.md`

New:

- `src/modules/subscription/public/upsert-subscription.ts`
- `src/modules/subscription/public/cancel-subscription.ts`
- `src/modules/subscription/public/unsubscribe.ts`

### Allowed Changes

- public wrapper 생성
- server 함수 1:1 re-export
- input / output 그대로 유지
- write path public boundary 생성

### Forbidden Changes

- server 함수 수정 금지
- DB 접근 변경 금지
- repository 도입 금지
- mapper 추가 금지
- policy/service 추가 금지
- import migration 금지
- app/api 수정 금지
- payment/post/message/story/analytics/creator/profile/workflows 수정 금지
- return shape 변경 금지
- error behavior 변경 금지
- payment / notification side-effect 변경 금지
- subscription flow 변경 금지
- refactor-progress 문서 자동 수정 금지

### Result

subscription write server 함수 3개에 대한 public wrapper 생성 완료

모든 wrapper는 server 함수 1:1 re-export 방식으로 구현됨

runtime behavior 변경 없음

기존 import 유지됨

DB write 위치 변경 없음

payment / notification side-effect 변경 없음

### Verification

- public wrapper 3개 생성 확인
- server 함수와 1:1 매핑 확인
- 추가 로직 없음
- DB access 변경 없음
- DB write 변경 없음
- 기존 import 변경 없음
- return shape 동일
- error behavior 동일
- payment / notification side-effect 유지

wave-003
Domain

subscription

Title

subscription read wrapper contract freeze

Status

Completed

Goal

public read wrapper의 contract를 명확히 고정하고,
server 함수와 동일한 input/output contract를 유지하는지 검증한다.

Target Files

Existing:

src/modules/subscription/public/get-active-subscription.ts
src/modules/subscription/public/get-viewer-subscription.ts
src/modules/subscription/public/is-subscribed.ts
src/modules/subscription/public/check-subscription.ts

New:

None
Allowed Changes
없음 (검증 only)
Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import 변경 금지
return shape 변경 금지
error behavior 변경 금지
Result

subscription read public wrapper 4개에 대해 contract freeze 완료

모든 wrapper는 server 함수 1:1 re-export 방식으로 구현되어 있음

input/output contract 동일

runtime behavior 변경 없음

Verification
getActiveSubscription null behavior 동일
getViewerSubscription shape 동일
isSubscribed boolean 동일
checkSubscription wrapper behavior 동일
wrapper 내부 추가 로직 없음
runtime behavior 동일
typecheck 영향 없음


wave-004
Domain

subscription

Title

subscription write wrapper contract freeze

Status

Completed

Goal

public write wrapper의 contract를 고정하고
write side-effect 및 상태 변경 동작이 동일한지 검증한다.

Target Files

Existing:

src/modules/subscription/public/upsert-subscription.ts
src/modules/subscription/public/cancel-subscription.ts
src/modules/subscription/public/unsubscribe.ts

New:

None
Allowed Changes
없음 (검증 only)
Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import 변경 금지
return shape 변경 금지
error behavior 변경 금지
payment / notification side-effect 변경 금지
subscription flow 변경 금지
Result

subscription write public wrapper 3개에 대해 contract freeze 완료

모든 wrapper는 server 함수 1:1 re-export 방식으로 구현되어 있음

input/output contract 동일

runtime behavior 변경 없음

Verification
upsertSubscription behavior 동일
cancelSubscription 상태 변경 동일
unsubscribe 상태 변경 동일
notification side-effect 유지
DB write 동일
runtime error 없음


wave-005
Domain

subscription

Title

subscription public boundary readiness audit

Status

Completed

Goal

subscription public layer가 import migration을 진행할 준비가 되었는지 검증한다.

Target Files

Existing:

src/modules/subscription/public/**
src/modules/subscription/server/**
docs/refactor-audits/subscription-db-access-audit.md

New:

None
Allowed Changes
public wrapper coverage 검증
server surface inventory 분석
public → server 호출 구조 검증
DB access 위치 확인
cross-domain 영향 분석
import migration readiness 판단
missing public surface 식별
blocker vs non-blocker 분류
Forbidden Changes
코드 수정 금지
DB schema 변경 금지
RLS 변경 금지
SQL 실행 금지
table/column rename 변경 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
post access / visibility behavior 변경 금지
payment success behavior 변경 금지
subscription status behavior 변경 금지
UI layout/copy 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
Result

subscription public layer 구조는 올바르게 구성되어 있으며,
모든 public wrapper는 server 함수의 1:1 re-export 구조를 유지하고 있음.

public layer에는 DB 접근이 존재하지 않으며,
DB access는 server layer에만 존재함.

subscription server surface 중 일부 함수에 대해 public wrapper가 존재하지 않음:

getCreatorSubscribers
getSubscriptionById
listSubscriptions
listUserSubscriptions

missing public surface에 대해 usage 기반 분석을 수행한 결과:

getSubscriptionById → Hard blocker
listUserSubscriptions → Hard blocker
getCreatorSubscribers → Conditional blocker
listSubscriptions → Conditional blocker

critical cross-domain path (payment/post/message/story)는
이미 public wrapper를 통해 접근 가능하며 migration 준비 상태임.

Verification
public wrapper coverage 확인 완료
public → server 단일 호출 구조 확인
public layer DB access 없음 확인
server DB access 유지 확인
server surface inventory 완료
missing public wrapper 식별 완료
usage 기반 blocker classification 완료
cross-domain 영향 없음 확인
import migration readiness 판정 완료
Issues
subscription public surface가 server 전체 surface를 완전히 커버하지 않음
일부 subscription 기능은 여전히 server direct import에 의존해야 할 가능성 존재
full import migration은 아직 불가능
Progress Update Needed
No


wave-006
Domain

subscription

Title

subscription import migration (post access only - getViewerSubscription)

Status

Completed

Goal

post domain에서 사용하는 getViewerSubscription import를
server → public으로 안전하게 전환한다.

Target Files

Existing:

src/modules/post/server/resolve-post-access-state.ts
src/modules/subscription/server/get-viewer-subscription.ts
src/modules/subscription/public/get-viewer-subscription.ts
docs/refactor-audits/subscription-db-access-audit.md

New:

None

Allowed Changes
resolve-post-access-state.ts에서 subscription server import 확인
getViewerSubscription import를 public으로 변경
호출부 로직 유지
parameter 변경 금지
return handling 변경 금지
Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import migration 범위 확장 금지
payment/post/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지
Result

resolve-post-access-state.ts에서
getViewerSubscription import를 server → public으로 전환 완료

public wrapper는 server 함수의 1:1 re-export 구조이므로
runtime behavior 변경 없음

post access flow에서 subscription check 로직 변화 없음

DB access 위치 변경 없음

Verification
import 경로 변경 확인
호출부 로직 변경 없음
parameter 전달 동일
return handling 동일
isSubscribed 계산 동일
post access 결과 동일
locked/unlocked 상태 동일
media access 영향 없음
runtime error 없음
typecheck/build 영향 없음



wave-007
Domain

subscription

Title

subscription import migration (message eligibility - getActiveSubscription)

Status

Completed

Goal

message eligibility에서 사용하는 getActiveSubscription import를
server → public으로 안전하게 전환한다.

Target Files

Existing:

src/modules/message/server/assert-message-send-eligibility.ts
src/modules/subscription/server/get-active-subscription.ts
src/modules/subscription/public/get-active-subscription.ts

New:

None

Allowed Changes
assert-message-send-eligibility.ts에서 subscription server import 확인
getActiveSubscription import를 public으로 변경
호출부 로직 유지
parameter 변경 금지
return handling 변경 금지
Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import migration 범위 확장 금지
post/payment/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지
Result

assert-message-send-eligibility.ts에서
getActiveSubscription import를 server → public으로 전환 완료

public wrapper는 server 함수의 1:1 re-export 구조이므로
runtime behavior 변경 없음

message eligibility flow에서 subscription check 로직 변화 없음

DB access 위치 변경 없음

Verification
import 경로 변경 확인
호출부 로직 변경 없음
parameter 전달 동일
return handling 동일
subscription 없는 경우 "Subscription required" error 동일
subscription 있는 경우 정상 통과
message send permission 동일
runtime error 없음
typecheck/build 영향 없음


wave-008
Domain

subscription

Title

subscription import migration (story access - checkSubscription)

Status

Completed

Goal

story read access에서 사용하는 checkSubscription import를
server → public으로 안전하게 전환한다.

Target Files

Existing:

src/modules/story/server/story-read-state.ts
src/modules/subscription/server/check-subscription.ts
src/modules/subscription/public/check-subscription.ts

New:

None

Allowed Changes

checkSubscription import 위치 확인
public import로 교체
story access 조건 변경 금지

Forbidden Changes

server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import migration 범위 확장 금지
post/payment/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지

Result

story-read-state.ts에서
checkSubscription import를 server → public으로 전환 완료

public wrapper는 server 함수의 1:1 re-export 구조이므로
runtime behavior 변경 없음

story access flow에서 subscription check 로직 변화 없음

DB access 위치 변경 없음

Verification

import 경로 변경 확인
호출부 로직 변경 없음
parameter 전달 동일
return handling 동일
story locked/unlocked 상태 동일
read state persist 동일
subscription access 동일
runtime error 없음
typecheck/build 영향 없음


wave-009
Domain

subscription

Title

subscription import migration (payment checkout - getActiveSubscription)

Status

Completed

Goal

payment checkout에서 사용하는 getActiveSubscription import를
server → public으로 안전하게 전환한다.

Target Files

Existing:

src/modules/payment/server/create-payment-checkout.ts
src/modules/subscription/server/get-active-subscription.ts
src/modules/subscription/public/get-active-subscription.ts

New:

None

Allowed Changes
create-payment-checkout.ts에서 subscription server import 확인
getActiveSubscription import를 public으로 변경
호출부 로직 유지
parameter 변경 금지
return handling 변경 금지

Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import migration 범위 확장 금지
post/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지

Result

create-payment-checkout.ts에서
getActiveSubscription import를 server → public으로 전환 완료

public wrapper는 server 함수의 1:1 re-export 구조이므로
runtime behavior 변경 없음

payment checkout flow에서 subscription duplicate check 로직 변화 없음

DB access 위치 변경 없음

Verification
import 경로 변경 확인
호출부 로직 변경 없음
parameter 전달 동일
return handling 동일
active subscription 존재 시 "SUBSCRIPTION_ALREADY_ACTIVE" 동일
subscription 없는 경우 정상 checkout 생성
payment create / provider checkout 흐름 동일
runtime error 없음
typecheck/build 영향 없음


wave-010
Domain

subscription

Title

subscription import migration (payment verification - getViewerSubscription)

Status

Completed

Goal

payment success verification에서 사용하는 getViewerSubscription import를
server → public으로 안전하게 전환한다.

Target Files

Existing:

src/modules/payment/server/verify-payment-access-after-success.ts
src/modules/subscription/server/get-viewer-subscription.ts
src/modules/subscription/public/get-viewer-subscription.ts

New:

None

Allowed Changes
verify-payment-access-after-success.ts에서 subscription server import 확인
getViewerSubscription import를 public으로 변경
호출부 로직 유지
parameter 변경 금지
return handling 변경 금지

Forbidden Changes
server 함수 수정 금지
DB 접근 변경 금지
repository 도입 금지
mapper 추가 금지
policy/service 추가 금지
import migration 범위 확장 금지
post/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지

Result

verify-payment-access-after-success.ts에서
getViewerSubscription import를 server → public으로 전환 완료

public wrapper는 server 함수의 1:1 re-export 구조이므로
runtime behavior 변경 없음

payment success verification flow에서 subscription check 로직 변화 없음

DB access 위치 변경 없음

Verification

import 경로 변경 확인
호출부 로직 변경 없음
parameter 전달 동일
return handling 동일
subscription active detection 동일
retry loop behavior 동일
success response 동일
inactive response 동일
runtime error 없음
typecheck/build 영향 없음

wave-011
Domain

subscription

Title

subscription read repository baseline (findLatestByUserAndCreator)

Status

Completed

Goal

getActiveSubscription 내부의 subscriptions read query 중
가장 단순한 latest subscription 조회를 repository로 분리한다.

Target Files

Existing:

src/modules/subscription/server/get-active-subscription.ts
docs/refactor-audits/subscription-db-access-audit.md

New:

src/modules/subscription/repositories/subscription-read-repository.ts

Allowed Changes

subscriptions read query를 repository로 이동
select columns 유지
filter 조건 유지
ordering 유지
repository는 DB access만 담당
server는 state resolve / read model 유지

Forbidden Changes

server 함수 로직 변경 금지
DB 접근 방식 변경 금지
repository 외 로직 이동 금지
mapper 추가 금지
policy/service 추가 금지
public wrapper 수정 금지
post/payment/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지

Result

getActiveSubscription 내부의 subscriptions DB query가
subscription-read-repository로 분리 완료

repository는 DB access만 담당하며
state resolve / read model / mapping 로직은 server에 그대로 유지됨

runtime behavior 변경 없음

DB query 구조(select/filter/order) 변경 없음

Verification

repository 함수 생성 확인
server → repository 호출 변경 확인
select columns 동일
filter 동일
ordering 동일 (created_at desc)
error throw behavior 동일
null/empty 처리 동일
findLatestAccessibleSubscriptionReadModel 위치 유지
return shape 동일
runtime 영향 없음
typecheck/build 영향 없음

Issues

repository 함수명(findLatestByUserAndCreator)은 latest 1건 조회를 의미하지만
실제 구현은 기존 behavior 유지(전체 rows 조회 후 server에서 active 선택)를 따름

Progress Update Needed

No

wave-012
Domain

subscription

Title

subscription read repository extension (accessible subscription)

Status

Completed

Goal

getActiveSubscription 내부의 accessible subscription 판단을 위한
read query를 repository로 확장 분리한다.

Target Files

Existing:

src/modules/subscription/server/get-active-subscription.ts
src/modules/subscription/repositories/subscription-read-repository.ts

New:

None

Allowed Changes
accessible subscription 판단 로직을 repository로 이동
기존 findLatestByUserAndCreator 재사용
findLatestAccessibleSubscriptionReadModel 재사용
기존 filter 조건 유지
기존 ordering 유지
repository는 DB access + selection 담당
server는 orchestration + return mapping 유지
Forbidden Changes
resolveSubscriptionState 수정 금지
buildSubscriptionReadModel 수정 금지
DB 접근 방식 변경 금지
SQL filter 추가 금지
mapper 추가 금지
policy/service 추가 금지
public wrapper 수정 금지
post/payment/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지
Result

getActiveSubscription 내부에서 수행되던 accessible subscription 판단 로직이
subscription-read-repository로 이동 완료

repository는 기존 DB query 이후
findLatestAccessibleSubscriptionReadModel을 재사용하여
accessible subscription을 선택하고 해당 row를 반환하도록 확장됨

server는 rows 조회 및 accessible 판단 로직을 제거하고
repository에서 반환된 row를 기반으로 return mapping만 수행하도록 단순화됨

runtime behavior 변경 없음

DB query 구조(select/filter/order) 변경 없음

accessible 판단 로직 변경 없음

Verification

repository 함수 확장 확인
server → repository 호출 변경 확인
findLatestAccessibleSubscriptionReadModel 재사용 확인
hasAccess 판단 로직 동일
subscription selection 결과 동일
edge case 동일
null/empty 처리 동일
error throw behavior 동일
return shape 동일
runtime 영향 없음
typecheck/build 영향 없음

Issues

repository가 server/build-subscription-read-model에 의존하는 구조 존재
layer boundary 측면에서는 이상적이지 않으나
현재 phase에서는 smallest diff / zero behavior change 기준으로 허용

Progress Update Needed

No

wave-013
Domain

subscription

Title

subscription read repository (getViewerSubscription read extraction)

Status

Completed

Goal

getViewerSubscription 내부의 subscriptions read query를 repository로 분리한다.

Target Files

Existing:

src/modules/subscription/server/get-viewer-subscription.ts
src/modules/subscription/repositories/subscription-read-repository.ts

New:

None

Allowed Changes

subscriptions read query를 repository로 이동
select columns 유지
filter 조건 유지
ordering 유지
limit(1) 유지
repository는 DB access만 담당
server는 read model / return mapping 유지

Forbidden Changes

buildSubscriptionReadModel 수정 금지
resolveSubscriptionState 수정 금지
DB 접근 방식 변경 금지
SQL filter 추가 금지
mapper 추가 금지
policy/service 추가 금지
public wrapper 수정 금지
post/payment/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지

Result

getViewerSubscription 내부의 subscriptions DB query가
subscription-read-repository로 분리 완료

repository에는 latest 1 row 조회 전용 함수가 추가되었으며
created_at desc + limit(1) query contract가 그대로 유지됨

server는 DB 접근을 제거하고
repository에서 반환된 row를 기반으로 read model 생성 및 return mapping만 수행하도록 변경됨

runtime behavior 변경 없음

DB query 구조(select/filter/order/limit) 변경 없음

Verification

repository 함수 생성 확인
server → repository 호출 변경 확인
select columns 동일
filter 동일
ordering 동일 (created_at desc)
limit(1) 동일
error throw behavior 동일
null/empty 처리 동일
findLatestSubscriptionReadModel 호출 유지
toSubscriptionDisplayStatus 호출 유지
isActive 판단 동일
subscription summary 동일
return shape 동일
runtime 영향 없음
typecheck/build 영향 없음

Issues

None

Progress Update Needed

No

wave-014
Domain

subscription

Title

subscription read repository (isSubscribed / checkSubscription)

Status

Completed

Goal

isSubscribed / checkSubscription에서 사용하는 read query를 repository로 분리한다.

Target Files

Existing:

src/modules/subscription/server/is-subscribed.ts
src/modules/subscription/server/check-subscription.ts
src/modules/subscription/repositories/subscription-read-repository.ts

New:

None

Allowed Changes

subscriptions read query를 repository로 이동
기존 repository 함수 재사용
중복 query 제거
boolean / wrapper behavior 유지

Forbidden Changes

server 함수 로직 변경 금지
DB 접근 방식 변경 금지
SQL filter 추가 금지
mapper 추가 금지
policy/service 추가 금지
public wrapper 수정 금지
post/payment/message/story/analytics/app 수정 금지
return shape 변경 금지
error behavior 변경 금지
subscription flow 변경 금지
refactor-progress 문서 자동 수정 금지

Result

isSubscribed 내부의 subscriptions DB query가 제거되고
subscription-read-repository의 findLatestViewerSubscriptionByUserAndCreator를 사용하도록 변경됨

checkSubscription은 기존 getViewerSubscription 호출 구조를 유지하여
repository 경유 구조를 그대로 사용하도록 유지됨

runtime behavior 변경 없음

DB query 구조(select/filter/order/limit) 변경 없음

Verification

repository 함수 재사용 확인
user_id / creator_id filter 동일
created_at desc + limit(1) 동일
resolveSubscriptionState 호출 유지
hasAccess 판단 동일
row 없음 → false 처리 동일
checkSubscription wrapper behavior 동일
trim 처리 동일
runtime 영향 없음
typecheck/build 영향 없음

Issues

None

Progress Update Needed

No


wave-015
Domain
subscription

Title
subscription read repository consolidation

Status
Completed

Goal
subscription read query들을 하나의 repository layer로 정리하고
중복 query를 제거한다.

Target Files
Existing:

src/modules/subscription/repositories/subscription-read-repository.ts
src/modules/subscription/server/get-subscription-by-id.ts
src/modules/subscription/server/list-user-subscriptions.ts
src/modules/subscription/server/get-creator-subscribers.ts
src/modules/subscription/server/list-subscriptions.ts
New:

None

Allowed Changes
repository 내부 함수 중복 확인
동일 query 통합
naming 정리
server layer는 repository만 호출하도록 유지
subscriptions read query를 repository로 이동
기존 select columns 유지
기존 filter 조건 유지
기존 ordering 유지
기존 pagination/cursor behavior 유지
기존 Supabase client behavior 유지
server mapping / read model / return mapping 유지
Forbidden Changes
scope 밖 작업 금지
DB schema 변경 금지
RLS policy 변경 금지
SQL migration 실행 금지
table/column rename 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
UI copy/layout 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
대규모 파일 이동 금지
src/modules/post/** 수정 금지
src/modules/payment/** 수정 금지
src/modules/message/** 수정 금지
src/modules/story/** 수정 금지
src/modules/analytics/** 수정 금지
src/app/** 수정 금지
DB 관련 파일 수정 금지
refactor-progress 문서 자동 수정 금지
Result
subscription read server 함수들에 남아 있던 subscriptions DB read query가
subscription-read-repository로 분리 완료

getSubscriptionById 내부의 subscription detail read query가
findSubscriptionWithCreatorById repository 함수로 이동됨

listUserSubscriptions 내부의 user subscription list read query가
listSubscriptionsWithCreatorByUserId repository 함수로 이동됨

getCreatorSubscribers 내부의 creator subscriber list read query가
listCreatorSubscriberRows repository 함수로 이동됨

listSubscriptions 내부의 creator subscription list read query가
listSubscriptionsWithProfilesByCreatorId repository 함수로 이동됨

server layer는 DB 직접 접근을 제거하고
repository에서 반환된 row를 기반으로 기존 mapping / read model / return mapping만 수행하도록 변경됨

runtime behavior 변경 없음

DB query 구조(select/filter/order/limit/cursor) 변경 없음

listSubscriptions는 기존 createClient 사용 behavior를 repository 내부에서 유지함

기존 error behavior 유지됨

Verification
repository 함수 추가 확인
server → repository 호출 변경 확인
getSubscriptionById select columns 동일
getSubscriptionById maybeSingle behavior 동일
listUserSubscriptions select columns 동일
listUserSubscriptions user_id filter 동일
listUserSubscriptions created_at desc ordering 동일
listUserSubscriptions error message 동일
getCreatorSubscribers creator_id filter 동일
getCreatorSubscribers created_at desc ordering 동일
getCreatorSubscribers limit + 20 behavior 동일
getCreatorSubscribers cursor lt(created_at) behavior 동일
getCreatorSubscribers active/access filtering 위치 유지
listSubscriptions createClient behavior 유지
listSubscriptions select columns 동일
listSubscriptions creator_id filter 동일
listSubscriptions created_at desc ordering 동일
listSubscriptions error message 동일
return shape 동일
permission behavior 동일
runtime 영향 없음
read server files direct subscriptions DB access 제거 확인
git diff --check 통과
typecheck 실행됨
Issues
typecheck는 subscription 변경과 무관한 post domain 기존 에러로 실패함

src/modules/post/server/get-creator-studio-post.ts
src/modules/post/server/list-creator-posts.ts
subscription 관련 typecheck error는 출력되지 않음

repository가 server/build-subscription-read-model에 의존하는 구조가 여전히 존재함

Progress Update Needed

No


wave-016
Domain
subscription

Title
subscription read model boundary cleanup

Status
Completed

Goal
subscription read repository가 server read model helper에 의존하는 구조를 제거하고,
read model 생성/selection 책임을 server boundary에 유지한다.

Target Files
Existing:

src/modules/subscription/repositories/subscription-read-repository.ts
src/modules/subscription/server/get-active-subscription.ts
src/modules/subscription/server/build-subscription-read-model.ts
src/modules/subscription/server/get-viewer-subscription.ts
New:

None

Allowed Changes
repository에서 server/build-subscription-read-model import 제거
findLatestAccessibleByUserAndCreator가 기존 query rows를 반환하도록 조정
getActiveSubscription에서 기존 findLatestAccessibleSubscriptionReadModel 재사용
기존 DB query/select/filter/order 유지
기존 return shape 유지
Forbidden Changes
scope 밖 작업 금지
DB schema 변경 금지
RLS policy 변경 금지
SQL migration 실행 금지
table/column rename 금지
function/trigger 변경 금지
storage bucket/policy 변경 금지
auth/payment/subscription flow 변경 금지
UI copy/layout 변경 금지
return shape 변경 금지
permission behavior 변경 금지
error behavior 변경 금지
unrelated cleanup 금지
대규모 파일 이동 금지
public wrapper 수정 금지
subscription status/access behavior 변경 금지
getViewerSubscription behavior 변경 금지
post/payment/message/story/app 수정 금지
refactor-progress 문서 수정 금지
Result
subscription-read-repository.ts가
server/build-subscription-read-model.ts에 의존하던 구조 제거 완료

repository는 DB access와 row 반환만 담당하도록 정리됨

findLatestAccessibleByUserAndCreator는 기존 query rows를 반환하도록 조정됨

accessible subscription 선택 책임은 getActiveSubscription server boundary로 이동됨

getActiveSubscription은 기존 findLatestAccessibleSubscriptionReadModel을 재사용하여
hasAccess 기반 selection behavior를 유지함

runtime behavior 변경 없음

DB query 구조(select/filter/order) 변경 없음

return shape 변경 없음

error behavior 변경 없음

subscription access behavior 변경 없음

Verification
repository -> server/build-subscription-read-model import 제거 확인
subscription read server direct DB access 재발생 없음 확인
write server DB access는 기존 그대로 유지됨
findLatestByUserAndCreator query 동일
select columns 동일
user_id / creator_id filter 동일
created_at desc ordering 동일
Supabase error throw behavior 동일
empty rows -> null behavior 동일
hasAccess selection 동일
getActiveSubscription return shape 동일
provider/provider_subscription_id 유지
cancelAtPeriodEnd/currentPeriodEnd/canceledAt mapping 동일
changed files 대상 git diff --check 통과
typecheck 실행됨
Issues
typecheck는 subscription 변경과 무관한 post domain 기존 에러로 실패함

src/modules/post/server/get-creator-studio-post.ts
src/modules/post/server/list-creator-posts.ts

subscription 관련 typecheck error는 출력되지 않음

전체 git diff --check는 기존 문서 trailing whitespace 때문에 실패함

3차 때 쓸 db-architecture-audit.md
3차때 쓸 project-baseline.md

Progress Update Needed

Yes

Current Architecture State

subscription domain은 여전히 server layer에서 직접 DB 접근과 read/write model 구성을 수행하고 있으며,
app / api / 다른 domain에서 server 경로를 직접 import하는 구조가 남아 있다.

public layer는 wave-001을 통해 read entry point가 생성되었다.

wave-002를 통해 write entry point가 생성되었다.

wave-003을 통해 read wrapper contract가 server와 동일하게 고정되었다.

wave-004를 통해 write wrapper contract가 server와 동일하게 고정되었다.

wave-005를 통해 public boundary readiness audit이 완료되었으며,
public 구조의 안정성과 import migration 가능 여부가 검증되었다.

wave-006을 통해 post domain의 resolve-post-access-state에서
getViewerSubscription import가 public으로 전환되었으며
subscription public boundary를 통한 실제 runtime 경로 사용이 시작되었다.

wave-007을 통해 message domain의 assert-message-send-eligibility에서
getActiveSubscription import가 server → public으로 전환되었으며
subscription public boundary를 통한 message eligibility flow 적용이 시작되었다.

wave-008을 통해 story domain의 story-read-state에서
checkSubscription import가 server → public으로 전환되었으며
subscription public boundary를 통한 story access flow 적용이 시작되었다.

wave-009를 통해 payment domain의 create-payment-checkout에서
getActiveSubscription import가 server → public으로 전환되었으며
subscription public boundary를 통한 payment checkout flow 적용이 시작되었다.

wave-010를 통해 payment domain의 verify-payment-access-after-success에서
getViewerSubscription import가 server → public으로 전환되었으며
subscription public boundary를 통한 payment success verification flow 적용이 시작되었다.

wave-011을 통해 getActiveSubscription 내부의 subscriptions DB read query가
repository로 분리되었으며
subscription domain 내 DB access의 일부가 repository layer로 이동되기 시작했다.

wave-012를 통해 getActiveSubscription 내부의 accessible subscription 판단 로직이
repository로 이동되었으며
subscription domain 내 read selection 책임이 server에서 repository로 확장되기 시작했다.

wave-013을 통해 getViewerSubscription 내부의 subscriptions DB read query가
repository로 분리되었으며
subscription domain 내 latest single row read 패턴이 repository layer로 확장되기 시작했다.

wave-014를 통해 isSubscribed 내부의 subscriptions DB read query가
repository로 분리되었으며
subscription domain 내 단일 boolean access check 경로가 repository layer를 통해 일관되게 처리되도록 확장되었다.

wave-015를 통해 getSubscriptionById, listUserSubscriptions, getCreatorSubscribers, listSubscriptions 내부의 subscriptions DB read query가
repository로 분리되었으며
subscription domain 내 read server 경로 대부분이 repository layer를 통해 처리되도록 확장되었다.

wave-016을 통해 subscription-read-repository.ts가 server/build-subscription-read-model.ts에 의존하던 구조가 제거되었으며,
read model 생성/selection 책임이 server boundary에 유지되도록 정리되었다.

Progress Summary

post domain migration 완료
media domain migration 완료
subscription domain migration 시작

wave-001 완료: subscription read server 함수 public wrapper baseline 생성
wave-002 완료: subscription write server 함수 public wrapper baseline 생성
wave-003 완료: subscription read wrapper contract freeze 및 server contract 검증 완료
wave-004 완료: subscription write wrapper contract freeze 및 server contract 검증 완료
wave-005 완료: subscription public boundary readiness audit 및 import migration readiness 판정 완료
wave-006 완료: post access에서 getViewerSubscription import server → public 전환 완료
wave-007 완료: message eligibility에서 getActiveSubscription import server → public 전환 완료
wave-008 완료: story access에서 checkSubscription import server → public 전환 완료
wave-009 완료: payment checkout에서 getActiveSubscription import server → public 전환 완료
wave-010 완료: payment success verification에서 getViewerSubscription import server → public 전환 완료
wave-011 완료: getActiveSubscription DB query를 repository로 분리하여 subscription read repository baseline 구축
wave-012 완료: getActiveSubscription accessible subscription 판단을 repository로 이동하여 read selection 책임 확장 완료
wave-013 완료: getViewerSubscription DB query를 repository로 분리하여 latest single row read 패턴 repository 확장 완료
wave-014 완료: isSubscribed DB query를 repository로 분리하여 boolean access check 경로 repository 통합 완료
wave-015 완료: getSubscriptionById, listUserSubscriptions, getCreatorSubscribers, listSubscriptions DB read query를 repository로 분리하여 subscription read repository consolidation 완료
wave-016 완료: subscription-read-repository.ts의 server read model helper 의존 제거 및 accessible subscription selection 책임 server boundary 유지 완료

현재 위치

subscription domain

read server 함수 → public wrapper 생성 완료
write server 함수 → public wrapper 생성 완료
read wrapper contract freeze 완료
write wrapper contract freeze 완료
public boundary readiness audit 완료
post access import migration 일부 완료 (getViewerSubscription 적용 완료)
message eligibility import migration 일부 완료 (getActiveSubscription 적용 완료)
story access import migration 일부 완료 (checkSubscription 적용 완료)
payment checkout import migration 일부 완료 (getActiveSubscription 적용 완료)
payment success verification import migration 일부 완료 (getViewerSubscription 적용 완료)
read repository baseline 일부 시작 (getActiveSubscription query repository 분리 완료)
read repository 확장 일부 진행 (accessible subscription selection repository 이동 완료)
read repository 확장 추가 진행 (getViewerSubscription latest row query repository 이동 완료)
read repository 확장 추가 진행 (isSubscribed boolean access query repository 이동 완료)
read repository consolidation 진행 완료 (getSubscriptionById, listUserSubscriptions, getCreatorSubscribers, listSubscriptions read query repository 분리 완료)
read model boundary cleanup 진행 완료 (repository -> server/build-subscription-read-model 의존 제거 완료)

import migration 진행 단계 (multi-domain partial migration 진행 중)
repository / policy / use-case 분리 진행 초기 단계

Next Step Recommendation

wave-017: subscription read model mapper relocation