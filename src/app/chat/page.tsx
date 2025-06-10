"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useMessages } from "@/lib/useMessages"
import MessageInput from "@/components/MessageInput"
import MessageList from "@/components/MessageList"
import OnlineUsers from "@/components/OnlineUsers"
import AuthPrompt from "@/components/AuthPrompt"
import { MessageCircle } from "lucide-react"

export default function Chat() {
  const { user } = useAuth()
  const { messages, onlineUsers, sendMessage, sendReaction, loading, sending } = useMessages()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!user) {
    return <AuthPrompt />
  }

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
                <h1 className="text-xl font-bold text-gray-800">Teen Chat</h1>
                <p className="text-sm text-gray-600">
                  {onlineUsers.length} {onlineUsers.length === 1 ? "person" : "people"} online
                </p>
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
                    <MessageList messages={messages} currentUser={user} onReaction={sendReaction} />
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="max-w-4xl mx-auto">
                <MessageInput onSendMessage={sendMessage} sending={sending} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Users Sidebar - Desktop Only */}
      <div className="hidden lg:block w-64 border-l border-gray-200 bg-gray-50">
        <OnlineUsers users={onlineUsers} />
      </div>
    </div>
  )
}
