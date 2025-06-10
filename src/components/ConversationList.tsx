"use client";

import { useState } from "react"; // Added useState
import { useConversations } from "@/lib/useConversations";
import { useAuth } from "@/lib/AuthContext";
import ConversationListItem from "./ConversationListItem";
import type { User } from "@/lib/types";
import UserSearchModal from "./UserSearchModal"; // Added
import { getOrCreateConversation } from "@/lib/chatUtils"; // Added
import { PlusCircle } from "lucide-react"; // Added for button icon

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
}

export default function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { conversations, loading } = useConversations();
  const { user: currentUser } = useAuth(); // Renamed user to currentUser for clarity
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // Added state

  const handleSelectUserFromSearch = async (otherUserId: string, otherUserDisplayName: string) => {
    if (!currentUser || !currentUser.uid || !currentUser.displayName) {
      console.error(
        "Current user details (UID, DisplayName) are not available for starting chat."
      );
      // TODO: Optionally, show a user-facing error message or prompt to update profile
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(
        currentUser.uid,
        currentUser.displayName, // Pass current user's display name
        otherUserId,
        otherUserDisplayName
      );
      onSelectConversation(conversationId);
      setIsSearchModalOpen(false); // Close modal after selection
    } catch (error) {
      console.error("Error starting new conversation:", error);
      // TODO: Optionally, show a user-facing error message
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (!currentUser) { // Check currentUser
    return <div className="p-4 text-center text-sm text-gray-500">Please log in to see conversations.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full flex items-center justify-center bg-gradient-to-r from-red-500 to-yellow-500 text-white px-4 py-2.5 rounded-lg hover:from-red-600 hover:to-yellow-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 shadow-md hover:shadow-lg"
        >
          <PlusCircle size={20} className="mr-2" />
          New Chat
        </button>
      </div>

      {conversations.length === 0 && !loading && (
         <div className="p-4 text-center text-sm text-gray-500 flex-grow flex flex-col justify-center items-center">
            <MessageCircle size={48} className="text-gray-300 mb-3" />
            <p className="font-semibold">No conversations yet.</p>
            <p>Click "New Chat" to start a conversation.</p>
        </div>
      )}

      <div className="overflow-y-auto flex-grow">
        {conversations.map((conv) => (
          <ConversationListItem
            key={conv.id}
            conversation={conv}
            currentUser={currentUser as User} // Cast because we checked for currentUser above
            onSelectConversation={onSelectConversation}
          />
        ))}
      </div>

      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectUser={handleSelectUserFromSearch}
      />
    </div>
  );
}
// Added MessageCircle for empty state icon
import { MessageCircle } from "lucide-react";
