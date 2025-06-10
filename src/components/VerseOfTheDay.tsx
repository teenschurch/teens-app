"use client"

import { useState, useEffect } from "react"
import { BookOpen, RefreshCw } from "lucide-react"

const verses = [
  {
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    reference: "Jeremiah 29:11",
  },
  {
    text: "Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.",
    reference: "1 Timothy 4:12",
  },
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6",
  },
  {
    text: "I can do all this through him who gives me strength.",
    reference: "Philippians 4:13",
  },
  {
    text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
  },
]

export default function VerseOfTheDay() {
  const [currentVerse, setCurrentVerse] = useState(verses[0])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Get verse based on day of year for consistency
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    setCurrentVerse(verses[dayOfYear % verses.length])
  }, [])

  const refreshVerse = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * verses.length)
      setCurrentVerse(verses[randomIndex])
      setIsRefreshing(false)
    }, 500)
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-400 rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-8 h-8 text-gray-800" />
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Verse of the Day</h2>
                </div>
                <button
                  onClick={refreshVerse}
                  className="p-2 rounded-full hover:bg-yellow-300 transition-colors duration-200"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-6 h-6 text-gray-800 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              <blockquote className="text-lg md:text-xl text-gray-800 italic mb-4 leading-relaxed">
                "{currentVerse.text}"
              </blockquote>

              <cite className="text-base md:text-lg font-semibold text-gray-700 not-italic">
                - {currentVerse.reference}
              </cite>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
