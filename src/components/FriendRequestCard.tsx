"use client";

import type { FriendRequest } from "@/lib/types";
// Assuming you have an Avatar component like ShadCN UI. If not, replace with <img>.
// For example: import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Assuming you have a Button component. If not, replace with <button>.
// For example: import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

// Placeholder for AvatarImage if not using ShadCN or similar
const AvatarImage = ({ src, alt }: { src?: string; alt: string }) =>
  src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : null;

// Placeholder for AvatarFallback if not using ShadCN or similar
const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 text-gray-700">
    {children}
  </div>
);

// Placeholder for Avatar if not using ShadCN or similar
const Avatar = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

// Placeholder for Button if not using ShadCN or similar
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


interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  isProcessing: boolean; // To disable buttons during action
}

export default function FriendRequestCard({ request, onAccept, onDecline, isProcessing }: FriendRequestCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={request.senderPhotoURL || undefined} alt={request.senderName} />
          <AvatarFallback>{request.senderName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-gray-800">{request.senderName}</p>
          <p className="text-xs text-gray-500">Wants to be your friend.</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDecline(request.id)}
          disabled={isProcessing}
          aria-label="Decline friend request"
          className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-70"
        >
          <X className="h-4 w-4 mr-1 sm:mr-0 md:mr-1" /> <span className="hidden sm:inline">Decline</span>
        </Button>
        <Button
          variant="default" // Or your primary button style
          size="sm"
          onClick={() => onAccept(request.id)}
          disabled={isProcessing}
          aria-label="Accept friend request"
          className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-70"
        >
          <Check className="h-4 w-4 mr-1 sm:mr-0 md:mr-1" /> <span className="hidden sm:inline">Accept</span>
        </Button>
      </div>
    </div>
  );
}
