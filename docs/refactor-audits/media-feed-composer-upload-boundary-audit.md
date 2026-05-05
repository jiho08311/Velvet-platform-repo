1. Purpose
FeedComposer upload flow를 media domain boundary 안으로 완전히 정리하기 전,
현재 upload contract / storage path / upload option / return shape를 고정한다.

이 문서는 behavior 변경 없이 다음 implementation wave 범위를 안전하게 확정하기 위한 audit 문서다.
2. Current Upload Flow
FeedComposer
→ uploadFilesDirect()
→ uploadFeedComposerMedia()
→ uploadMedia()
→ buildMediaStoragePath()
→ uploadMediaFileToStorage()
browser direct Supabase upload 없음
media public wrapper 경유 구조
3. Storage Path Contract
purpose: "feed-composer"

storage path:
creator/${now}-${random}${safeExtension}

주의:

post path와 다름

post:
creator/${userId}/posts/...

feed-composer:
creator/${now}-...
4. Upload Option Contract
bucket:
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

options:
cacheControl: "3600"
contentType: file.type || undefined
upsert: false

error behavior:

upload 실패 시 throw
5. Return Shape Contract
CreatePostUploadedMediaInput[]

각 item:

{
  path
  type
  mimeType
  size
  originalName
}

type resolve:

image/* → image
video/* → video
audio/* → audio
else → file
6. Feed → Post 연결 Contract
createFeedPostAction({
  text
  visibility
  userId
  files: CreatePostUploadedMediaInput[]
})

주의:

files shape 변경 금지
7. Boundary 상태 분석
현재 상태
FeedComposer → media/public/upload-feed-composer-media
(OK)

하지만 내부:

public → server 직접 호출 존재
해석
외부 boundary는 깨끗함
내부 dependency는 아직 old + new coexistence 상태
8. Decision
- 새로운 public wrapper 필요 없음
- storage path 변경 필요 없음
- upload option 변경 필요 없음
- return shape 변경 금지
9. Next Implementation Wave Scope
wave-030 - feed composer upload boundary cleanup

목표:

upload-feed-composer-media 내부 server dependency 정리 여부 판단
(단, behavior 변경 없이)
10. Forbidden (다음 wave에서도 유지)
storage path 변경 금지
upload option 변경 금지
return shape 변경 금지
createFeedPostAction contract 변경 금지
FeedComposer UI 변경 금지
✅ 최종 상태
Files Changed:
- None

Behavior Changed:
- None

Verification:
- FeedComposer upload flow 분석 완료
- storage path contract 확정
- upload option 확정
- return shape 확정
- post 연결 contract 확인
- media boundary 상태 분석 완료

Issues:
- upload-feed-composer-media 내부 server direct import 존재
- media 내부 dependency 완전 분리는 아직 아님

Progress Update Needed:
- No
🔥 한줄 결론
FeedComposer upload는 이미 public boundary 위에 올라와 있고,
이번 wave는 “구조를 바꾸는 단계”가 아니라
“절대 깨지면 안 되는 contract를 고정하는 단계”다.