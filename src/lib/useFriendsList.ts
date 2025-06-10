"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, type Timestamp } from "firebase/firestore"; // Ensured Timestamp is imported
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import type { Friend } from "@/lib/types"; // Friend type should be defined

export function useFriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setFriends([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const friendsRef = collection(db, "users", user.uid, "friends");
    // Order friends by displayName alphabetically, or by friendSince for recent first.
    const q = query(
      friendsRef,
      orderBy("displayName", "asc")
      // Alternatively, to order by when they became friends (most recent first):
      // orderBy("friendSince", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const friendsData = snapshot.docs.map((doc) => {
          // The Friend type has 'uid' which is the document ID in the 'friends' subcollection.
          // The document data itself contains displayName, photoURL, friendSince.
          // We expect doc.id to be the friend's UID.
          // The Friend interface expects: uid, displayName, photoURL, friendSince.
          // doc.data() will give displayName, photoURL, friendSince. uid should be doc.id.
          const data = doc.data();
          return {
            uid: doc.id, // Friend's UID is the document ID
            displayName: data.displayName,
            photoURL: data.photoURL,
            friendSince: data.friendSince, // This should be a Firestore Timestamp
          } as Friend;
        });
        setFriends(friendsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching friends list:", error);
        setLoading(false);
      }
    );

    return unsubscribe; // Cleanup subscription on unmount
  }, [user?.uid]);

  return { friends, loading };
}
