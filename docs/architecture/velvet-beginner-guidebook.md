# Velvet Beginner Guidebook

초급 개발자를 위한 Velvet 프로젝트 이해서

Last updated: 2026-06-22

## 0. 이 문서의 목적

이 문서는 Velvet 코드를 처음 읽는 사람이 프로젝트의 작동 원리를 이해하기 위한 안내서다.

Velvet은 단순한 게시판 앱이 아니다. SNS, 크리에이터 페이지, 구독, PPV 결제, 메시지, 미디어 업로드, 알림, 신고/모더레이션, 정산, analytics가 모두 들어간 creator platform이다. 그래서 처음 보면 파일이 많고, 어디서 시작해야 할지 감이 안 올 수 있다.

이 문서의 목표는 세 가지다.

1. Velvet이 어떤 큰 구조로 생겼는지 이해한다.
2. 사용자의 한 행동이 어떤 코드 흐름으로 처리되는지 따라간다.
3. 나중에 엔지니어가 붙었을 때 어떤 규칙으로 작업해야 하는지 알 수 있게 한다.

## 1. 한 문장으로 보는 Velvet

Velvet은 **Next.js App Router + Supabase 기반의 creator SNS 플랫폼**이고, 내부 구조는 향후 MSA로 분리하기 쉽도록 **modular monolith** 형태로 정리되어 있다.

조금 풀어서 말하면:

- 사용자는 회원가입, 로그인, 프로필 생성, 크리에이터 전환을 한다.
- 크리에이터는 글, 이미지, 영상, 스토리, 유료 콘텐츠를 만든다.
- 팬은 구독하거나 PPV 콘텐츠를 구매한다.
- 메시지, 알림, 신고, 모더레이션, 정산이 뒤따른다.
- 이 모든 기능은 하나의 Next.js 앱 안에 있지만, 내부적으로는 여러 도메인 모듈로 나뉘어 있다.

## 2. 가장 큰 지도

프로젝트의 핵심 폴더는 다음과 같다.

```txt
src/
  app/              Next.js 페이지와 API route
  modules/          도메인별 비즈니스 코드
  workflows/        여러 모듈을 엮는 긴 업무 흐름
  infrastructure/   Supabase 같은 외부 인프라 연결
  shared/           공용 UI, 공용 lib, observability
  server/           middleware 등 서버 공통 코드

supabase/
  migrations/       DB schema migration

scripts/
  audit/build/check/rebuild 계열 스크립트

docs/
  architecture, runbooks, incidents, SLO 등 문서
```

처음 읽을 때 가장 중요한 폴더는 `src/app`과 `src/modules`다.

`src/app`은 사용자가 실제로 들어오는 입구다. URL 페이지, API endpoint가 여기 있다.

`src/modules`는 실제 제품 로직이 들어 있는 곳이다. auth, post, media, payment, payout 같은 도메인이 각각 모듈로 나뉘어 있다.

## 3. Next.js App Router 입구

Velvet은 Next.js App Router 구조를 쓴다.

예:

```txt
src/app/feed/page.tsx
src/app/post/[postId]/page.tsx
src/app/api/post/create/route.ts
src/app/api/payment/confirm/route.ts
```

파일 이름의 의미:

- `page.tsx`: 브라우저에서 보는 페이지
- `layout.tsx`: 여러 페이지를 감싸는 공통 레이아웃
- `route.ts`: API endpoint
- `actions.ts`: 서버 액션 또는 page에서 쓰는 action

예를 들어 사용자가 `/feed`에 들어오면 Next.js는 `src/app/feed/page.tsx`를 실행한다.

사용자가 글 작성 API를 호출하면 `src/app/api/post/create/route.ts`의 `POST` 함수가 실행된다.

## 4. Modular Monolith란 무엇인가

Velvet은 아직 여러 서버로 쪼개진 MSA가 아니다. 하나의 앱, 하나의 배포 단위 안에서 돌아간다.

하지만 내부 코드는 MSA처럼 나누려고 한다.

이런 방식을 modular monolith라고 부른다.

