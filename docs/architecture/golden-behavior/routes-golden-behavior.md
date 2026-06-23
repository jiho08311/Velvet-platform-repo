# Routes Golden Behavior

Scope: Velvet Perfect Modular Monolith Roadmap execution order #2 only.

This document freezes current golden behavior for critical routes before refactoring.

## Critical Routes

| Flow                | Route                                                | Method | Golden Behavior                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Post create         | `/api/post/create`                                   |   POST | Authenticated creator creates a post through `createPostWithMediaWorkflow`. A row is created in `posts`; canonical shadow write may create/update `canonical_posts`. Media blocks/bindings are attached when provided. |
| PPV purchase        | `/api/payment/ppv-post`                              |   POST | Viewer starts or completes post PPV purchase. Creator cannot purchase own post. Successful payment flow must produce payment state and grant post access.                                                              |
| Subscription start  | `/api/payment/confirm` / `/api/payment/mock/confirm` |   POST | Payment confirmation activates or upserts subscription state through payment confirmation service and subscription runtime.                                                                                            |
| Subscription cancel | `/api/subscription/cancel`                           |   POST | Authenticated subscriber cancels owned active subscription. Subscription state becomes `canceled`; access behavior follows subscription state policy.                                                                  |
| Message send        | `/api/messages/[conversationId]/send`                |   POST | Authenticated user sends a message in an eligible conversation. Message row is persisted and conversation read/update side effects are maintained.                                                                     |
| Payout request      | `/api/payout/request`                                |   POST | Creator requests payout. Payout request state is created and remains pending until approval/rejection.                                                                                                                 |
| Payout approve      | `/api/payout/requests/[payoutRequestId]/approve`     |   POST | Admin approves pending payout request. Approval transition must be recorded.                                                                                                                                           |
| Payout paid         | `/api/payout/send`                                   |   POST | Approved payout is transitioned to terminal paid/sent state through payout terminal runtime.                                                                                                                           |
| Report review       | `/api/reports/[reportId]/resolve`                    |   POST | Report is resolved/reviewed. Review state is persisted and governance/report read model reflects reviewed status.                                                                                                      |
| Notification read   | `/api/notifications/[notificationId]/read`           |   POST | Notification read state is updated for the owning recipient. Unread badge/count should no longer include the notification.                                                                                             |

## Route Inventory Reference

Observed route handlers include:

* `POST /api/post/create`
* `POST /api/payment/ppv-post`
* `POST /api/payment/confirm`
* `POST /api/payment/mock/confirm`
* `POST /api/subscription/cancel`
* `POST /api/messages/[conversationId]/send`
* `POST /api/payout/request`
* `POST /api/payout/requests/[payoutRequestId]/approve`
* `POST /api/payout/send`
* `POST /api/reports/[reportId]/resolve`
* `POST /api/notifications/[notificationId]/read`

## Golden Behavior Rules

1. Route refactors must not change successful status semantics unless explicitly approved.
2. Route refactors must not remove DB writes listed in critical side-effect documentation.
3. Route refactors must not bypass canonical shadow/state tables where currently used.
4. Route refactors must preserve authorization and ownership checks.
5. Any changed route behavior requires an updated smoke test and explicit PR note.
