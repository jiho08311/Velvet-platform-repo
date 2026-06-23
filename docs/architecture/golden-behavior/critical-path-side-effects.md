# Critical Path Side Effects

Scope: Velvet Perfect Modular Monolith Roadmap execution order #2 only.

Each critical path must verify three things:

1. API status
2. DB row creation or mutation
3. Critical side effect

## Smoke Test Matrix

| Flow                | Route                                                 | API Status | DB Verification                                                                            | Critical Side Effect                                                                                     |
| ------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Post create         | `POST /api/post/create`                               | 200/201    | `posts` row exists for creator; canonical shadow row in `canonical_posts` when enabled     | media binding/post blocks preserved; post is discoverable only according to visibility/moderation policy |
| PPV purchase        | `POST /api/payment/ppv-post`                          | 200/201    | payment state row exists in canonical payment state table                                  | purchaser gains paid post access; creator self-purchase rejected                                         |
| Subscription start  | `POST /api/payment/confirm` or mock confirm           | 200/201    | subscription row/state exists or is updated active                                         | entitlement/subscription access becomes active; activation provenance side effect remains no-throw       |
| Subscription cancel | `POST /api/subscription/cancel`                       | 200        | subscription row/state becomes canceled                                                    | access policy resolves inactive/canceled behavior correctly                                              |
| Message send        | `POST /api/messages/[conversationId]/send`            | 200/201    | message row exists; conversation/message canonical item state updated when enabled         | unread/read/conversation metadata side effects remain consistent                                         |
| Payout request      | `POST /api/payout/request`                            | 200/201    | payout request row/state exists pending                                                    | creator payout lifecycle starts without terminal payout mutation                                         |
| Payout approve      | `POST /api/payout/requests/[payoutRequestId]/approve` | 200        | payout request state becomes approved                                                      | approval governance/audit transition is preserved                                                        |
| Payout paid         | `POST /api/payout/send`                               | 200        | payout terminal state becomes paid/sent                                                    | payout terminal transition records execution side effects                                                |
| Report review       | `POST /api/reports/[reportId]/resolve`                | 200        | report/review state updated; moderation/governance case reflects decision where applicable | report no longer appears as unresolved; policy decision trace remains available                          |
| Notification read   | `POST /api/notifications/[notificationId]/read`       | 200        | `canonical_notification_read_states` row is created or updated to read                     | unread badge/count decreases or excludes the read notification                                           |

## Required Test Naming

Create smoke tests under:

```txt
tests/critical-paths/
  post-create.smoke.test.ts
  ppv-purchase.smoke.test.ts
  subscription-start.smoke.test.ts
  subscription-cancel.smoke.test.ts
  message-send.smoke.test.ts
  payout-request.smoke.test.ts
  payout-approve.smoke.test.ts
  payout-paid.smoke.test.ts
  report-review.smoke.test.ts
  notification-read.smoke.test.ts
```

## Merge Gate

Before merging any refactor PR touching route/runtime/repository boundaries, the following must pass:

```bash
npm test -- --runInBand critical-paths
```

Required PR checklist item:

```txt
- [ ] Critical path smoke tests passed locally or in CI.
- [ ] Golden behavior changed? If yes, docs/architecture/golden-behavior updated.
- [ ] API status, DB mutation, and critical side effects preserved.
```

## Completion Criteria

This step is complete when:

1. `routes-golden-behavior.md` exists.
2. `critical-path-side-effects.md` exists.
3. Each critical route has a documented golden behavior.
4. Each smoke path has API, DB, and side-effect verification targets.
5. PR merge gate strategy is documented.
