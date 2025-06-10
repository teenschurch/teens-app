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

export interface UserProfile {
  id: string
  userId: string
  displayName: string
  email: string
  bio?: string
  createdAt: Date
}
