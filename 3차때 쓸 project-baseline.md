# Project Baseline

## Purpose

이 문서는 현재 프로젝트의 **아키텍처 기준과 리팩토링 규칙을 정의하는 절대 기준 문서**다.

모든 코드 변경은 이 문서를 기준으로 판단한다.  
이 문서를 위반하는 변경은 허용되지 않는다.

---

# 1. Architecture Principles

## 1.1 Layered Architecture

프로젝트는 다음 구조를 따른다:

```txt
app / ui
  ↓
modules/{domain}/public
  ↓
use-cases
  ↓
repositories / policies / services / mappers
  ↓
Supabase (DB / Storage)
1.2 Layer Responsibilities
app (src/app)
routing / page composition / layout만 담당
DB 접근 금지
domain 내부 구현 import 금지
반드시 public layer만 사용
허용: modules/post/public/get-post
금지: modules/post/server/get-post-by-id
modules/{domain}

각 도메인은 다음 구조를 따른다:

public/
use-cases/
repositories/
policies/
services/
mappers/
types/
ui/
public
외부(app, 다른 domain)에서 사용하는 유일한 진입점
domain contract 정의
내부 구현 노출 금지
use-cases
하나의 기능 단위 실행 로직
여러 repository/policy/service를 조합
비즈니스 흐름 담당
repositories
DB 접근 전담
Supabase 접근은 여기서만 가능
다른 레이어에서 직접 DB 접근 금지
policies
권한 / 접근 제어 / 상태 판단
pure function 중심
services
domain 내부 로직 (비즈니스 계산)
side-effect 없는 로직
mappers
DB row → domain object 변환
domain object → DB payload 변환
types
domain contract (input / output / entity)
ui
React UI 컴포넌트
domain logic 최소화
workflows
여러 domain을 연결하는 orchestration layer
cross-domain 로직만 존재
2. Core Rules (절대 규칙)
2.1 DB Access Rule
DB 접근은 repository에서만 허용

금지:

supabase.from(...)

허용:

postRepository.getPostById(...)
2.2 Import Boundary Rule
app / ui → public만 접근 가능
public → use-case만 접근
use-case → repository/policy/service만 접근

금지:

app → modules/post/server/*
domain → 다른 domain의 server/*
2.3 Domain Isolation Rule
domain은 독립적으로 유지되어야 한다
cross-domain 호출은 public을 통해서만
2.4 Shared Rule
shared는 진짜 공통 로직만
domain-specific 로직 shared에 두지 않는다
3. Refactor Rules
3.1 Zero Behavior Change

리팩토링 중에는:

- return shape 변경 금지
- error behavior 변경 금지
- permission 변경 금지
- UI behavior 변경 금지
3.2 Old + New Coexistence
old 구조 + new 구조 공존 허용
기존 코드를 즉시 삭제하지 않는다
점진적으로 전환한다
3.3 One Brief Rule
1 brief = 1 목적 = 1 변경 단위

금지:

큰 리팩토링 한 번에 수행
3.4 Small Diff Rule
변경 범위는 최소화
한 번에 하나의 책임만 변경
3.5 Verification Rule

모든 변경 후:

- critical flow 동작 확인
- 에러 없음 확인
- UI 정상 확인
3.6 Rollback Rule
모든 변경은 rollback 가능해야 한다
위험 발생 시 즉시 이전 상태로 복귀
4. DB Rules (현재 Phase)
4.1 금지
- schema 변경 금지
- RLS 변경 금지
- SQL migration 금지
- table/column rename 금지
- function/trigger 변경 금지
- storage policy 변경 금지
4.2 허용
- DB 접근 코드 이동 (repository)
- mapper 추가
- policy/service 분리
5. Naming Rules

다음 domain naming을 사용한다:

creator
user
profile
subscription
post
media
message
payment
payout
notification
admin

파일 규칙:

일반 파일: kebab-case
React 컴포넌트: PascalCase
6. Migration Strategy
Phase 1: Audit
- production flow 분석
- DB usage 분석
Phase 2: Code Architecture Migration
- public/use-case/repository 구조 도입
- DB 직접 의존 제거
- old 제거
Phase 3: DB Migration
- schema 개선
- relation 정리
- index/RLS 개선
7. Critical Systems (주의 영역)

다음 영역은 매우 높은 위험도를 가진다:

- payment
- payout
- auth
- media storage
- post access / visibility

이 영역은:

초기 리팩토링 대상에서 제외하거나
public boundary만 먼저 생성
8. Refactor Execution Order

권장 순서:

1. post interactions (post_blocks, likes, comments)
2. post public wrappers
3. media public boundary
4. post access/visibility
5. feed/read model
6. creator/profile
7. message
8. subscription
9. payment
10. payout
11. admin
9. Final Goal
- 모든 app/ui는 public만 사용
- 모든 DB 접근은 repository로 제한
- domain 간 의존성 최소화
- production flow 안정성 유지
10. One-line Principle
"직접 접근하지 말고, 요청하라"

(DB, domain, storage 모두 동일)

허락맡기 전까지 파일 변경하지마 