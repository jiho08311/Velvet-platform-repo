# Feed Projection Official Source

Roadmap scope: #25.

The official feed projection sources are:

1. `canonical_feed_items`
   - Official runtime read model source for feed item projections.
   - Search discovery, creator public page, and feed projection readers may depend on this through public read contracts/facades only.

2. `canonical_feed_projection_events`
   - Official projection event and audit source.
   - Used to record projection creation, update, validation, rebuild, and promotion events.

3. `canonical_feed_visibility_projections`
   - Official visibility validation and promotion source.
   - Used for projection surface visibility, promotion safety, and rollback safety checks.

Non-goals in this roadmap step:
- No #26+ writer fanout changes.
- No backfill.
- No event processor rewrite.
- No direct repository exposure through public facades.
