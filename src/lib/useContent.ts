"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Content } from "@/lib/types"

export function useContent(type?: string) {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = query(collection(db, "content"), orderBy("createdAt", "desc"))

    if (type) {
      q = query(collection(db, "content"), where("type", "==", type), orderBy("createdAt", "desc"))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Content[]

      setContent(contentData)
      setLoading(false)
    })

    return unsubscribe
  }, [type])

  return { content, loading }
}
