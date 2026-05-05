# DB Architecture Audit

## Purpose

현재 DB schema를 변경하지 않고, 코드 아키텍처 개편 전에 도메인별 DB 책임, production flow, 위험도, migration 후보를 정리한다.

이 문서는 DB를 고치기 위한 문서가 아니라, **DB를 건드리지 않고 코드 구조를 안전하게 개편하기 위한 위험 지도**다.

---

## Current Phase Rule

현재 phase는 **Code Architecture Migration**이다.

### 금지

- DB schema 변경 금지
- RLS policy 변경 금지
- SQL migration 실행 금지
- table/column rename 금지
- function/trigger 변경 금지
- storage bucket/policy 변경 금지
- payment/auth flow 변경 금지

### 허용

- DB 접근 코드를 repository로 이동
- DB row 변환을 mapper로 이동
- policy/service/use-case/public boundary 추가
- old + new 공존
- 기존 동작 유지

---

## Target Direction

현재 구조:

```txt
app / ui / api / server
  ↓
supabase 직접 접근

목표 구조:

app / ui / api
  ↓
modules/{domain}/public
  ↓
use-cases
  ↓
repositories / mappers / policies / services
  ↓
Supabase
Domain DB Map
1. post
Related Tables
posts
post_blocks
post_likes
comments
comment_likes
Connected Tables
media
creators
profiles
subscriptions
payments
Production Flows
create post
update post
delete post
get post by id
creator feed / list feed
post access / visibility
post purchase / commerce CTA
post interactions: blocks / likes / comments
Current DB Responsibility
post 생성/수정/삭제/조회
post block 저장/조회
like/comment count 조회
access/visibility 판단
feed render input 구성
locked/paid/preview 상태 판단
Current Problems
modules/post/server/*가 DB 접근, policy, mapper, use-case 역할을 동시에 가짐
app/api/ui가 post server 내부 구현을 직접 import함
getPostById, getCreatorFeed, getPostAccess가 여러 도메인에서 공유됨
post read flow가 media/payment/subscription/creator/profile과 강하게 연결됨
comments/likes API route에서 DB 직접 접근이 존재함
Risk Level

High / Critical

Do Not Change Now
posts schema
post_blocks schema
post visibility behavior
PPV access behavior
feed ordering
locked preview behavior
comments/likes API response shape
RLS policies
Repository Candidates
post-repository
post-block-repository
post-like-repository
comment-repository
comment-like-repository
post-media-repository
Mapper Candidates
post-mapper
post-block-mapper
post-render-mapper
comment-mapper
post-media-mapper
Policy Candidates
post-access-policy
post-visibility-policy
post-commerce-policy
post-draft-policy
post-moderation-policy
comment-policy
Migration Candidates
post read model 정규화 가능성
post_blocks editor_state 구조 검토
comments/comment_likes ownership/index 검토
post visibility/status 컬럼 정리 후보
PPV purchase/access relation 정리 후보
Recommended Refactor Entry
post_blocks repository 분리부터 시작
이후 post_likes → comments/comment_likes → public wrapper 순서
2. media
Related Tables
media
story_video_jobs
Connected Tables
posts
messages
stories
moderation_queue
moderation_results
creators
profiles
Storage Buckets
media
avatars
story media bucket if separate
Production Flows
upload media
create signed URL
secure post media access
secure message media access
story video processing
post/message/story media 연결
Current DB/Storage Responsibility
media metadata 저장
storage path 관리
signed URL 생성
post/message/story media 연결
secure access 판단
story video job tracking
Current Problems
여러 도메인이 modules/media/server/create-media-signed-url을 직접 import함
storage 접근이 server/ui/api에 분산됨
media가 post access logic에 의존하는 지점이 있음
post/message/story media 역할이 하나의 media table에 섞여 있을 가능성 있음
Risk Level

Critical

Do Not Change Now
media table 분리
bucket 구조 변경
signed URL expiration 변경
storage policy 변경
secure media access behavior 변경
story video processing 변경
Repository Candidates
media-repository
media-storage-repository
story-video-job-repository
Mapper Candidates
media-mapper
secure-media-mapper
story-video-job-mapper
Policy Candidates
media-access-policy
secure-post-media-policy
secure-message-media-policy
Migration Candidates
media role/type 분리 가능성
post/message/story media relation 정규화
storage_path normalization
bucket별 policy 정리
story_video_jobs lifecycle 정리
Recommended Refactor Entry
media public boundary 먼저 추가
createMediaSignedUrl public wrapper 생성
외부 import를 server에서 public으로 전환
storage 접근은 repository로 이동
3. subscription
Related Tables
subscriptions
Connected Tables
creators
profiles
posts
payments
Production Flows
subscribe
unsubscribe/cancel
check active subscription
subscription access unlock
creator subscriber list
user subscription list
Current DB Responsibility
구독 상태 저장
viewer/creator subscription 조회
post access와 연결
payment success 이후 subscription 반영
Current Problems
post access/payment와 강하게 연결됨
subscription status 판단 로직이 server/lib에 섞여 있을 가능성 있음
payment와 동시에 건드리면 위험도 높음
Risk Level

High

Do Not Change Now
subscription status schema
payment 연결 방식
subscription access behavior
RLS policies
Repository Candidates
subscription-repository
Service Candidates
subscription-state-service
subscription-access-service
Migration Candidates
subscription status enum 정리
active/canceled/expired lifecycle 정리
payment relation 정규화
4. payment
Related Tables
payments
Connected Tables
subscriptions
posts
messages
payouts
earnings
creators
profiles
Production Flows
create checkout
confirm payment
confirm provider payment
payment success/cancel/fail
refund
PPV post payment
PPV message payment
verify payment access after success
has purchased post
Current DB Responsibility
payment 생성
payment confirmation
provider result 저장
PPV post/message unlock
subscription/payment 연결
payout/earning 연결 가능성
Current Problems
payment는 post/message/subscription/payout과 모두 연결됨
provider 로직과 DB write 로직이 섞여 있을 가능성 있음
access 판단과 payment execution이 섞일 수 있음
상태 전이 변경 시 결제/접근/정산이 동시에 깨질 수 있음
Risk Level

Critical

Do Not Change Now
payments schema
provider flow
checkout/confirm/refund flow
payment status values
PPV unlock behavior
subscription payment behavior
payout/earning relation
RLS policies
Repository Candidates
payment-repository
payment-provider-result-repository
Service Candidates
payment-provider-service
payment-state-service
payment-result-service
Policy Candidates
payment-access-policy
ppv-purchase-policy
Migration Candidates
payment target_type/target_id 정리
payment status lifecycle 정리
provider payload 구조 정리
PPV post/message payment relation 분리 후보
subscription payment relation 정규화
Recommended Refactor Entry
초반 변경 금지
public wrapper부터 시작
내부 decomposition은 post/media 구조 안정화 후 진행
5. message
Related Tables
conversations
conversation_participants
messages
Connected Tables
media
payments
profiles
creators
notifications
Production Flows
conversation list load
conversation detail load
send message
send paid message
message media
secure message media access
mark conversation read
Current DB Responsibility
conversation 생성/조회
participant 검증
message 저장/조회
paid message 상태
message media 연결
notification 생성 연결
Current Problems
message access, media access, payment, notification이 연결됨
PPV message flow는 payment와 강하게 결합됨
media signed URL 사용 가능성 높음
Risk Level

High

Do Not Change Now
conversation participant schema
paid message flow
message media access behavior
notification side effect
RLS policies
Repository Candidates
conversation-repository
conversation-participant-repository
message-repository
message-media-repository
Policy Candidates
message-access-policy
message-send-policy
message-attachment-policy
Migration Candidates
paid message lifecycle 정리
conversation participant relation 정규화
message media relation 정리
6. notification
Related Tables
notifications
Connected Tables
posts
comments
messages
profiles
creators
Production Flows
create notification
list notifications
mark notification read
mark all notifications read
delete notification
Current DB Responsibility
notification 생성
notification 조회
read state 변경
owner visibility 판단
Current Problems
여러 도메인에서 notification 생성 가능
notification input builder와 DB write가 섞여 있을 수 있음
상대적으로 분리 난이도는 낮음
Risk Level

Medium

Do Not Change Now
notification type values
read state behavior
notification owner behavior
RLS policies
Repository Candidates
notification-repository
Mapper Candidates
notification-mapper
notification-input-mapper
Policy Candidates
notification-visibility-policy
notification-type-policy
Migration Candidates
notification type enum 정리
read state table 분리 여부 검토
notification payload 구조 정리
7. creator / profile
Related Tables
creators
profiles
Connected Tables
posts
subscriptions
payments
payouts
media
admin_role_assignments
Production Flows
onboarding
profile edit
adult verification
become creator
creator page load
creator dashboard load
creator settings update
creator readiness
public profile visibility
Current DB Responsibility
user profile 저장/조회
creator identity 저장/조회
username/profile lookup
creator readiness 판단
public visibility 판단
creator dashboard data 구성
Current Problems
creator/profile 경계가 애매할 수 있음
creator page는 post/feed/media/access와 강하게 연결됨
auth/onboarding과 연결되어 초기 변경 위험 있음
Risk Level

High

Do Not Change Now
creators/profiles 통합
username structure
onboarding flow
auth flow
adult verification behavior
creator readiness behavior
RLS policies
Repository Candidates
creator-repository
profile-repository
creator-dashboard-repository
Service Candidates
creator-identity-service
creator-readiness-service
profile-visibility-service
Policy Candidates
creator-visibility-policy
profile-visibility-policy
Migration Candidates
creator/profile responsibility 분리 정리
username uniqueness/index 검토
readiness fields 정리
adult verification state 정리
8. payout
Related Tables
payouts
payout_requests
payout_accounts
earnings
Connected Tables
payments
creators
admin_role_assignments
audit_logs
Production Flows
create payout account
payout account readiness
create payout request
approve payout request
reject payout request
mark payout paid
mark payout failed
release pending earnings
reverse earning
list creator earnings/payouts
admin payout review
Current DB Responsibility
creator earning 기록
payout request lifecycle
payout execution
payout account readiness
admin approval/rejection
terminal state transition
Current Problems
payment/earnings/payout/admin이 강하게 연결됨
money state transition이므로 가장 위험한 영역 중 하나
상태 전이와 read model builder가 섞여 있을 가능성 있음
Risk Level

Critical

Do Not Change Now
payout status values
payout request lifecycle
earnings structure
payout release/reversal behavior
admin approval behavior
DB schema/RLS
Repository Candidates
payout-repository
payout-request-repository
payout-account-repository
earning-repository
Service Candidates
payout-state-service
payout-balance-service
payout-execution-service
Policy Candidates
payout-execution-policy
payout-request-policy
payout-admin-policy
Migration Candidates
earnings lifecycle 정리
payout request state machine 정리
payout/payout_request relation 정리
admin audit trail 강화 후보
9. admin
Related Tables
admin_role_assignments
audit_logs
Connected Tables
profiles
creators
payout_requests
payouts
reports
moderation_queue
users/auth
Production Flows
admin access check
super admin access check
list users
list creators
ban/unban user
user status toggle
list payout requests
approve/reject payout request
mark payout paid/failed
audit log review
Current DB Responsibility
admin role lookup
super admin check
user/creator operational control
payout admin action
audit logging
Current Problems
admin은 여러 도메인을 조작하는 상위 계층
payout/admin/payment가 연결되어 위험함
권한 정책 변경 시 전체 admin surface가 깨질 수 있음
Risk Level

High

Do Not Change Now
admin role schema
require-admin/require-super-admin behavior
payout admin action behavior
user ban/reactivation behavior
audit log behavior
RLS policies
Repository Candidates
admin-role-repository
audit-log-repository
admin-user-repository
Policy Candidates
admin-role-policy
super-admin-policy
admin-user-operational-policy
payout-request-admin-policy
Migration Candidates
admin role hierarchy 정리
audit log event schema 정리
admin action authorization 정리
Global Risk Summary
Critical
payment
payout
media signed URL / secure media access
post access / visibility
getPostById shared read contract
feed read model
updatePostStatus
High
post create/update/delete
subscription
message
creator/profile
admin
Medium
notification
post_blocks
likes/comments repository extraction
Recommended Architecture Migration Order
Code Architecture Migration
post interactions
post_blocks
post_likes
comments
comment_likes
post public wrapper
getPostById
getCreatorFeed
deletePost
media public boundary
createMediaSignedUrl
getSecurePostMedia
post access / visibility boundary
feed/read model decomposition
creator/profile read boundaries
message boundaries
subscription boundaries
payment boundaries
payout boundaries
admin boundaries
DB Migration Phase Rule

DB migration은 모든 주요 도메인의 code architecture migration이 안정화된 후 별도 phase에서 진행한다.

DB migration phase에 진입하려면:

app/ui direct DB access 대부분 제거
domain public API 안정화
repository layer 도입 완료
old server/lib 사용처 대부분 제거
production flow별 contract audit 완료
migration candidate 목록 확정
rollback plan 작성 완료
Notes
현재 DB는 “잘못됐다”기보다 기능 추가 과정에서 production flow 중심으로 확장된 상태다.
지금은 DB를 고칠 시점이 아니다.
현재 DB의 복잡함은 repository/mappers 안에 가두고, public/use-case/types는 미래 지향적인 도메인 계약으로 정리한다.
DB schema migration은 코드가 DB 직접 의존에서 분리된 후 진행한다.

허락맡기 전까지 파일 변경하지마 