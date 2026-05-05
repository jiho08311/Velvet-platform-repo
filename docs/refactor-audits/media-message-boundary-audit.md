# Media ↔ Message Boundary Audit

## Scope

- message domain의 media table / storage 직접 접근을 분석한다.
- runtime behavior 변경 없이 repository/public boundary 전환 범위를 확정한다.

---

# 1. Message Media DB Access

## 1.1 send-message.ts

### Media read (moderation)

- table: `media`
- query:
  - select id, storage_path, mime_type
  - filter: id IN mediaIds

### Media update (attach)

- table: `media`
- query:
  - update message_id = message.id
  - filter: id IN validatedMediaIds

### Media read (response)

- table: `media`
- query:
  - select id, message_id, storage_path, mime_type
  - filter: message_id = message.id
  - order: created_at ASC

---

## 1.2 assert-message-attachment-eligibility.ts

### Media read (attachment validation)

- table: `media`
- query:
  - select id, owner_user_id, post_id, message_id, status, processing_status, moderation_status
  - filter: id IN mediaIds

---

## 1.3 list-messages.ts

### Media read (thread)

- table: `media`
- query:
  - select id, message_id, storage_path, mime_type
  - filter: message_id IN messageIds
  - order: created_at ASC

---

## 1.4 get-secure-message-media.ts

### Media read (single message)

- table: `media`
- query:
  - select id, message_id, storage_path, mime_type
  - filter: message_id = messageId

---

# 2. Message Media Storage Access

## 2.1 send-message.ts (image moderation)

- storage: Supabase bucket
- operation: download
- input: storage_path
- 조건:
  - mime_type startsWith "image/"

### Flow

1. media row 조회
2. storage download
3. arrayBuffer → base64
4. OpenAI moderation

---

# 3. Attachment Eligibility Contract

## 조건

각 media에 대해:

- 존재해야 한다 (row count match)
- owner_user_id === senderId
- post_id === null
- message_id === null
- status === "ready" (if exists)
- processing_status === "ready" (if exists)
- moderation_status === approved 계열

## 실패 시 에러

- Unauthorized
- Invalid message attachment
- Some media files were not found

---

# 4. Message Attach Timing

## Flow

1. message insert
2. message.id 생성
3. media.message_id 업데이트

```txt
media.message_id = message.id


중요
attach는 message 생성 이후 수행
attach 실패 시 전체 실패
5. Image Moderation Behavior
대상
mime_type startsWith "image/"
flow
media 조회
storage download
base64 변환
OpenAI moderation 요청
flagged → throw "IMAGE_BLOCKED"
유지 조건
model: omni-moderation-latest
error message 동일
처리 순서 동일
6. Message Media Response Shape
ConversationMessageMedia
{
  id: string
  url: string
  type: "image" | "video"
  mimeType: string
}
특징
URL은 server에서 생성된 signed URL
UI에서 URL 생성 금지
media는 message 단위 배열
7. Signed URL Generation
위치
createConversationMessageMedia
현재 입력
createMediaSignedUrl({
  storagePath,
  viewerUserId,
  creatorUserId,
  visibility: "paid",
  hasPurchased: true
})
중요
현재 정책은 임시 상태
paid/unlock/access policy의 최종 SoT 아님
변경 금지
8. Identified Problems
8.1 Direct DB access

message/server에서 직접 media table 접근:

send-message.ts
list-messages.ts
get-secure-message-media.ts
assert-message-attachment-eligibility.ts
8.2 Storage access inside message domain
image moderation에서 직접 storage download 수행
8.3 Mixed responsibilities

send-message.ts:

moderation
DB write
media attach
media read
notification

→ 단일 책임 위반

9. Repository Candidates
message-media-repository.ts
후보 함수
findMediaByIds(mediaIds)

findMediaByMessageId(messageId)

findMediaByMessageIds(messageIds)

attachMediaToMessage({
  mediaIds,
  messageId
})

findModerationMediaByIds(mediaIds)
10. Next Wave Scope
wave-019

목표:

media DB 접근 → message-media-repository로 이동

대상 파일:

send-message.ts (partial)
list-messages.ts
get-secure-message-media.ts
assert-message-attachment-eligibility.ts

제외:

storage download
OpenAI moderation
signed URL logic
wave-020

목표:

image moderation storage boundary 분리

대상:

send-message.ts
11. Invariants (절대 유지 조건)
message send behavior 동일
media attach timing 동일
eligibility validation 동일
image moderation 동일
signed URL 동일
response shape 동일
error message 동일

---

# 결론

👉 이 문서가 **wave-019의 절대 기준**이 된다  
👉 여기서 벗어나면 무조건 버그 난다  