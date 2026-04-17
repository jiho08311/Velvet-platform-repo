# Current Baseline

## Runtime
- Next.js app
- Vercel deploy
- Supabase database/auth/storage
- Railway main service
- Railway worker service
- Redis
- Dockerfile.worker
- worker tsconfig

## src/app routes
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

## src/modules domains
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

## shared / infra / workflows
- infrastructure/supabase
- server/middleware
- shared/lib
- shared/ui
- workflows/subscription
- process-video-moderation workflow
- create-user-signup workflow
- create-post-with-media workflow

## database public tables
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

## critical production flows
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

## optimization guardrails
- do not change folder structure
- do not move db logic into src/app
- keep domain logic inside src/modules/{domain}
- keep shared only for truly shared ui/utils
- use workflows only for cross-domain flows
- no schema change during optimization
- no rls/policy change during optimization
- no payment flow redesign during optimization
- no auth flow redesign during optimization
- no large refactor during optimization
- optimize one unit at a time
- test after every change
- commit after every verified change
- rollback immediately if critical flow breaks