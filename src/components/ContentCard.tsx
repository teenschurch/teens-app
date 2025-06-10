import { format } from "date-fns"
import { Video, FileText, Clock, User } from "lucide-react"
import type { Content } from "@/lib/types"

interface ContentCardProps {
  content: Content
}

export default function ContentCard({ content }: ContentCardProps) {
  const getTypeIcon = () => {
    switch (content.type) {
      case "video":
        return Video
      case "devotional":
      case "article":
        return FileText
      default:
        return FileText
    }
  }

  const TypeIcon = getTypeIcon()

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {content.thumbnailUrl && (
        <div className="h-48 bg-gray-200 overflow-hidden relative">
          <img
            src={content.thumbnailUrl || "/placeholder.svg"}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <div className="bg-black/70 text-white px-2 py-1 rounded-lg flex items-center space-x-1">
              <TypeIcon className="w-4 h-4" />
              <span className="text-xs capitalize">{content.type}</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{content.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{content.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{content.author}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{format(content.createdAt.toDate(), "MMM d, yyyy")}</span>
          </div>
        </div>

        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button className="w-full bg-gradient-to-r from-red-500 to-yellow-400 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-yellow-500 transition-all duration-200">
            {content.type === "video" ? "Watch Now" : "Read More"}
          </button>
        </div>
      </div>
    </div>
  )
}
