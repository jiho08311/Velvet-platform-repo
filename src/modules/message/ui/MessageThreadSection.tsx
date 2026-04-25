"use client"

import { useState } from "react"
import { MessageComposerSection } from "./MessageComposerSection"
import { MessageList } from "./MessageList"
import {
  mergeConversationMessageListItems,
  toConversationMessageListItem,
  type ConversationMessageItem,
  type ConversationMessageListItem,
} from "@/modules/message/types"

type MessageThreadSectionProps = {
  conversationId: string
  currentUserId: string
  reportPathname: string
  initialMessages: ConversationMessageListItem[]
}

export function MessageThreadSection({
  conversationId,
  currentUserId,
  reportPathname,
  initialMessages,
}: MessageThreadSectionProps) {
  const [messages, setMessages] = useState(initialMessages)

  function handleMessageSent(message: ConversationMessageItem) {
    const nextMessage = toConversationMessageListItem({
      message,
      currentUserId,
      reportPathname,
    })

    setMessages((currentMessages) =>
      mergeConversationMessageListItems({
        currentMessages,
        nextMessage,
      })
    )
  }

  return (
    <>
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
          <div>
            <p className="text-base font-medium text-white">
              아직 대화가 없습니다
            </p>
            <p className="mt-2 text-sm text-white/60">
              첫 메시지를 보내 대화를 시작해보세요
            </p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      <div className="mt-4 border-t border-white/10 pt-4">
        <MessageComposerSection
          conversationId={conversationId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </>
  )
}
