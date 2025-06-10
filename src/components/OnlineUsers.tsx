import { formatDistanceToNow } from "date-fns"
import { Users, Circle } from "lucide-react"
import type { UserPresence } from "@/lib/types"

interface OnlineUsersProps {
  users: UserPresence[]
}

export default function OnlineUsers({ users }: OnlineUsersProps) {
  const sortedUsers = users.sort((a, b) => {
    // Sort by online status first, then by last seen
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    return b.lastSeen.toMillis() - a.lastSeen.toMillis()
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Online ({users.filter((u) => u.isOnline).length})</h3>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No one online yet</p>
          </div>
        ) : (
          sortedUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {(user.displayName || "A").charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Online indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  {user.isOnline && (
                    <Circle className="w-2 h-2 text-white absolute top-0.5 left-0.5" fill="currentColor" />
                  )}
                </div>
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.displayName || "Anonymous"}</p>
                <p className="text-xs text-gray-500">
                  {user.isOnline
                    ? "Online now"
                    : `Last seen ${formatDistanceToNow(user.lastSeen.toDate(), { addSuffix: true })}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </div>
          <p>Double-tap messages to react!</p>
        </div>
      </div>
    </div>
  )
}
