type MarkConversationReadParams = {
  conversationId: string
  userId: string
}

export async function markConversationRead({
  conversationId: _conversationId,
  userId: _userId,
}: MarkConversationReadParams): Promise<void> {
  // 현재 스키마에서는 participant-level read timestamp를 저장하지 않는다.
  // 읽음 처리 호출 경로만 단일화하고, 실제 persistence는 후속 read model 작업에서 정의한다.
  return
}
