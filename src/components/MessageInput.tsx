"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Send, Smile } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>
  sending?: boolean
}

export default function MessageInput({ onSendMessage, sending = false }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    try {
      await onSendMessage(message.trim())
      setMessage("")
      setIsTyping(false)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)

    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true)
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="space-y-2">
      {/* Typing indicator */}
      {isTyping && (
        <div className="text-xs text-gray-500 px-2">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
            <span>Typing...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Double-tap messages to react)"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={sending}
            maxLength={500}
          />

          {/* Emoji button */}
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            onClick={() => inputRef.current?.focus()}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="bg-gradient-to-r from-red-500 to-yellow-400 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-yellow-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[80px] justify-center"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span className="hidden md:inline">Send</span>
            </>
          )}
        </button>
      </form>

      {/* Character count */}
      <div className="text-xs text-gray-400 text-right">{message.length}/500</div>
    </div>
  )
}
