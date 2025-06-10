"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import type { Conversation, User } from "@/lib/types"; // Ensure User is imported if needed by useAuth

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setConversations([]); // Clear conversations if no user
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            participants: data.participants || [],
            participantDetails: data.participantDetails || [],
            lastMessage: data.lastMessage
              ? {
                  text: data.lastMessage.text || "",
                  senderId: data.lastMessage.senderId || "",
                  createdAt: data.lastMessage.createdAt || Timestamp.now(),
                }
              : undefined,
            updatedAt: data.updatedAt || Timestamp.now(),
          } as Conversation;
        });
        setConversations(convData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]); // Depend on user.uid to re-run if user changes

  return { conversations, loading };
}
