"use client"

import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { Heart, Smile, ThumbsUp, PlayIcon as Pray } from "lucide-react"
import type { Message, User, Conversation } from "@/lib/types" // Added Conversation for participant details type

interface MessageListProps {
  messages: Message[]
  currentUser: User
  onReaction: (messageId: string, emoji: string) => Promise<void>
  conversationParticipants?: Conversation["participantDetails"]; // Added prop
}

const reactionEmojis = [
  { emoji: "❤️", icon: Heart, label: "Love" },
  { emoji: "😊", icon: Smile, label: "Smile" },
  { emoji: "👍", icon: ThumbsUp, label: "Like" },
  { emoji: "🙏", icon: Pray, label: "Pray" },
]

export default function MessageList({
  messages,
  currentUser,
  onReaction,
  conversationParticipants,
}: MessageListProps) {
  const [showReactions, setShowReactions] = useState<string | null>(null)

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-500 text-lg mb-2">Welcome to Teen Chat!</p>
        <p className="text-gray-400">Start the conversation and connect with your church family</p>
      </div>
    )
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await onReaction(messageId, emoji)
      setShowReactions(null)
    } catch (error) {
      console.error("Error sending reaction:", error)
    }
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.userId === currentUser.uid
        const showAvatar = index === 0 || messages[index - 1].userId !== message.userId
        const isReaction = message.type === "reaction"

        if (isReaction) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{message.displayName}</span> reacted {message.text}
                {message.createdAt && (
                  <span className="ml-2 opacity-70">
                    {formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          )
        }

        return (
          <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isOwnMessage ? "order-2" : "order-1"}`}>
              <div className="flex items-end space-x-2">
                {/* Avatar */}
                {!isOwnMessage && showAvatar && (
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {(message.displayName || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {!isOwnMessage && !showAvatar && <div className="w-8" />}

                <div className="flex-1">
                  {/* Message bubble */}
                  <div
                    className={`relative group rounded-2xl px-4 py-3 ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-red-500 to-yellow-400 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                    onDoubleClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                  >
                    {!isOwnMessage && showAvatar && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{message.displayName || "Anonymous"}</p>
                    )}
                    <p className="text-sm md:text-base break-words">{message.text}</p>

                    {/* Reaction button */}
                    <button
                      onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                      className={`absolute -bottom-2 ${isOwnMessage ? "left-2" : "right-2"} opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-1 shadow-md`}
                      title="React"
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Reaction picker */}
                  {showReactions === message.id && (
                    <div className={`mt-2 flex space-x-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div className="bg-white rounded-full shadow-lg p-2 flex space-x-1">
                        {reactionEmojis.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            onClick={() => handleReaction(message.id, reaction.emoji)}
                            className="hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
                            title={reaction.label}
                          >
                            <span className="text-lg">{reaction.emoji}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                    {message.createdAt
                      ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })
                      : "Just now"}
                    {isOwnMessage && (
                      <span className="ml-1">
                        {(() => {
                          const otherUserIds = (conversationParticipants || [])
                            .filter(p => p.uid !== currentUser.uid)
                            .map(p => p.uid);

                          if (otherUserIds.length === 0 && message.userId === currentUser.uid) {
                            // Message sent in a "chat with self" or if participant details are missing
                            return "✓"; // Simple sent indicator
                          }

                          const isReadByAllOthers = otherUserIds.length > 0 &&
                            otherUserIds.every(uid => message.readBy && message.readBy[uid]);

                          if (isReadByAllOthers) {
                            return <span className="text-blue-500">✓✓ Seen</span>;
                          } else {
                            return "✓ Sent";
                          }
                        })()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
