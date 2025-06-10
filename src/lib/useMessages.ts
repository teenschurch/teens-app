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
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/AuthContext"
import type { Message, UserPresence } from "@/lib/types"

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { user } = useAuth()

  // Listen to messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(100))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Ensure createdAt is properly handled
            createdAt: data.createdAt || { toDate: () => new Date() },
          }
        }) as Message[]

        // Reverse to show oldest first
        setMessages(messagesData.reverse())
        setLoading(false)
      },
      (error) => {
        console.error("Error listening to messages:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

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
    if (!user || !text.trim()) throw new Error("Invalid message or user")

    setSending(true)
    try {
      await addDoc(collection(db, "messages"), {
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
    if (!user) throw new Error("User must be authenticated")

    await addDoc(collection(db, "messages"), {
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
