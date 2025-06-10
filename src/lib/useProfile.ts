"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/AuthContext"
import type { UserProfile } from "@/lib/types"

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "profiles", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile)
        } else {
          // Create default profile
          const defaultProfile = {
            userId: user.uid,
            displayName: user.displayName || "",
            email: user.email || "",
            createdAt: new Date(),
          }
          await setDoc(docRef, defaultProfile)
          setProfile({ id: user.uid, ...defaultProfile } as UserProfile)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("User must be authenticated")

    const docRef = doc(db, "profiles", user.uid)
    await updateDoc(docRef, updates)

    setProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }

  return { profile, updateProfile, loading }
}
