# Velvet Execution Roadmap Refactor Assessment

Date: 2026-06-22
Scope: `Velvet_Perfect_Modular_Monolith_Execution_Roadmap_v1.0.docx` 대비 현재 repository 상태 점검

## Executive Verdict

전체 평가는 **B / 72점**입니다.

리팩토링은 방향성이 매우 좋습니다. 기존 `server/lib` 중심 구조에서 `public`, `contracts`, `runtime`, `repositories`, `policies`, `mappers`, `events`, `workers`, `projections` 레이어를 갖춘 modular monolith 형태로 크게 이동했습니다. `npm run typecheck`와 권한 상승 환경의 `npm run build`도 통과했습니다.

다만 “로드맵 1~114를 모두 완료했다”고 보기에는 이릅니다. 특히 로드맵의 핵심 완료 기준인 **API/App route의 runtime 직접 호출 제거**, **repository 격리**, **CI boundary gate**, **critical path smoke test**가 아직 완전히 닫히지 않았습니다. 현재 `npm run boundary:audit`는 `0 violations`를 보고하지만, 이 스크립트는 `src/app`과 `src/workflows`를 source module로 분류하지 않아 가장 중요한 App/API direct import를 놓칩니다.

## Verification Summary

| Check | Result | Meaning |
| --- | ---: | --- |
| `npm run typecheck` | Pass | TypeScript level regression 없음 |
| `npm run build` | Pass | production build 성공. sandbox에서는 Turbopack port binding 제약으로 실패했으나 권한 상승 실행에서 성공 |
| `npm run boundary:audit` | Pass, 0 violations | `src/modules/*` 간 public/contracts 경계는 스크립트 기준으로 통과 |
| `npm run boundary:check` | Fail | `package.json`이 삭제된 `scripts/check-boundaries.mjs`를 참조 |
| App/API runtime import grep | Fail | `src/app`/`src/workflows`에 runtime 직접 import 26건 존재 |
| Broader strict scan | Risk | app/workflow 및 cross-module internal import 후보 272건 탐지 |
| Test inventory | Weak | traceability test는 있으나 로드맵이 요구한 critical path smoke test suite는 확인되지 않음 |

## Phase Assessment

| Phase | Score | Status | Assessment |
| --- | ---: | --- | --- |
| Phase 0. Baseline Freeze | 45% | Partial | architecture docs와 golden behavior 문서는 있으나 critical path smoke test 10개, rollback gate, test command는 부족 |
| Phase 1. Boundary Law Automation | 55% | Partial | `module-boundary-law.md`, audit script, baseline 파일은 있음. 그러나 `boundary:check`가 깨져 있고 audit blind spot 존재 |
| Phase 2. Public Facade Extraction | 75% | Mostly done | 대부분 모듈에 `public` facade가 생겼고 API 다수가 전환됨. 하지만 app/API/workflow runtime 직접 import가 남음 |
| Phase 3. Repository Isolation | 55% | Partial | 기존 high-risk pair 다수는 줄었으나 `payment -> entitlement/repositories`, `payout/feed/post -> ledger/search/post repositories` 등 직접 repository 접근이 남음 |
| Phase 4. Projection First | 65% | Partial | projection/rebuild/drift 구조가 생김. 그러나 feed/runtime이 post/search/entitlement repositories를 직접 읽는 구간이 있어 “projection-only hot path”라고 단정하기 어려움 |
| Phase 5. Events/Outbox | 70% | Mostly done | `events` module, domain envelope, outbox runner, handlers, replay runner가 존재. 단 API가 events/runtime을 직접 호출하는 곳과 handler의 타 모듈 repository 직접 접근이 남음 |
| Phase 6. Entitlement | 60% | Partial | entitlement module과 schema가 있고 shadow evaluate가 도입됨. 그러나 subscription/payment이 entitlement repository를 직접 호출하는 구간이 남아 source-of-truth 전환은 진행 중 |
| Phase 7. Ledger | 60% | Partial | ledger module, double-entry policy, hold/transaction/reconciliation 코드가 존재. 하지만 payout/payment read path가 ledger repositories를 직접 참조하고 migration 가시성이 약함 |
| Phase 8. Flow-by-flow Migration | 70% | Mostly done | auth, identity, media, moderation, payment, payout, post, subscription 등 대부분 flow가 새 topology로 이동 |
| Phase 9. Hardening/Observability | 50% | Partial | observability/runbook/SLO 문서는 있으나 smoke/integration test와 operational metric enforcement는 약함 |
| Phase 10. MSA Extraction Rehearsal | 35% | Early | extraction rehearsal 문서/게이트는 일부 있으나 실제로 한 모듈을 독립 추출 가능한 상태로 검증했다고 보기 어려움 |

