"use client";

import type { Friend } from "@/lib/types";
// Assuming Avatar and Button components are available (e.g., from ShadCN UI or custom)
// If not, replace with basic HTML elements.
// Example imports for ShadCN:
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";

// --- Placeholder UI Components (if not using a UI library like ShadCN) ---
const AvatarImage = ({ src, alt }: { src?: string; alt: string }) =>
  src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : null;

const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 text-gray-700">
    {children}
  </div>
);

const Avatar = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const Button = ({ variant, size, onClick, disabled, "aria-label": ariaLabel, className, children }:
  { variant?: string; size?: string; onClick: () => void; disabled?: boolean; "aria-label": string; className?: string; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
      ${size === "sm" ? "h-9 px-3" : "h-10 px-4 py-2"}
      ${variant === "outline" ? `border border-input bg-background hover:bg-accent hover:text-accent-foreground ${className}` : `bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
    `}
  >
    {children}
  </button>
);
// --- End Placeholder UI Components ---


interface FriendCardProps {
  friend: Friend;
  onUnfriend: (friendId: string, friendName: string) => Promise<void>;
  isProcessing: boolean;
}

export default function FriendCard({ friend, onUnfriend, isProcessing }: FriendCardProps) {
  const friendSinceDate = friend.friendSince?.toDate ?
    new Date(friend.friendSince.toDate()).toLocaleDateString() :
    "Date not available";

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.photoURL || undefined} alt={friend.displayName} />
          <AvatarFallback>{friend.displayName?.charAt(0).toUpperCase() || "F"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-gray-800">{friend.displayName}</p>
          <p className="text-xs text-gray-500">Friends since {friendSinceDate}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUnfriend(friend.uid, friend.displayName)}
        disabled={isProcessing}
        className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-red-600 hover:border-red-300 disabled:opacity-70"
        aria-label={`Unfriend ${friend.displayName}`}
      >
        <UserX className="h-4 w-4 mr-1 sm:mr-0 md:mr-1" /> <span className="hidden sm:inline">Unfriend</span>
      </Button>
    </div>
  );
}
