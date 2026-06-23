import {
  failingSmokeHandler,
  notificationShadowHandler,
  profileUpdatedHandler,
  creatorActivatedHandler,
  messageSentNotificationHandler,
  ppvMessagePurchasedEntitlementHandler,
    reportSubmittedModerationCaseHandler,
      trustSafetyActionContentVisibilityHandler,
        trustSafetyActionUserTrustHandler,
          notificationDomainEventConsumerHandler,
         
} from "@/modules/events/handlers"
import { registerEventHandler } from "./event-handler-registry"

import {
  audienceRollupEventHandler,
  contentRollupEventHandler,
  dashboardSnapshotEventHandler,
  revenueRollupEventHandler,
   moderationRollupEventHandler,
} from "@/modules/analytics/public/analytics-event-workers"
let registered = false

export function registerPhase5ShadowHandlers(): void {
  if (registered) return

  registerEventHandler(notificationShadowHandler)
  registerEventHandler(failingSmokeHandler)
  registerEventHandler(profileUpdatedHandler)
  registerEventHandler(creatorActivatedHandler)
  registerEventHandler(messageSentNotificationHandler)
  registerEventHandler(ppvMessagePurchasedEntitlementHandler)
    registerEventHandler(reportSubmittedModerationCaseHandler)
      registerEventHandler(trustSafetyActionContentVisibilityHandler)
        registerEventHandler(trustSafetyActionUserTrustHandler)
          registerEventHandler(notificationDomainEventConsumerHandler)
          registerEventHandler(revenueRollupEventHandler)
          registerEventHandler(revenueRollupEventHandler)
registerEventHandler(dashboardSnapshotEventHandler)
registerEventHandler(revenueRollupEventHandler)
registerEventHandler(audienceRollupEventHandler)
registerEventHandler(dashboardSnapshotEventHandler)
registerEventHandler(contentRollupEventHandler)
  registerEventHandler(moderationRollupEventHandler)


  registered = true
}