중요한 생각은 이거다.

> 지금은 하나의 앱으로 빠르게 개발하되, 나중에 auth, media, payment, notification 같은 모듈을 독립 서비스로 뗄 수 있게 경계를 만들어둔다.

그래서 Velvet의 `src/modules` 아래에는 도메인별 폴더가 많다.

```txt
src/modules/auth
src/modules/identity
src/modules/profile
src/modules/creator
src/modules/post
src/modules/story
src/modules/media
src/modules/message
src/modules/payment
src/modules/subscription
src/modules/entitlement
src/modules/ledger
src/modules/payout
src/modules/notification
src/modules/moderation
src/modules/report
src/modules/feed
src/modules/search
src/modules/analytics
src/modules/events
```

각 모듈은 자기 책임을 가진다.

예:

- `auth`: 로그인, 세션, 인증
- `identity`: 계정 상태, 온보딩, 성인 인증, 프로필 authority
- `creator`: 크리에이터 정보와 readiness
- `post`: 게시물, 댓글, 좋아요, 접근 정책
- `media`: 이미지/영상 파일, storage, media binding
- `payment`: 결제 생성/확인/환불
- `subscription`: 구독 상태
- `entitlement`: 누가 무엇에 접근할 수 있는지 결정
- `ledger`: 돈의 흐름을 회계 장부처럼 기록
- `payout`: 크리에이터 정산
- `events`: domain event와 outbox
- `notification`: 알림 생성/읽음/전달

## 5. 모듈 내부 레이어 읽는 법

대부분의 모듈은 비슷한 레이어 이름을 가진다.

```txt
src/modules/post/
  public/
  contracts/
  runtime/
  repositories/
  policies/
  services/
  mappers/
  ui/
  events/
  projections/
```

각 레이어의 의미는 다음과 같다.

| Layer | 의미 |
| --- | --- |
| `public` | 다른 모듈이나 app이 호출해도 되는 공식 입구 |
| `contracts` | 외부에 노출해도 되는 타입, 이벤트, 계약 |
| `runtime` | 실제 use case 실행 흐름 |
| `repositories` | DB나 storage를 직접 읽고 쓰는 코드 |
| `policies` | 비즈니스 규칙, 판단 로직 |
| `services` | 특정 작업을 돕는 도메인 서비스 |
| `mappers` | DB row를 화면/도메인 모델로 바꾸는 코드 |
| `ui` | React UI 컴포넌트 |
| `events` | 이 모듈에서 발생시키는 domain event |
| `projections` | read model을 다시 만드는 코드 |

초급 개발자가 기억할 가장 중요한 규칙:

> 다른 모듈을 부를 때는 가능하면 `public` 또는 `contracts`만 import한다.

나쁜 방향:

```ts
import { something } from "@/modules/payment/repositories/..."
```

좋은 방향:

```ts
import { confirmPayment } from "@/modules/commerce/public/payment-contract"
```

단, 현재 코드에는 아직 과거 리팩토링 흔적과 남은 예외가 있다. 그래서 이 문서는 “목표 구조”와 “현재 상태”를 함께 이해하기 위한 문서다.

## 6. 요청 하나가 처리되는 기본 흐름

Velvet에서 대부분의 요청은 이런 흐름을 탄다.

```txt
Browser
  -> src/app page 또는 api route
  -> module/public facade
  -> module/runtime use case
  -> module/policies, services
  -> module/repositories
  -> Supabase DB 또는 Storage
  -> domain event/outbox
  -> worker/consumer/projection/notification
```

좀 더 쉽게 말하면:

1. 사용자가 버튼을 누른다.
2. Next.js page나 API route가 실행된다.
3. route는 인증을 확인하고 입력값을 검증한다.
4. route는 도메인 모듈의 public function을 호출한다.
5. runtime/use case가 실제 비즈니스 로직을 처리한다.
6. repository가 DB에 읽기/쓰기를 한다.
7. 필요하면 event/outbox를 남긴다.
8. 나중에 worker가 알림, projection, analytics 같은 후속 작업을 처리한다.

## 7. Supabase 연결 방식

