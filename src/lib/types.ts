import type { Timestamp } from "firebase/firestore"

export interface User {
  uid: string
  email?: string
  displayName?: string
  isAnonymous: boolean
}

export interface Message {
  id: string
  text: string
  userId: string
  displayName: string
  createdAt: Timestamp
  type: "text" | "reaction" | "system"
  replyTo?: string
  edited?: boolean
  editedAt?: Timestamp
  readBy?: { [userId: string]: Timestamp }; // Key: userId, Value: timestamp when read
}

export interface UserPresence {
  id: string
  userId: string
  displayName: string
  lastSeen: Timestamp
  isOnline: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  date: Timestamp
  time?: string
  location?: string
  imageUrl?: string
  createdAt: Timestamp
}

export interface Content {
  id: string
  title: string
  description: string
  type: "video" | "devotional" | "article"
  author: string
  thumbnailUrl?: string
  contentUrl?: string
  tags?: string[]
  createdAt: Timestamp
}

// Updated UserProfile to align with common user document structure in a 'users' collection
export interface UserProfile {
  uid: string; // Corresponds to Firebase Auth UID and document ID in 'users' collection
  displayName: string;
  email?: string; // Optional, as users might not always share it publicly
  photoURL?: string; // For user avatars
  // Add other public profile fields as needed, e.g., bio, etc.
}

export interface Conversation {
  id:string; // Firestore document ID (e.g., uid1_uid2 or auto-ID)
  participants: string[]; // Array of user UIDs
  participantDetails: Array<{ // Optional: denormalized basic user info for quick display
    uid: string;
    displayName?: string;
    photoURL?: string; // If you have avatars
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  };
  updatedAt: Timestamp; // Timestamp of the last activity
  typingUsers?: Array<{ uid: string; displayName: string }>; // Users currently typing
}

export interface FriendRequest {
  id: string; // Firestore document ID
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  recipientId: string;
  recipientName: string;
  recipientPhotoURL?: string;
  status: "pending" | "accepted" | "declined" | "unfriended";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Friend {
  uid: string; // Friend's UID (same as the document ID in the subcollection)
  displayName: string;
  photoURL?: string;
  friendSince: Timestamp;
}
