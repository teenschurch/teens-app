"use client"

import { useState, useEffect } from "react"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  doc,
  setDoc,
  deleteDoc,
  writeBatch, // Added writeBatch
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/AuthContext"
import type { Message, UserPresence } from "@/lib/types"

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { user } = useAuth()

  // Listen to messages
  useEffect(() => {
    if (!user || !conversationId) { // Added null check for user.uid for safety
      setMessages([])
      setLoading(false)
      return () => {} // Return an empty function if no active listener
    }

    setLoading(true)
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "desc"),
      limit(100),
    )

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => { // Made async
        const messagesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt, // Assuming createdAt is always a Timestamp from Firestore
          } as Message; // Cast to Message, ensuring data matches type
        });

        // Mark messages as read
        if (user?.uid && conversationId) { // Ensure user and conversationId are valid
          const batch = writeBatch(db);
          let updatesMade = 0;
          messagesData.forEach((message) => {
            // Check if message is from another user and not already read by current user
            if (message.userId !== user.uid && (!message.readBy || !message.readBy[user.uid])) {
              const messageRef = doc(db, "conversations", conversationId, "messages", message.id);
              batch.update(messageRef, {
                [`readBy.${user.uid}`]: serverTimestamp(), // Use serverTimestamp for consistency
              });
              updatesMade++;
            }
          });

          if (updatesMade > 0) {
            try {
              await batch.commit();
              console.log(`Successfully marked ${updatesMade} messages as read in conversation ${conversationId}.`);
            } catch (commitError) {
              console.error("Error committing read receipts batch:", commitError);
            }
          }
        }

        // Reverse to show oldest first (UI preference)
        setMessages(messagesData.slice().reverse()); // Use slice() to avoid mutating messagesData if it's used elsewhere before reverse
        setLoading(false);
      },
      (error) => {
        console.error(`Error listening to messages for conversation ${conversationId}:`, error);
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user, conversationId]) // Add conversationId to dependencies

  // Listen to online users
  useEffect(() => {
    const q = query(collection(db, "presence"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Ensure lastSeen is properly handled
            lastSeen: data.lastSeen || { toDate: () => new Date() },
          }
        }) as UserPresence[]

        setOnlineUsers(usersData)
      },
      (error) => {
        console.error("Error listening to presence:", error)
      },
    )

    return unsubscribe
  }, [])

  // Set user presence when they join chat
  useEffect(() => {
    if (!user) return

    const setPresence = async () => {
      const presenceRef = doc(db, "presence", user.uid)
      await setDoc(presenceRef, {
        userId: user.uid,
        displayName: user.displayName || "Anonymous",
        lastSeen: serverTimestamp(),
        isOnline: true,
      })
    }

    setPresence()

    // Remove presence when user leaves
    return () => {
      if (user) {
        const presenceRef = doc(db, "presence", user.uid)
        deleteDoc(presenceRef).catch(console.error)
      }
    }
  }, [user])

  // Update presence periodically
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      const presenceRef = doc(db, "presence", user.uid)
      await setDoc(
        presenceRef,
        {
          userId: user.uid,
          displayName: user.displayName || "Anonymous",
          lastSeen: serverTimestamp(),
          isOnline: true,
        },
        { merge: true },
      )
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const sendMessage = async (text: string) => {
    if (!user || !text.trim() || !conversationId) {
      console.warn("Cannot send message: no user, text, or conversationId")
      return
    }

    setSending(true)
    try {
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        text: text.trim(),
        userId: user.uid,
        displayName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        type: "text",
      })
    } finally {
      setSending(false)
    }
  }

  const sendReaction = async (messageId: string, emoji: string) => {
    if (!user || !conversationId) {
      console.warn("Cannot send reaction: no user or conversationId")
      return
    }

    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      text: emoji,
      userId: user.uid,
      displayName: user.displayName || "Anonymous",
      createdAt: serverTimestamp(),
      type: "reaction",
      replyTo: messageId,
    })
  }

  return {
    messages,
    onlineUsers,
    sendMessage,
    sendReaction,
    loading,
    sending,
  }
}