Velvet은 Supabase를 주요 DB/Auth/Storage로 쓴다.

중요 파일:

```txt
src/infrastructure/supabase/server.ts
src/infrastructure/supabase/admin.ts
src/infrastructure/supabase/client.ts
```

`server.ts`는 현재 요청의 cookie를 기반으로 Supabase server client를 만든다.

주로 로그인한 사용자의 권한으로 DB를 읽거나 auth session을 확인할 때 쓴다.

`admin.ts`는 `SUPABASE_SERVICE_ROLE_KEY`를 사용한다. 이 client는 강력한 권한을 가지므로 repository나 서버 전용 코드에서 조심해서 써야 한다.

개념적으로:

```txt
Browser/client UI
  -> public anon key

Server route/runtime
  -> request cookie 기반 server client

Repository/admin operation
  -> service role client
```

초급 개발자 주의:

- service role key는 절대 브라우저로 나가면 안 된다.
- `supabaseAdmin`은 서버 코드에서만 써야 한다.
- repository가 DB 접근을 감싸는 이유는 DB 접근을 한 곳에 모으기 위해서다.

## 8. Auth, Identity, Profile 차이

처음 보면 `auth`, `identity`, `profile`, `user`가 헷갈릴 수 있다.

간단히 나누면:

| Module | 담당 |
| --- | --- |
| `auth` | 로그인, 세션, Supabase auth user |
| `identity` | 계정 lifecycle, 온보딩 readiness, 성인 인증, trust state |
| `profile` | 사용자 프로필 화면/수정 |
| `user` | legacy 또는 사용자 row 관련 일부 runtime |

예를 들어 `/feed` 페이지는 다음을 확인한다.

1. 세션이 있는가
2. 계정이 active 상태인가
3. PASS 인증이 필요한가
4. 온보딩이 완료되었는가

이런 체크가 여러 모듈에 나뉘어 있는 이유는, 나중에 인증 서비스와 계정/프로필 서비스를 분리할 수 있게 하기 위해서다.

## 9. Feed 페이지 흐름 예시

파일:

```txt
src/app/feed/page.tsx
```

대략 흐름:

```txt
/feed 요청
  -> readSession()
  -> requireActiveSession()
  -> assertPassVerified()
  -> readOnboardingReadinessRuntime()
  -> getCreatorByUserId()
  -> getHomeFeed()
  -> getPublicUpcomingPosts()
  -> getRecommendedCreators()
  -> getStories()
  -> FeedComposer, StoryList, FeedInfiniteList 렌더링
```

이 페이지는 Velvet의 “홈 타임라인”에 가깝다.

여기서 중요한 점:

- 인증/온보딩 체크를 먼저 한다.
- feed, search, story, creator 데이터를 모아서 화면을 만든다.
- 현재는 일부 runtime 직접 import가 남아 있다.
- 목표 구조에서는 page가 runtime이 아니라 각 모듈의 public facade를 호출하는 것이 좋다.

## 10. 글 작성 흐름

대표 파일:

```txt
src/app/api/post/create/route.ts
src/workflows/create-post-with-media-workflow.ts
src/modules/post/public/create-post.ts
src/modules/post/runtime/create-post.ts
src/modules/media/public/*
```

개념 흐름:

```txt
사용자가 글 작성
  -> /api/post/create
  -> requireSession()
  -> creator 조회
  -> profile 조회
  -> 가격/공개 범위 검증
  -> createPostWithMediaWorkflow()
  -> post 생성
  -> media binding
  -> 필요하면 moderation 또는 event 발생
```

여기서 `workflow`가 중요한 역할을 한다.

`post` 모듈은 게시물 자체를 잘 안다. `media` 모듈은 파일과 storage를 잘 안다. 글 작성은 둘을 함께 써야 하므로 workflow가 중간에서 조율한다.

좋은 workflow의 특징:

- 여러 모듈의 public facade를 조합한다.
- 한 모듈의 repository를 다른 모듈이 직접 만지지 않게 한다.
- 실패했을 때 보상 처리나 rollback 방향을 알 수 있게 한다.

