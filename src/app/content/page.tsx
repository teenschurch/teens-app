"use client"

import { useState } from "react"
import { useContent } from "@/lib/useContent"
import ContentCard from "@/components/ContentCard"
import { BookOpen, Video, FileText } from "lucide-react"

const contentTypes = [
  { value: "all", label: "All Content", icon: BookOpen },
  { value: "video", label: "Videos", icon: Video },
  { value: "devotional", label: "Devotionals", icon: FileText },
  { value: "article", label: "Articles", icon: FileText },
]

export default function Content() {
  const [selectedType, setSelectedType] = useState("all")
  const { content, loading } = useContent(selectedType === "all" ? undefined : selectedType)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BookOpen className="w-12 h-12 text-red-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Content Library</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore videos, devotionals, and articles to grow in your faith journey.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {contentTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedType === type.value
                      ? "bg-gradient-to-r from-red-500 to-yellow-400 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No content available</h3>
              <p className="text-gray-500">Check back soon for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
