"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useMessages } from "@/lib/useMessages"
import { useConversations } from "@/lib/useConversations" // Added
import MessageInput from "@/components/MessageInput"
import MessageList from "@/components/MessageList"
// import OnlineUsers from "@/components/OnlineUsers"; // Replaced by ConversationList
import ConversationList from "@/components/ConversationList" // Added
import AuthPrompt from "@/components/AuthPrompt"
import { MessageCircle } from "lucide-react"

export default function Chat() {
  const { user } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null) // Added
  const { messages, onlineUsers, sendMessage, sendReaction, loading, sending } =
    useMessages(selectedConversationId) // Modified
  const { conversations: allConversations } = useConversations() // Added for header

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!user) {
    return <AuthPrompt />
  }

  const selectedConversation = selectedConversationId
    ? allConversations.find((c) => c.id === selectedConversationId)
    : null

  let chatTitle = "Teen Chat" // Default title
  let chatSubtitle = `${onlineUsers.length} ${onlineUsers.length === 1 ? "person" : "people"} online`

  if (selectedConversation && user) {
    const otherParticipant = selectedConversation.participantDetails?.find(
      (p) => p.uid !== user.uid,
    )
    chatTitle = otherParticipant?.displayName || "Direct Message"
    chatSubtitle = "In conversation" // Or more specific like "Last active..."
  } else if (selectedConversationId) {
    // If a conversation is selected but details are not yet loaded (or it's a new one not in allConversations yet)
    chatTitle = "Direct Message"
    chatSubtitle = "Loading details..."
  }

  const typingUserDisplay = selectedConversation?.typingUsers
    ?.filter(typingUser => typingUser.uid !== user.uid) // Exclude current user
    ?.map(typingUser => typingUser.displayName || "Someone")
    .join(", ");

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{chatTitle}</h1>
                <p className="text-sm text-gray-600">{chatSubtitle}</p>
              </div>
            </div>

            {/* Online indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 hidden md:inline">Live</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <>
                    <MessageList
                      messages={messages}
                      currentUser={user}
                      onReaction={sendReaction}
                      conversationParticipants={selectedConversation?.participantDetails}
                    />
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="max-w-4xl mx-auto">
                <MessageInput
                  onSendMessage={sendMessage}
                  sending={sending}
                  onSendMessage={sendMessage}
                  sending={sending}
                  disabled={!selectedConversationId || sending}
                  conversationId={selectedConversationId} // Pass conversationId
                  currentUser={user} // Pass currentUser
                />
                {typingUserDisplay && selectedConversationId && (
                  <div className="text-xs text-gray-500 pt-1 pl-2 h-4">
                    {typingUserDisplay} {selectedConversation.typingUsers && selectedConversation.typingUsers.filter(tu => tu.uid !== user.uid).length > 1 ? "are" : "is"} typing...
                  </div>
                )}
                {!typingUserDisplay && selectedConversationId && (
                  <div className="h-4"></div> // Placeholder to prevent layout shift
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation List Sidebar - Desktop Only */}
      <div className="hidden lg:block w-64 border-l border-gray-200 bg-gray-50">
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>
    </div>
  )
}
