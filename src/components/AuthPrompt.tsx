"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { Mail, UserPlus, LogIn } from "lucide-react"

export default function AuthPrompt() {
  const { signInWithEmail, signInAnonymously } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      await signInWithEmail(email, password, isSignUp)
    } catch (error) {
      console.error("Auth error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymousAuth = async () => {
    setLoading(true)
    try {
      await signInAnonymously()
    } catch (error) {
      console.error("Anonymous auth error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Teen Church</h2>
          <p className="text-gray-600">Sign in to access chat, events, and more!</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-yellow-400 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-yellow-500 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
            </button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-red-500 hover:text-red-600 transition-colors duration-200"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Anonymous Sign In */}
          <button
            onClick={handleAnonymousAuth}
            disabled={loading}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Continue as Guest</span>
          </button>
        </div>
      </div>
    </div>
  )
}