## What Went Well

1. **구조적 이동 폭이 큽니다.**
   거의 모든 주요 도메인에 `public`, `runtime`, `repositories`, `policies`, `mappers` 계층이 생겼습니다. 이는 로드맵의 “MSA-ready modular monolith” 방향과 잘 맞습니다.

2. **기존 HIGH boundary violation의 큰 덩어리는 줄었습니다.**
   현재 audit script 기준으로 `src/modules` 간 direct internal violation은 0입니다. 특히 예전 `server/lib` 파일들이 대량 제거되고 facade 중심으로 이동한 점은 좋은 신호입니다.

3. **타입과 production build는 살아 있습니다.**
   대규모 리팩토링 이후 `tsc --noEmit`과 `next build`가 통과한 것은 중요한 성과입니다.

4. **Projection/Event/Outbox/Entitlement/Ledger의 골격이 실제 코드로 존재합니다.**
   문서만 작성한 수준이 아니라 `events`, `entitlement`, `ledger`, `projection`, analytics workers, notification consumers가 실제 구현되어 있습니다.

## Main Gaps

1. **Boundary audit가 실제 완료도를 과대평가합니다.**
   `scripts/audit-cross-module-runtime-dependencies.mjs`는 `moduleInfo(file)`가 없는 파일을 건너뛰므로 `src/app`와 `src/workflows`의 runtime 직접 import를 잡지 못합니다. 그런데 로드맵 Phase 2의 핵심은 바로 API/App에서 runtime 직접 호출을 제거하는 것입니다.

   남은 예:
   - `src/app/feed/page.tsx` -> `feed/runtime`, `search/runtime`, `story/runtime`
   - `src/app/search/page.tsx` -> `search/runtime`
   - `src/app/api/feed/route.ts` -> `feed/runtime`
   - `src/app/api/story-read/route.ts` -> `story/runtime`
   - `src/workflows/create-user-signup-workflow.ts` -> `auth/user/profile runtime`

2. **`boundary:check`가 깨져 있습니다.**
   `package.json`은 `scripts/check-boundaries.mjs`를 실행하지만 해당 파일은 삭제된 상태입니다. 즉 CI gate로 쓰려면 현재 바로 실패합니다.

3. **Repository isolation은 아직 부분 완료입니다.**
   strict scan 기준으로 cross-module repository 접근 후보가 남아 있습니다. 대표적으로:
   - `src/modules/payment/services/payment-confirmation-service.ts` -> `entitlement/repositories`
   - `src/modules/subscription/runtime/*` -> `entitlement/repositories`
   - `src/modules/payout/runtime/*` -> `ledger/repositories`, `ledger/policies`
   - `src/modules/feed/runtime/get-home-feed-runtime.ts` -> `post/search/entitlement repositories`
   - `src/modules/post/runtime/list-public-upcoming-posts.ts` -> `search/repositories`

4. **Smoke test safety harness가 부족합니다.**
   traceability tests는 존재하지만 로드맵이 요구한 `Post create`, `PPV purchase`, `subscription start/cancel`, `message send`, `payout request/approve/paid`, `report review`, `notification read` 같은 critical path smoke suite는 확인되지 않습니다. `package.json`에도 `test` script가 없습니다.