## 11. Media 흐름

Media는 이미지, 영상, 파일, 스토리 비디오 같은 자산을 다룬다.

주요 책임:

- upload signed URL 발급
- Supabase storage 업로드/다운로드
- media asset 기록
- post/story/message와 media binding
- story video processing job
- moderation용 media 다운로드
- secure serving authorization

대표 폴더:

```txt
src/modules/media/public
src/modules/media/runtime
src/modules/media/repositories
src/modules/media/services
src/modules/media/workers
```

중요한 개념:

`media asset`은 파일 자체에 대한 기록이다.

`binding`은 그 파일이 어디에 붙어 있는지를 나타낸다.

예:

```txt
media asset: abc.jpg 파일
post media binding: 이 파일이 post 123에 붙어 있음
story media binding: 이 파일이 story 456에 붙어 있음
message media binding: 이 파일이 message 789에 붙어 있음
```

이렇게 나누면 같은 media 시스템을 post, story, message가 공유할 수 있다.

## 12. 결제 흐름

대표 파일:

```txt
src/app/api/payment/confirm/route.ts
src/modules/commerce/public/payment-contract.ts
src/modules/payment/runtime/execute-payment-confirmation.ts
src/modules/payment/services/payment-confirmation-service.ts
src/modules/ledger/public/*
src/modules/entitlement/public/*
```

개념 흐름:

```txt
사용자가 결제 완료
  -> /api/payment/confirm
  -> requireSession()
  -> confirmPayment()
  -> payment 상태 succeeded로 확정
  -> 콘텐츠/구독 권한 부여
  -> ledger transaction 기록
  -> notification/event/outbox 후속 처리
```

결제에서 중요한 질문은 세 가지다.

1. 돈이 실제로 결제되었는가
2. 사용자가 무엇을 구매했는가
3. 구매 후 어떤 접근 권한이 열려야 하는가

그래서 payment 혼자 끝나지 않고 entitlement와 ledger로 이어진다.

## 13. Entitlement란 무엇인가

Entitlement는 “누가 무엇에 접근할 수 있는가”를 판단하는 모듈이다.

예:

- A 사용자는 B 크리에이터를 구독 중인가
- A 사용자는 paid post 123을 구매했는가
- A 사용자는 message attachment를 볼 수 있는가

Subscription은 구독 상태를 안다. Payment는 결제 상태를 안다. Post는 게시물 visibility를 안다.

하지만 최종 접근 판단이 여기저기 흩어지면 위험하다.

그래서 목표 구조에서는 entitlement가 접근 권한의 중심이 된다.

```txt
subscription/payment 이벤트
  -> entitlement grant 생성
  -> evaluate access
  -> post/message/media 접근 허용 또는 거부
```

현재 코드는 entitlement shadow evaluate와 grant 구조가 들어와 있지만, 일부 모듈은 아직 entitlement repository를 직접 호출한다. 앞으로는 public facade로 감싸는 것이 좋다.

## 14. Ledger란 무엇인가

Ledger는 돈의 흐름을 장부처럼 기록하는 모듈이다.

Payment는 “결제가 성공했다”를 안다.

Payout은 “크리에이터에게 정산한다”를 안다.

Ledger는 “돈이 어디서 어디로 이동했는지”를 더 낮은 수준에서 기록한다.

예:

```txt
사용자 결제 성공
  -> ledger transaction 생성
  -> platform revenue entry
  -> creator payable entry

크리에이터 정산 요청
  -> ledger hold 생성

정산 완료
  -> ledger payout transaction 생성
```

이 구조가 중요한 이유:

- 돈 관련 버그를 추적하기 쉽다.
- payment/payout/subscription이 서로 다른 말을 할 때 ledger로 reconciliation할 수 있다.
- 나중에 금융/정산 시스템을 독립 서비스로 뗄 수 있다.

## 15. Notification과 Outbox

초기 앱은 보통 이런 식으로 알림을 만든다.

```txt
post like 처리 중 createNotification() 직접 호출
```

