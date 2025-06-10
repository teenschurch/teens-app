"use client";

import type { Conversation, User } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface ConversationListItemProps {
  conversation: Conversation;
  currentUser: User | null; // Can be null if not logged in
  onSelectConversation: (conversationId: string) => void;
}

export default function ConversationListItem({
  conversation,
  currentUser,
  onSelectConversation,
}: ConversationListItemProps) {
  if (!currentUser) return null; // Or some placeholder/error

  // Determine the other participant(s)
  const otherParticipants = conversation.participantDetails.filter(
    (p) => p.uid !== currentUser.uid
  );

  // For now, just take the first other participant for display
  // This needs to be more robust for group chats later
  const displayParticipant = otherParticipants[0];
  const displayName = displayParticipant?.displayName || "Unknown User";
  // const avatarUrl = displayParticipant?.photoURL; // If you have avatars

  return (
    <div
      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
      onClick={() => onSelectConversation(conversation.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(conversation.id)}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm text-gray-800">{displayName}</h3>
        {conversation.lastMessage?.createdAt && (
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(conversation.lastMessage.createdAt.toDate(), { addSuffix: true })}
          </p>
        )}
      </div>
      <p className="text-xs text-gray-600 truncate">
        {conversation.lastMessage?.text || "No messages yet"}
      </p>
    </div>
  );
}
