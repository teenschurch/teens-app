"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react" // Added useEffect
import { Send, Smile } from "lucide-react"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Added Firestore imports
import { db } from "@/lib/firebase"; // Added db import

const TYPING_TIMEOUT_MS = 3000; // For stopping typing if no new input

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>
  sending?: boolean
  disabled?: boolean;
  conversationId: string | null; // Added prop
  currentUser: { uid: string; displayName: string | null } | null; // Added prop
}

export default function MessageInput({
  onSendMessage,
  sending = false,
  disabled = false,
  conversationId,
  currentUser,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyMarkedTypingRef = useRef(false);

  // Cleanup on unmount or when conversationId/currentUser changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isCurrentlyMarkedTypingRef.current && conversationId && currentUser?.uid) {
        updateDoc(doc(db, "conversations", conversationId), {
          typingUsers: arrayRemove({ uid: currentUser.uid, displayName: currentUser.displayName || "Anonymous" })
        }).catch(console.error); // Log error if cleanup fails
      }
      isCurrentlyMarkedTypingRef.current = false;
    };
  }, [conversationId, currentUser]);

  const signalTypingStopped = () => {
    if (conversationId && currentUser?.uid && isCurrentlyMarkedTypingRef.current) {
      updateDoc(doc(db, "conversations", conversationId), {
        typingUsers: arrayRemove({ uid: currentUser.uid, displayName: currentUser.displayName || "Anonymous" })
      }).then(() => {
        isCurrentlyMarkedTypingRef.current = false;
      }).catch(console.error);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending || disabled) return; // Check disabled prop too

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isCurrentlyMarkedTypingRef.current && conversationId && currentUser) {
      await updateDoc(doc(db, "conversations", conversationId), { // Ensure this finishes before sending message
        typingUsers: arrayRemove({ uid: currentUser.uid, displayName: currentUser.displayName || "Anonymous" })
      }).then(() => {
        isCurrentlyMarkedTypingRef.current = false;
      }).catch(console.error);
    }

    try {
      await onSendMessage(message.trim())
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentMessage = e.target.value;
    setMessage(currentMessage);

    if (!conversationId || !currentUser?.uid) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (currentMessage.trim()) {
      if (!isCurrentlyMarkedTypingRef.current) {
        updateDoc(doc(db, "conversations", conversationId), {
          typingUsers: arrayUnion({ uid: currentUser.uid, displayName: currentUser.displayName || "Anonymous" })
        }).then(() => {
          isCurrentlyMarkedTypingRef.current = true;
        }).catch(console.error);
      }
      // Set a new timeout to automatically remove user after TYPING_TIMEOUT_MS of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        signalTypingStopped();
      }, TYPING_TIMEOUT_MS);
    } else {
      // If message is empty, immediately signal typing stopped
      signalTypingStopped();
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any).catch(console.error); // handle async errors
    }
  }

  return (
    // Removed the old local isTyping indicator display
    <div className="space-y-2">
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
            disabled={disabled || sending}
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
          disabled={!message.trim() || disabled || sending}
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