작은 앱에서는 편하지만, 플랫폼이 커지면 문제가 된다.

- 알림 실패 때문에 원래 기능이 실패할 수 있다.
- 같은 알림이 중복될 수 있다.
- 나중에 알림 시스템을 분리하기 어렵다.

Velvet의 목표 구조는 event/outbox 기반이다.

```txt
원본 동작 발생
  -> domain event 기록
  -> outbox event 기록
  -> worker가 event 소비
  -> notification 생성
```

주요 파일:

```txt
src/modules/events/runtime/write-domain-event-with-outbox.ts
src/modules/events/runtime/outbox-consumer-runner.ts
src/modules/events/handlers/*
src/modules/notification/consumers/*
src/modules/notification/workers/*
```

쉽게 말하면:

> 중요한 일이 생기면 “일이 생겼다”는 기록을 남기고, 후속 작업은 worker가 나중에 처리한다.

## 16. Projection과 Read Model

SNS에서 feed/search/dashboard는 매우 자주 읽힌다.

매번 여러 테이블을 join해서 화면을 만들면 느려지고 복잡해진다.

그래서 projection/read model을 만든다.

Projection은 화면이 빠르게 읽을 수 있도록 미리 정리해둔 데이터다.

예:

```txt
post + creator + media + visibility
  -> feed item projection

creator + profile + stats
  -> creator public card

payment + payout + subscription
  -> dashboard snapshot
```

관련 폴더:

```txt
src/modules/post/projections
src/modules/search/projections
src/modules/creator/projections
src/modules/analytics/projections
src/modules/projection/runtime
scripts/rebuild-projections.ts
scripts/check-projection-drift.ts
```

중요한 개념:

- source table은 원본이다.
- projection은 빠른 조회용 사본이다.
- drift는 원본과 projection이 어긋나는 현상이다.
- rebuild는 원본을 기준으로 projection을 다시 만드는 작업이다.

## 17. Moderation, Report, Governance

Velvet은 유료 콘텐츠와 사용자 생성 콘텐츠를 다루기 때문에 신고/모더레이션이 중요하다.

관련 모듈:

```txt
src/modules/report
src/modules/moderation
src/modules/governance
```

대략 역할:

- `report`: 사용자가 신고를 제출하고 조회하는 흐름
- `moderation`: 신고/콘텐츠 심사 queue와 처리
- `governance`: 정책 결정, audit log, trust safety action

이 영역은 제품이 실제로 런칭되면 기술보다 운영 정책이 더 중요해진다.

초기에는 다음을 명확히 해야 한다.

- 어떤 콘텐츠를 금지할 것인가
- 신고가 들어오면 누가 본다
- 제재 기준은 무엇인가
- 복구/이의 제기 흐름은 있는가
- 미성년자/성인 인증 정책은 어떻게 처리하는가

## 18. Admin 영역

관리자 기능은 `src/app/admin/*`와 `src/modules/admin/*`에 있다.

관리자 기능은 운영자가 실제로 매일 보는 도구다.

예:

- 사용자 조회
- 크리에이터 조회
- 신고/모더레이션 queue
- 정산 요청 조회
- ban/unban
- analytics 확인

초기 런칭에서 admin은 화려할 필요는 없지만, 문제를 추적하고 수동 조치할 수 있어야 한다.

## 19. Workflows

`src/workflows`는 여러 모듈을 엮는 긴 업무 흐름을 담는다.

현재 예:

```txt
src/workflows/create-post-with-media-workflow.ts
src/workflows/create-user-signup-workflow.ts
src/workflows/process-video-moderation.ts
src/workflows/subscription/handle-subscription-created.ts
src/workflows/subscription/notify-subscription-canceled-workflow.ts
```

workflow가 필요한 이유:

- 하나의 모듈만으로 끝나지 않는 업무가 있다.
- 예를 들어 회원가입은 auth, user, profile, identity를 함께 건드릴 수 있다.
- 글 작성은 post와 media를 함께 건드릴 수 있다.
- 구독 생성은 subscription, entitlement, notification, analytics로 이어질 수 있다.

