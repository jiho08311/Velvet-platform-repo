# Post Domain Map

## 1. Post CRUD
- create-post.ts
- update-post.ts
- delete-post.ts
- get-post-by-id.ts

## 2. Feed / List
- list-feed-posts.ts
- get-creator-feed.ts
- list-creator-posts.ts
- list-liked-posts.ts
- list-bookmarked-posts.ts

## 3. Blocks
- create-post-blocks.ts
- get-post-blocks.ts

## 4. Media
- get-post-media.ts

## 5. Access / Policy
- can-view-post.ts
- resolve-post-access-state.ts
- enforce-post-visibility.ts
- locked-preview-policy.ts

## 6. Draft / Editor
- normalize-create-post-draft.ts
- post-editor-draft-normalizer.ts
- edit-post-draft-policy.ts

## 7. Moderation
- post-moderation-transition-policy.ts
- resolve-post-mutation-moderation-outcome.ts

## 8. Render / Mapping
- post-render-read-model.ts
- post-render-input.ts

# DB Access Pattern

## posts
- create
- update
- select

## post_blocks
- insert
- select

## post_likes
- select
- insert
- delete

## comments
- select

## media
- select
- delete
- storage 접근

## creators
- select

## subscriptions
- select

# Repository Plan

## post-repository
- getPostById
- createPost
- updatePost
- deletePost
- listFeedPosts
- listCreatorPosts

## post-block-repository
- createPostBlocks
- getPostBlocks

## post-like-repository
- getLikes
- toggleLike

## comment-repository
- listComments

## media-repository
- getPostMedia
- deleteMedia
- uploadMedia

# Phase 2 Entry Rule

## 지금 바로 이동하면 안 되는 것
- payment 연결된 post purchase flow
- media upload/delete flow
- feed read model
- post access/visibility policy
- moderation transition

## 첫 번째 리팩토링 후보
- get-post-blocks.ts
- create-post-blocks.ts

## 이유
- 범위가 작음
- DB table이 post_blocks 하나로 명확함
- UI 영향이 상대적으로 작음
- repository 분리 연습에 적합함