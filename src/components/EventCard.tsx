import { format } from "date-fns"
import { Calendar, Clock, MapPin } from "lucide-react"
import type { Event } from "@/lib/types"

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {event.imageUrl && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img src={event.imageUrl || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{format(event.date.toDate(), "MMMM d, yyyy")}</span>
          </div>

          {event.time && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{event.time}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button className="w-full bg-gradient-to-r from-red-500 to-yellow-400 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-yellow-500 transition-all duration-200">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}