좋은 workflow는 orchestration만 한다. 너무 많은 세부 DB 로직을 workflow에 넣으면 다시 큰 파일이 된다.

## 20. UI 컴포넌트 위치

공용 UI는 `src/shared/ui`에 있다.

예:

```txt
src/shared/ui/Button.tsx
src/shared/ui/Card.tsx
src/shared/ui/Avatar.tsx
src/shared/ui/EmptyState.tsx
```

도메인 전용 UI는 각 모듈의 `ui` 폴더에 있다.

예:

```txt
src/modules/post/ui/PostCard.tsx
src/modules/feed/ui/FeedInfiniteList.tsx
src/modules/story/ui/StoryViewer.tsx
src/modules/auth/ui/SignInForm.tsx
```

읽는 순서:

1. page 파일에서 어떤 UI를 import하는지 본다.
2. 해당 UI 컴포넌트가 props로 어떤 데이터를 받는지 본다.
3. 그 데이터가 어떤 public/runtime 함수에서 오는지 따라간다.

## 21. 타입과 계약 읽는 법

TypeScript 프로젝트에서 타입은 지도 역할을 한다.

초급 개발자는 구현보다 타입을 먼저 읽으면 도움이 된다.

예:

```txt
src/modules/post/types.ts
src/modules/payment/contracts/*
src/modules/events/contracts/domain-event-envelope.ts
src/modules/media/contracts/*
```

타입을 읽을 때 질문:

- 이 도메인에서 중요한 entity는 무엇인가
- status 값은 어떤 것들이 있는가
- public function이 무엇을 입력받고 무엇을 반환하는가
- event payload에는 어떤 필드가 들어가는가

## 22. 에러와 관측 가능성

Velvet에는 observability 관련 파일이 있다.

```txt
src/shared/observability
docs/observability
docs/runbooks
docs/incidents
docs/slo
```

초기에는 모든 것을 완벽히 관측할 필요는 없다.

하지만 다음 영역은 꼭 추적 가능해야 한다.

- 결제 성공/실패
- 권한 부여 실패
- 미디어 업로드 실패
- 메시지 전송 실패
- 정산 요청/승인/실패
- outbox consumer 실패
- moderation job 실패

운영에서 중요한 질문:

> 사용자가 “돈 냈는데 안 보여요”라고 말하면, 어떤 로그와 테이블을 보면 원인을 찾을 수 있는가?

## 23. 자주 보는 명령어

```bash
npm run typecheck
npm run build
npm run boundary:audit
npm run projection:rebuild:dry
npm run projection:drift
```

현재 주의할 점:

```bash
npm run boundary:check
```

이 명령은 현재 `scripts/check-boundaries.mjs`가 없어 실패한다. boundary gate를 실제 CI에 쓰려면 고쳐야 한다.

## 24. 초급 개발자를 위한 코드 읽기 순서

처음부터 모든 파일을 읽으려고 하면 힘들다. 아래 순서로 읽는 것을 추천한다.

### Step 1. 앱 입구 읽기

```txt
src/app/page.tsx
src/app/feed/page.tsx
src/app/post/[postId]/page.tsx
src/app/api/post/create/route.ts
src/app/api/payment/confirm/route.ts
```

질문:

- 이 페이지/API는 어떤 모듈을 부르는가
- 인증을 어디서 확인하는가
- 화면에 필요한 데이터는 어디서 가져오는가

### Step 2. Auth와 session 이해

```txt
src/modules/auth/public
src/modules/auth/runtime
src/infrastructure/supabase/server.ts
```

질문:

- 로그인한 사용자는 어떻게 확인하는가
- session과 userId는 어디서 오는가
- 인증 실패 시 어디로 redirect하는가

### Step 3. Post 생성 읽기

```txt
src/app/api/post/create/route.ts
src/workflows/create-post-with-media-workflow.ts
src/modules/post/public
src/modules/post/runtime
src/modules/post/repositories
```

질문:

- 글 작성 시 어떤 값이 필요한가
- visibility와 price는 어떻게 검증하는가
- media는 어떻게 연결되는가

