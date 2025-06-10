"use client";

// Removed useState, UserSearchModal, getOrCreateConversation, PlusCircle
import { useConversations } from "@/lib/useConversations";
import { useAuth } from "@/lib/AuthContext";
import ConversationListItem from "./ConversationListItem";
import type { User } from "@/lib/types";
import { MessageCircle } from "lucide-react"; // Kept for empty state

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
}

export default function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { conversations, loading } = useConversations();
  const { user: currentUser } = useAuth();

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <div className="p-4 text-center text-sm text-gray-500">Please log in to see conversations.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Removed New Chat button section */}

      {conversations.length === 0 && !loading && (
         <div className="p-4 text-center text-sm text-gray-500 flex-grow flex flex-col justify-center items-center h-full"> {/* Added h-full for better centering */}
            <MessageCircle size={48} className="text-gray-300 mb-3" />
            <p className="font-semibold">No conversations yet.</p>
            {/* Updated empty state message to reflect that "New Chat" is now elsewhere */}
            <p className="text-xs mt-1">Go to 'Friends' to find people and start a new chat.</p>
        </div>
      )}

      <div className="overflow-y-auto flex-grow"> {/* Ensure this can grow if content above is minimal */}
        {conversations.map((conv) => (
          <ConversationListItem
            key={conv.id}
            conversation={conv}
            currentUser={currentUser as User}
            onSelectConversation={onSelectConversation}
          />
        ))}
      </div>

      {/* Removed UserSearchModal rendering */}
    </div>
  );
}
// MessageCircle import is now at the top
