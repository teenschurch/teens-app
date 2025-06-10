"use client"

import { useEvents } from "@/lib/useEvents"
import EventCard from "@/components/EventCard"
import { Calendar } from "lucide-react"

export default function Events() {
  const { events, loading } = useEvents()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calendar className="w-12 h-12 text-red-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Upcoming Events</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't miss out on the fun! Check out our upcoming events and mark your calendar.
            </p>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No events scheduled</h3>
              <p className="text-gray-500">Check back soon for upcoming events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