### Step 4. Payment와 Entitlement 읽기

```txt
src/app/api/payment/confirm/route.ts
src/modules/commerce/public/payment-contract.ts
src/modules/payment
src/modules/entitlement
src/modules/ledger
```

질문:

- 결제 성공 후 무엇이 바뀌는가
- 접근 권한은 어디서 열리는가
- 돈의 흐름은 어디에 기록되는가

### Step 5. Events와 Notification 읽기

```txt
src/modules/events
src/modules/notification
```

질문:

- 어떤 event type이 있는가
- outbox worker는 어떤 일을 하는가
- 알림은 직접 생성되는가, event를 통해 생성되는가

### Step 6. Admin과 운영 문서 읽기

```txt
src/app/admin
src/modules/admin
docs/runbooks
docs/incidents
docs/slo
```

질문:

- 운영자가 문제를 어떻게 확인하는가
- 수동 복구가 필요한 상황은 무엇인가

## 25. 현재 구조에서 특히 알아야 할 미완성 지점

이 프로젝트는 많이 정리되었지만 완벽히 끝난 상태는 아니다.

초급 개발자가 혼란스러워하지 않도록 현재 남은 지점을 명확히 적는다.

1. 일부 `src/app` 파일이 아직 모듈 `runtime`을 직접 import한다.
2. 일부 모듈이 다른 모듈의 `repositories`를 직접 import한다.
3. `boundary:audit`는 통과하지만 `src/app`/`src/workflows` blind spot이 있다.
4. `boundary:check` script는 현재 깨져 있다.
5. critical path smoke test suite가 아직 충분하지 않다.
6. entitlement와 ledger는 골격이 있으나 모든 access/financial decision이 완전히 중앙화되었다고 보기는 이르다.

이건 프로젝트가 실패했다는 뜻이 아니다. 오히려 다음 작업 목록이 명확하다는 뜻이다.

## 26. 좋은 변경을 하는 법

새 기능을 만들 때는 아래 순서로 생각한다.

1. 이 기능은 어느 모듈의 책임인가
2. 외부에서 호출해야 한다면 `public`에 입구를 만든다
3. 실제 실행 흐름은 `runtime`에 둔다
4. DB 접근은 `repositories`에 둔다
5. 판단 규칙은 `policies`에 둔다
6. 화면용 변환은 `mappers`에 둔다
7. 후속 작업이 있으면 event/outbox를 고려한다
8. 다른 모듈의 내부 파일을 직접 import하지 않는다

예:

유료 메시지 구매 기능을 고친다고 하자.

관련 모듈은:

- `message`: 메시지와 첨부
- `payment`: 결제
- `entitlement`: 접근 권한
- `notification`: 알림
- `ledger`: 돈의 흐름

이때 message runtime에서 payment repository를 직접 부르면 안 좋다. 대신 payment 또는 commerce public facade를 통해 요청해야 한다.

## 27. 코드 리뷰할 때 보는 체크리스트

PR을 볼 때 다음을 확인한다.

- `src/app`이 모듈 `runtime/repositories/services`를 직접 import하지 않는가
- 한 모듈이 다른 모듈의 `repositories`를 직접 import하지 않는가
- service role client가 client component로 새지 않는가
- 결제/정산/권한 변경에 audit/event 로그가 있는가
- 실패했을 때 사용자에게 어떤 응답이 나가는가
- 중복 요청이 들어와도 idempotent한가
- projection을 쓰는 화면에서 source table join을 다시 만들지 않았는가
- 타입은 public contract로 충분히 표현되는가
- critical path라면 smoke/integration test가 있는가

## 28. 주요 사용자 플로우 요약

### 회원가입/온보딩

```txt
sign-up page/API
  -> auth
  -> identity/profile/user
  -> onboarding readiness
  -> dashboard/feed 접근
```

### 크리에이터 전환

```txt
become-creator
  -> auth session 확인
  -> creator profile 생성
  -> identity creator authority
  -> creator dashboard 접근
```

### 피드 보기

