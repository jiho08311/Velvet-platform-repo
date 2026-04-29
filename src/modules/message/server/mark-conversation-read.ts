type MarkConversationReadParams = {
  conversationId: string
  userId: string
}

export async function markConversationRead({
  conversationId: _conversationId,
  userId: _userId,
}: MarkConversationReadParams): Promise<void> {
  /**
   * Read persistence boundary.
   *
   * Current schema does not persist participant-level read timestamps here.
   * This function intentionally does not update messages.read_at and does not
   * update conversation summary unread-state.
   *
   * Keep this call path stable until a dedicated read model is defined.
   */
  return
}
