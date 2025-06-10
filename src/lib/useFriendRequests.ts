"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, type Timestamp } from "firebase/firestore"; // Ensured Timestamp is imported
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import type { FriendRequest } from "@/lib/types";

export function useFriendRequests() {
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "friendRequests"),
      where("recipientId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => {
          // Explicitly cast doc.data() to ensure all fields are recognized,
          // and then merge with id. Firestore Timestamps are handled correctly by default.
          const data = doc.data() as Omit<FriendRequest, 'id'>; // Data from Firestore excluding id
          return {
            id: doc.id,
            ...data,
          } as FriendRequest; // Cast to full FriendRequest type
        });
        setPendingRequests(requests);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching friend requests:", error);
        setLoading(false);
      }
    );

    return unsubscribe; // Cleanup subscription on unmount
  }, [user?.uid]);

  return { pendingRequests, loading };
}