```txt
feed page
  -> auth/session/pass/onboarding
  -> feed read model
  -> stories
  -> recommended creators
  -> post cards 렌더링
```

### 포스트 생성

```txt
post create API
  -> creator/profile 확인
  -> post 생성
  -> media binding
  -> moderation/event/projection 후속 처리
```

### PPV 구매

```txt
checkout
  -> payment 생성
  -> provider 결제
  -> payment confirm
  -> entitlement grant
  -> ledger transaction
  -> notification/event
```

### 구독

```txt
subscription checkout/confirm
  -> subscription active
  -> creator membership grant
  -> feed/access 변화
  -> notification/analytics
```

### 메시지

```txt
conversation/message API
  -> conversation access 확인
  -> message 저장
  -> media attachment binding
  -> message outbox/domain event
  -> notification
```

### 정산

```txt
payout request
  -> creator balance 확인
  -> ledger hold
  -> payout request row
  -> admin approve/send
  -> payout terminal state
  -> ledger payout transaction
```

### 신고/모더레이션

```txt
report submit
  -> report case
  -> moderation queue/governance action
  -> target content/user action
  -> audit/event/notification
```

## 29. DB를 볼 때의 사고방식

DB 테이블을 볼 때는 “어느 모듈의 소유인가”를 먼저 생각한다.

예:

- 결제 row는 payment 소유
- 구독 row는 subscription 소유
- 접근 grant는 entitlement 소유
- ledger transaction/entry는 ledger 소유
- post row는 post 소유
- media asset/binding은 media 소유
- notification row는 notification 소유

다른 모듈의 테이블을 직접 읽고 싶어질 수 있다. 하지만 목표 구조에서는 public read facade나 projection을 통해 읽어야 한다.

이 규칙이 중요한 이유:

> 나중에 payment DB를 독립 서비스로 옮겨도 post 코드가 깨지지 않게 하기 위해서다.

## 30. 런칭 전 최소 이해 목표

이 프로젝트를 운영하거나 엔지니어와 대화하려면 최소한 아래 질문에 답할 수 있으면 좋다.

1. 로그인한 사용자의 `userId`는 어디서 가져오는가
2. `/feed`는 어떤 데이터를 모아서 렌더링하는가
3. 글 작성 API는 어떤 검증을 하고 어떤 workflow를 호출하는가
4. 유료 콘텐츠 권한은 payment, subscription, entitlement 중 어디서 결정되는가
5. 결제 성공 후 ledger와 entitlement에 어떤 변화가 생기는가
6. 알림은 직접 생성되는가, event/outbox를 거치는가
7. media file과 post/story/message binding은 어떻게 다르게 저장되는가
8. projection은 왜 필요한가
9. 정산 요청에서 ledger hold는 왜 필요한가
10. boundary law가 왜 중요한가

이 10개에 답할 수 있으면, Velvet의 핵심 원리는 꽤 이해한 것이다.

## 31. 앞으로 이 문서를 확장하는 방법

이 문서는 첫 번째 가이드북이다. 앞으로 다음 문서를 추가하면 더 좋아진다.

- `flow-post-create.md`: 글 작성 플로우를 코드 라인 단위로 추적
- `flow-payment-entitlement-ledger.md`: 결제, 권한, 장부 플로우
- `flow-media-upload.md`: 미디어 업로드와 signed URL
- `flow-message-notification.md`: 메시지와 알림 outbox
- `db-ownership-map.md`: 테이블별 소유 모듈 표
- `launch-qa-checklist.md`: 런칭 전 수동 QA 체크리스트

## 32. 마지막으로

Velvet은 파일 수가 많고 도메인이 넓어서 처음에는 어렵게 느껴지는 것이 정상이다.

하지만 큰 원리는 단순하다.

```txt
app은 입구다.
module은 책임이다.
public은 공식 문이다.
runtime은 실행이다.
repository는 DB다.
event/outbox는 후속 작업이다.
projection은 빠른 조회다.
entitlement는 접근 권한이다.
ledger는 돈의 장부다.
```

이 문장을 기억하고 코드를 보면 훨씬 덜 무섭다.

