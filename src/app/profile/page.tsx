"use client"

import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useProfile } from "@/lib/useProfile"
import AuthPrompt from "@/components/AuthPrompt"
import { User, Edit2, Save, X } from "lucide-react"

export default function Profile() {
  const { user, signOut } = useAuth()
  const { profile, updateProfile, loading } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [saving, setSaving] = useState(false)

  if (!user) {
    return <AuthPrompt />
  }

  const handleEdit = () => {
    setDisplayName(profile?.displayName || user.displayName || "")
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ displayName })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setDisplayName("")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <User className="w-12 h-12 text-red-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Profile</h1>
            </div>
            <p className="text-lg text-gray-600">Manage your account information and preferences.</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Avatar */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {profile?.displayName || user.displayName || "Anonymous User"}
                  </h2>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter your display name"
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-800">{profile?.displayName || user.displayName || "Not set"}</span>
                      <button
                        onClick={handleEdit}
                        className="text-red-500 hover:text-red-600 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-800">{user.email || "Anonymous User"}</span>
                  </div>
                </div>

                {/* Account Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-800">{user.isAnonymous ? "Anonymous" : "Registered"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={signOut}
                    className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
