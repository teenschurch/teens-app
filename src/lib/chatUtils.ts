import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

// Function to search users (basic prefix search on displayName)
export async function searchUsers(searchTerm: string, currentUserId: string): Promise<UserProfile[]> {
  if (!searchTerm.trim()) return [];

  const usersRef = collection(db, "users");
  // Firestore queries are case-sensitive. For case-insensitive search,
  // you would typically store a lowercased version of the displayName.
  // Using a range query for "starts with" behavior.
  // The character '' (Apple logo, Unicode F8FF) is often used as it's high in the Unicode range,
  // effectively creating an upper bound for strings starting with searchTerm.
  const q = query(
    usersRef,
    where("displayName", ">=", searchTerm),
    where("displayName", "<=", searchTerm + "\uf8ff"), // \uf8ff is a common high Unicode character
    limit(10) // Limit results to a reasonable number for UI
  );

  try {
    const snapshot = await getDocs(q);
    const users = snapshot.docs
      .map(doc => doc.data() as UserProfile)
      .filter(user => user.uid !== currentUserId); // Exclude current user from results
    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    return []; // Return empty array on error
  }
}

// Function to get or create a conversation
export async function getOrCreateConversation(
  currentUserId: string,
  currentUserDisplayName: string,
  otherUserId: string,
  otherUserDisplayName: string
): Promise<string> {
  // Ensure predictable conversation ID by sorting participant UIDs
  const sortedUserIds = [currentUserId, otherUserId].sort();
  const conversationId = sortedUserIds.join('_');

  const conversationRef = doc(db, "conversations", conversationId);

  try {
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      console.log(`Conversation ${conversationId} already exists.`);
      // Optionally, one might update participantDetails if they could change (e.g., displayName update)
      // For simplicity, we're not doing that here.
      return conversationId;
    } else {
      console.log(`Creating new conversation ${conversationId}.`);
      await setDoc(conversationRef, {
        participants: sortedUserIds,
        participantDetails: [ // Store basic info for quick display
          { uid: currentUserId, displayName: currentUserDisplayName /* photoURL: currentUserPhotoURL */ },
          { uid: otherUserId, displayName: otherUserDisplayName /* photoURL: otherUserPhotoURL */ }
        ],
        updatedAt: serverTimestamp(), // Timestamp of the last activity or message
        lastMessage: null, // No messages yet, or could be a system message
        // Example system message:
        // lastMessage: {
        //   text: "Conversation started.",
        //   senderId: "system", // Special ID for system messages
        //   createdAt: serverTimestamp()
        // },
        typingUsers: [], // Initialize empty array for typing indicators
      });
      console.log(`Conversation ${conversationId} created.`);
      return conversationId;
    }
  } catch (error) {
    console.error("Error getting or creating conversation:", error, { conversationId });
    throw error; // Re-throw to be handled by the caller
  }
}
