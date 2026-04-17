# Production Test Checklist

## Auth
- [o] Sign up works
- [o] Sign in works
- [o] Sign out works
- [o] Session persists after refresh

## Onboarding
- [o] New user onboarding flow works

## Creator
- [o] Creator page loads
- [o] Creator profile data correct

## Feed / Explore
- [o] Feed loads
- [o] Explore loads
- [o] No broken posts

## Subscription / Payment
- [o] Start subscription
- [o] Payment success flow
- [?] Payment cancel flow
- [o] Subscription status updates
- [o] Cancel subscription

## Access Control
- [o] Locked content (no subscription)
- [o] Unlocked content (with subscription)

## Post / Media
- [ ] Post create
- [ ] Media upload
- [ ] Post render

## Story
- [ ] Story create
- [ ] Story view
- [ ] Story read state updates

## Social
- [o] Comment create
- [o] Like toggle
- [o] Post interaction works

## Message
- [o] Conversation list loads
- [o] Send message works

## Notification
- [ ] Notification created
- [ ] Notification read works

## Moderation (CRITICAL)
- [ ] Upload triggers moderation queue
- [ ] Worker processes job
- [ ] Result stored correctly

## Payment / Payout
- [ ] Creator earnings visible
- [ ] Payout account state correct
- [ ] Payout request flow works

## Admin / Report
- [ ] Report create
- [ ] Admin access works

## System
- [ ] No console errors
- [ ] No API 500 errors
- [ ] Mobile layout works