5. **Projection-only / snapshot-only 완료 판정은 아직 이릅니다.**
   projection 구조는 생겼지만 hot path가 완전히 projection/read model만 읽는지는 파일 수준에서 확정되지 않습니다. 특히 feed runtime의 타 모듈 repository 직접 read는 Phase 4 완료 기준과 충돌합니다.

## Roadmap Backlog Completion

| Backlog | Assessment |
| --- | --- |
| P0-001 Module boundary law | Done |
| P0-002 Boundary audit to CI | Partial. audit exists, CI/check script broken |
| P0-003 Auth public session facade | Done |
| P0-004 API auth/runtime migration | Mostly done, but API runtime imports still exist in other modules |
| P0-005 App auth/runtime migration | Mostly done for auth, but app still imports other runtime layers |
| P0-006 Analytics public dashboard facade | Done/Partial. facade exists, snapshot path exists |
| P0-007 Feed/search/story public read facade | Partial. public files exist, app still imports runtime |
| P0-008 Stop repository-to-repository imports | Partial |
| P0-009 Critical path smoke tests | Not done or not wired |
| P1-001 Event envelope | Done |
| P1-002 Outbox tables/writer | Mostly done in code; migration coverage should be rechecked |
| P1-003 Feed projection rebuild job | Done/Partial |
| P1-004 Search documents projection | Done/Partial |
| P1-005 Creator public cards | Done/Partial |
| P1-006 Analytics dashboard snapshots | Done/Partial |
| P1-007 Notification fanout to consumers | Mostly done |
| P1-008 Projection drift checker | Done |
| P2-001 Entitlement skeleton | Done |
| P2-002 Access grants tables | Done |
| P2-003 Move access decision to entitlement | Partial/shadow |
| P2-004 Shadow ledger module | Done |
| P2-005 PaymentConfirmed -> ledger | Partial |
| P2-006 Payout holds/releases -> ledger | Partial |
| P3-001 Silent failure observability | Partial |
| P3-002 Event replay jobs | Done/Partial |
| P3-003 Contract tests for public facades | Weak |
| P3-004 Module DB ownership matrix | Not clearly present |
| P3-005 Notification extraction rehearsal | Not proven |

## Recommended Next Fixes

1. **Fix boundary tooling first.**
   Either restore `scripts/check-boundaries.mjs` or change `boundary:check` to the current audit script. Then update the audit script to include `src/app`, `src/app/api`, and `src/workflows` as boundary source zones.

2. **Close the remaining App/API runtime imports.**
   Create or use public facades for feed/search/story/profile/user/payout/ledger/events and switch the remaining 26 runtime imports.

3. **Move cross-module repository access behind public contracts.**
   Prioritize financial/access paths: `payment/subscription -> entitlement`, `payout -> ledger`, `feed/post -> search/projection`.

4. **Add the missing critical path smoke test suite.**
   Add a `test` script and start with route-level smoke tests for the exact flows listed in Phase 0.

5. **Add projection/source drift gates.**
   Keep `projection:rebuild:dry` and `projection:drift`, but make their expected pass/fail behavior visible in CI.

## Final Assessment

이 리팩토링은 “많이 진행된 것처럼 보이는” 수준을 넘어서 실제로 구조적 기반을 상당히 만들었습니다. 특히 public facade, events/outbox, entitlement, ledger, projection 계층이 코드로 존재하고 production build가 통과한다는 점은 매우 긍정적입니다.

하지만 로드맵의 완료 기준은 더 엄격합니다. 현재 상태는 **Phase 0~8을 넓게 구현했지만, Phase 1~4의 gate가 완전히 닫히지 않은 상태**입니다. 따라서 “전체 완료”보다는 **대규모 1차 리팩토링 완료, hardening 및 gate closure 단계 진입**으로 보는 것이 정확합니다.
