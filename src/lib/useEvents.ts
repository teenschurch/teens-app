"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, where, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/lib/types"

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "events"), where("date", ">=", Timestamp.now()), orderBy("date", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[]

      setEvents(eventsData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { events, loading }
}
