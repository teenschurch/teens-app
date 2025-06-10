import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FriendRequest } from "@/lib/types";

/**
 * Checks if two users are already friends.
 * Assumes friendship is stored in users/{userId}/friends/{otherUserId}
 */
export async function checkFriendshipStatus(currentUserId: string, otherUserId: string): Promise<boolean> {
  if (!currentUserId || !otherUserId) {
    console.warn("checkFriendshipStatus: currentUserId or otherUserId is missing.");
    return false;
  }
  try {
    const friendRef = doc(db, "users", currentUserId, "friends", otherUserId);
    const friendSnap = await getDoc(friendRef);
    return friendSnap.exists();
  } catch (error) {
    console.error("Error checking friendship status:", error, { currentUserId, otherUserId });
    return false; // Return false on error
  }
}

/**
 * Checks for an existing pending friend request between two users.
 * Returns the request document (with its ID) if found, otherwise null.
 */
export async function getExistingFriendRequest(currentUserId: string, otherUserId: string): Promise<(FriendRequest & { id: string }) | null> {
  if (!currentUserId || !otherUserId) {
    console.warn("getExistingFriendRequest: currentUserId or otherUserId is missing.");
    return null;
  }

  const requestsRef = collection(db, "friendRequests");

  // Query for requests sent by current user to other user, status pending
  const q1 = query(requestsRef,
    where("senderId", "==", currentUserId),
    where("recipientId", "==", otherUserId),
    where("status", "==", "pending"),
    limit(1)
  );

  // Query for requests sent by other user to current user, status pending
  const q2 = query(requestsRef,
    where("senderId", "==", otherUserId),
    where("recipientId", "==", currentUserId),
    where("status", "==", "pending"),
    limit(1)
  );

  try {
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    if (!snap1.empty) {
      const docData = snap1.docs[0].data() as FriendRequest;
      console.log("Existing request found (sent by current user):", snap1.docs[0].id);
      return { ...docData, id: snap1.docs[0].id };
    }
    if (!snap2.empty) {
      const docData = snap2.docs[0].data() as FriendRequest;
      console.log("Existing request found (received by current user):", snap2.docs[0].id);
      return { ...docData, id: snap2.docs[0].id };
    }
    return null;
  } catch (error) {
    console.error("Error fetching existing friend request:", error, { currentUserId, otherUserId });
    return null; // Return null on error
  }
}
