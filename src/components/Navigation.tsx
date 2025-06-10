"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/AuthContext"
import { Menu, X, Heart, MessageCircle, Calendar, BookOpen, User } from "lucide-react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()

  const navItems = [
    { href: "/", label: "Home", icon: Heart },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/content", label: "Content", icon: BookOpen },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-red-500">Teen Church</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            {user && (
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)} />

            {/* Mobile Menu */}
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50 md:hidden">
              <div className="py-4 px-4 border-t border-gray-200">
                <div className="flex flex-col space-y-4">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 text-gray-700 hover:text-red-500 transition-colors duration-200 py-2"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                  {user && (
                    <button
                      onClick={() => {
                        signOut()
                        setIsOpen(false)
                      }}
                      className="flex items-center space-x-3 text-red-500 py-2 w-full text-left"
                    >
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
