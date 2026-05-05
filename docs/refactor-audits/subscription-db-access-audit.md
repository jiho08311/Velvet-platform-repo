Subscription DB Access Audit

## 1. Scope

subscription domain의 DB direct access 위치와
cross-domain subscription access 패턴을 식별하고,
repository 후보 및 안전한 다음 implementation wave를 정의한다.

---

## 2. Source Files Reviewed

### subscription domain
- subscription/server/*
- subscription/lib/*

### api
- app/api/subscription/check/route.ts
- app/api/subscription/cancel/route.ts
- app/api/subscription/unsubscribe/route.ts

### payment
- modules/payment/server/create-payment-checkout.ts
- modules/payment/server/confirm-payment.ts
- modules/payment/server/verify-payment-access-after-success.ts

### post
- modules/post/server/resolve-post-access-state.ts
- modules/post/server/get-post-access.ts
- modules/post/server/get-post-by-id.ts

### message
- modules/message/server/assert-message-send-eligibility.ts
- modules/message/server/assert-can-send-message.ts

### story
- modules/story/server/story-read-state.ts

### analytics
- modules/analytics/server/get-creator-analytics-summary.ts
- modules/analytics/server/build-creator-analytics-summary.ts

### workflows
- workflows/subscription/notify-subscription-canceled-workflow.ts

---

## 3. Grep Scope

- "subscriptions"
- ".from('subscriptions')"
- ".from(\"subscriptions\")"
- "getViewerSubscription"
- "getActiveSubscription"
- "checkSubscription"
- "isSubscribed"
- "upsertSubscription"
- "cancelSubscription"
- "unsubscribe"

---

## 4. Direct DB Access Summary

### subscription domain
- subscriptions table read/write 직접 수행
- repository layer 없음

### app/api
- unsubscribe route에서 subscriptions 직접 조회 존재

### analytics
- subscriptions count 직접 조회 존재

### cross-domain
- post / message / story / payment는 subscriptions 직접 접근 없음
- 대신 subscription server 함수 직접 import 사용

---

## 5. Subscription Internal DB Access

### Read

- getActiveSubscription
- getViewerSubscription
- isSubscribed
- checkSubscription
- listUserSubscriptions
- getCreatorSubscribers

### Write

- upsertSubscription
- cancelSubscription
- unsubscribe

---

## 6. App/API DB Access

### unsubscribe route

```txt
subscriptions
- select id, user_id, creator_id
- filter: id + user_id
- purpose: ownership check

Behavior:

missing id → 400
not found → 404
실패 → 500
7. Cross-domain DB Access
analytics
subscriptions count
subscriptions where status = active

→ creator analytics summary에서 직접 사용

payment
subscription read:
getActiveSubscription
subscription write:
upsertSubscription (confirm-payment)
subscription verification:
getViewerSubscription (retry loop)
post
getViewerSubscription → access 판단
message
getActiveSubscription → send eligibility
story
checkSubscription → read access
8. Read Query Inventory
getActiveSubscription
getViewerSubscription
isSubscribed
checkSubscription
analytics subscription count
analytics active subscription count
unsubscribe route ownership select
9. Write Query Inventory
upsertSubscription
cancelSubscription
unsubscribe
10. Query Contract Inventory
getActiveSubscription
return: subscription | null
getViewerSubscription
return: { isActive: boolean, subscription }
isSubscribed
return: boolean
checkSubscription
wrapper around getViewerSubscription
unsubscribe / cancel
update cancel flags
no return or boolean success
11. Error / Null Behavior Inventory
getActiveSubscription → null
getViewerSubscription → empty state
isSubscribed → false
unsubscribe route → 400 / 404 / 500
payment → throw error
message eligibility → throw error
12. Repository Candidate Methods
findLatestByUserAndCreator
findLatestAccessibleByUserAndCreator
findById
listByUser
listByCreator
countByCreator
countActiveByCreator

updateCancelById
updateCancelByUserAndCreator
upsertActiveSubscription
13. Mapper Candidate
buildSubscriptionReadModel
subscription identity mapping
14. Policy / Service Non-goals
resolveSubscriptionState → service
subscription price validation → service
access 판단 로직 → policy

👉 DB access와 분리해야 함

15. Risk Classification
Critical
payment → upsertSubscription
post access → getViewerSubscription
message eligibility → getActiveSubscription
story access → checkSubscription
High
API unsubscribe ownership check
payment duplicate subscription prevention
Medium
analytics subscription count
16. Safe Next Implementation Wave Recommendation
Option A (추천)
unsubscribe route ownership check를
subscription read function / repository로 이동

이유:

scope 작음
cross-domain 영향 없음
rollback 쉬움
Option B
getViewerSubscription 내부 read만 repository로 분리

이유:

더 근본적
하지만 post/payment 영향 있음
17. Verification Checklist
subscription direct DB access 확인 완료
app/api direct DB access 확인 완료
cross-domain DB access 확인 완료
read/write query 분리 완료
query contract 정리 완료
repository 후보 정의 완료
mapper/service 후보 정의 완료
code changes 없음
DB 변경 없음
18. Final Conclusion

subscription DB access는 다음 3곳에 존재한다:

1. subscription/server (주요)
2. app/api (unsubscribe route)
3. analytics (count query)

cross-domain은 DB 접근 대신 subscription server에 의존한다.

현재 구조는:

DB access + state + policy + read model 혼합

👉 Code Architecture Migration에서 가장 우선적으로 분리해야 하는 domain이다.


---

# 📌 상태 보고

```txt
Files Changed:
- docs/refactor-audits/subscription-db-access-audit.md

Behavior Changed:
- None

Verification:
- subscription DB access fully audited
- cross-domain access patterns identified
- repository candidates defined

Issues:
- None

Progress Update Needed:
- No

여기까지 오면 진짜 중요한 지점이다.