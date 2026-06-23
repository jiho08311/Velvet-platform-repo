# module-boundary-law.md

## Scope

Velvet Perfect Modular Monolith Roadmap 실행순서 6~10만 다룬다.

## Boundary Law

모든 모듈은 자기 내부 구현을 외부에 노출하지 않는다.
다른 모듈은 오직 다음 경로만 import할 수 있다.

Allowed:

```ts
@/modules/<module>/public
@/modules/<module>/public/*
@/contracts/*
```

Forbidden:

```ts
@/modules/<module>/runtime/*
@/modules/<module>/repositories/*
@/modules/<module>/services/*
@/modules/<module>/domain/*
@/modules/<module>/application/*
@/modules/<module>/infra/*
```

## 6. 모듈별 허용 import 규칙

같은 모듈 내부에서는 내부 import를 허용한다.

```ts
@/modules/billing/runtime/*
@/modules/billing/repositories/*
@/modules/billing/services/*
```

다른 모듈에서 접근할 때는 public 또는 contracts만 허용한다.

```ts
// allowed
import { createInvoice } from "@/modules/billing/public";
import type { InvoiceId } from "@/contracts/billing";

// forbidden
import { BillingRepository } from "@/modules/billing/repositories/BillingRepository";
import { BillingRuntime } from "@/modules/billing/runtime/BillingRuntime";
import { BillingService } from "@/modules/billing/services/BillingService";
```

## 7. public / contracts 허용 규칙

`@/modules/*/public`은 해당 모듈의 공식 API다.

규칙:

1. public은 외부 모듈이 호출 가능한 함수, 타입, command, query만 export한다.
2. public은 repository, runtime, service 구현체를 export하지 않는다.
3. public의 export는 stable API로 간주한다.
4. cross-module 통신에 필요한 공유 타입은 `/contracts`에 둔다.
5. contracts는 순수 타입, enum, schema, DTO만 포함한다.
6. contracts는 runtime dependency를 갖지 않는다.

## 8. runtime / repositories / services cross-module import 차단

다른 모듈의 내부 실행 계층은 import 금지다.

금지 대상:

```txt
@/modules/*/runtime/**
@/modules/*/repositories/**
@/modules/*/services/**
```

의도:

* runtime은 모듈 실행 조립 책임만 가진다.
* repositories는 persistence 구현 세부사항이다.
* services는 모듈 내부 use-case orchestration이다.
* 외부 모듈은 구현 세부사항 대신 public API를 호출한다.

## 9. 기존 violation allowlist 전략

초기 도입 시 기존 violation은 즉시 제거하지 않고 baseline으로 고정한다.

전략:

1. 현재 violation을 dependency-cruiser JSON 리포트로 추출한다.
2. 추출 결과를 `architecture/module-boundary.allowlist.json`에 저장한다.
3. CI는 allowlist에 이미 존재하는 violation은 warning으로 처리한다.
4. 신규 violation은 error로 처리한다.
5. allowlist 항목은 owner, reason, removalTarget을 반드시 가진다.
6. allowlist는 감소만 허용한다. 증가 PR은 architecture owner 승인을 요구한다.

allowlist 예시:

```json
[
  {
    "from": "src/modules/orders/services/OrderService.ts",
    "to": "src/modules/billing/repositories/BillingRepository.ts",
    "rule": "no-cross-module-internal-import",
    "owner": "orders",
    "reason": "legacy direct billing lookup",
    "removalTarget": "2026-07-31"
  }
]
```

## 10. 신규 violation 발생 시 CI fail

CI는 다음 순서로 수행한다.

1. dependency-cruiser 실행
2. 현재 violation JSON 생성
3. allowlist와 비교
4. allowlist에 없는 violation이 있으면 fail
5. allowlist에만 남고 현재는 사라진 항목은 cleanup 후보로 출력

완료 기준:

* `module-boundary-law.md` 작성
* dependency-cruiser 규칙 추가
* ESLint 보조 규칙 추가
* allowlist JSON 생성 전략 정의
* CI 신규 violation fail 전략 정의
