"use client"

import Link from "next/link"
import { MessageCircle, Calendar, BookOpen, Sparkles } from "lucide-react"

export default function Hero() {
  return (
    <section
      className="min-h-[80vh] flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #ef4444 0%, #facc15 100%)",
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-white rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-white rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main heading */}
          <div className="mb-8">
            <Sparkles className="w-16 h-16 text-white mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 text-shadow">Welcome to</h1>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 text-shadow">Teen Church!</h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
              Where faith meets fun! Join our vibrant community of teens growing together in God&apos;s love.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center">
            <Link
              href="/chat"
              className="w-full md:w-auto bg-white text-red-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Join Chat</span>
            </Link>

            <Link
              href="/events"
              className="w-full md:w-auto bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <Calendar className="w-6 h-6" />
              <span>See Events</span>
            </Link>

            <Link
              href="/content"
              className="w-full md:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-red-500 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-6 h-6" />
              <span>Explore Content</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
