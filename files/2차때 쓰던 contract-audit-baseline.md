# Contract Audit Baseline

## Audit context
- This project is a creator subscription platform.
- The current task is contract audit only.
- Contract audit means identifying data boundaries, ViewModel candidates, source-of-truth fields, consumers, duplicated fields, legacy fields, and mismatch risks.
- This is not an implementation task.
- This is not a refactor task.
- This is not a performance optimization task.

## Runtime baseline
- Next.js app
- Vercel deploy
- Supabase database/auth/storage
- Railway main service
- Railway worker service
- Redis
- Dockerfile.worker
- worker tsconfig

## Current app surfaces
- about
- account-unavailable
- actions
- admin
- api
- auth
- banned
- become-creator
- creator
- dashboard
- explore-tab
- feed
- forgot-password
- messages
- notifications
- onboarding
- payment
- policy
- post
- privacy
- profile
- reactivate-account
- reset-password
- search
- settings
- sign-in
- sign-up
- story
- subscriptions
- terms
- verify-pass-required
- verify-pass
- youth

## Current module domains
- admin
- analytics
- auth
- creator
- feed
- media
- message
- moderation
- notification
- payment
- payout
- post
- profile
- report
- search
- story
- subscription
- user

## Shared / infra / workflows
- infrastructure/supabase
- server/middleware
- shared/lib
- shared/ui
- workflows/subscription
- process-video-moderation workflow
- create-user-signup workflow
- create-post-with-media workflow

## Current database public tables
- admin_role_assignments
- audit_logs
- comment_likes
- comments
- conversation_participants
- conversations
- creators
- earnings
- media
- messages
- moderation_queue
- moderation_results
- notifications
- payout_accounts
- payout_requests
- payouts
- payments
- post_blocks
- post_likes
- posts
- profiles
- reports
- stories
- story_read_states
- story_video_jobs
- subscriptions

## Critical flows to preserve during audit
- sign up
- sign in
- sign out
- onboarding
- creator page load
- feed load
- explore/search load
- subscribe flow
- payment success
- payment cancel/fail
- subscription access unlock
- subscription cancel
- message conversation load
- message send
- notification create/read
- post create
- media upload
- story create/view
- comment create
- like toggle
- report create
- moderation queue processing
- payout account state
- payout request flow
- creator dashboard analytics
- admin access

## Audit guardrails
- do not edit code
- do not create files
- do not rename files
- do not move files
- do not change imports
- do not change types
- do not modify database schema
- do not modify RLS/policies
- do not redesign auth
- do not redesign payment
- do not optimize performance
- do not refactor during audit
- do not introduce new abstractions
- do not infer missing schema details
- do not assume behavior that is not visible in the files
- mark unknowns explicitly
- separate current facts from recommendations
- separate audit findings from refactor candidates

## Architecture assumptions for audit
- src/app is treated as routing/page composition/layout/route handler surface.
- Domain logic should be identified inside src/modules/{domain}.
- shared is treated as shared UI/util boundary only.
- workflows are treated as cross-domain orchestration boundaries.
- Supabase access may currently exist in server/domain files, but audit must only identify where it exists.
- ViewModels may not yet be explicit in code; audit should discover implicit ViewModel boundaries from source functions and consumers.

## Contract audit focus
For each target ViewModel or contract, identify:
1. source function candidates
2. consumer pages/components
3. current returned shape
4. actual fields used by UI
5. fields grouped by responsibility
6. duplicated fields
7. derived fields
8. legacy/compatibility fields
9. hidden policy or mapping logic
10. source-of-truth candidates
11. mismatch risks
12. refactor brief candidates

## Field responsibility categories
Group fields into these categories when applicable:

### Identity
- ids
- ownership ids
- entity references

### Actor / User / Creator
- creator
- user
- profile
- viewer
- participant

### Render
- content
- media
- blocks
- renderInput
- preview
- thumbnail

### Access / Visibility
- canView
- isLocked
- lockReason
- visibility
- status
- moderation state

### Commerce
- price
- purchaseEligibility
- hasPurchased
- subscription state
- payout/account state where relevant

### Engagement / Interaction
- likesCount
- commentsCount
- viewerHasLiked
- unread count
- read state
- notification state

### Operations / Admin
- readiness
- moderation status
- report status
- admin action eligibility
- payout request eligibility

### Metadata
- createdAt
- updatedAt
- publishedAt
- sort/order fields

## Audit output rules
- Output must be evidence-based.
- If evidence is missing, write “unknown”.
- Do not invent source functions.
- Do not invent consumers.
- Do not invent ViewModel fields.
- Recommendations are allowed only after current facts are listed.
- Refactor candidates are allowed, but implementation code is forbidden.
- Each audit result must include confidence: High / Medium / Low.

## Standard audit result format

# Audit Result: [micro brief name]

## Confirmed sources
- ...

## Confirmed consumers
- ...

## Field usage summary
- ...

## Current shape notes
- ...

## Duplicated / derived / legacy fields
- ...

## Unknown / needs follow-up
- ...

## Mismatch risks
- ...

## Source-of-truth candidates
- ...

## Refactor brief candidates
- ...

## Confidence
- High / Medium / Low

## Next micro-brief
- ...

한국어로 말해, 브리프 줄거니까 기다려, 아직 파일 범위 읽지마