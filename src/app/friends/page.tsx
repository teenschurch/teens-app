"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore"; // Added more Firestore imports
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useFriendRequests } from "@/lib/useFriendRequests";
import FriendRequestCard from "@/components/FriendRequestCard";
import { useFriendsList } from "@/lib/useFriendsList"; // Added
import FriendCard from "@/components/FriendCard"; // Added
import { Users, Loader2, Send, UserPlus, Smile } from "lucide-react"; // Added Smile icon

// Basic AuthPrompt placeholder if not available
const AuthPrompt = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
    <div className="p-8 bg-white shadow-lg rounded-lg text-center">
      <UserPlus size={48} className="text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Please Log In</h2>
      <p className="text-gray-600">You need to be logged in to view your friends and requests.</p>
    </div>
  </div>
);

export default function FriendsPage() {
  const { user } = useAuth();
  const { pendingRequests, loading: loadingRequests } = useFriendRequests();
  const { friends, loading: loadingFriends } = useFriendsList(); // Added
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [processingFriendId, setProcessingFriendId] = useState<string | null>(null); // Added

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;
    setProcessingRequestId(requestId);
    try {
      const requestRef = doc(db, "friendRequests", requestId);
      // Note: The onFriendRequestAccepted cloud function will handle creating friendship docs.
      // Here, we just update the request status.
      await updateDoc(requestRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept request. Please try again.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!user) return;
    setProcessingRequestId(requestId);
    try {
      const requestRef = doc(db, "friendRequests", requestId);
      await updateDoc(requestRef, {
        status: "declined",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error declining friend request:", error);
      alert("Failed to decline request. Please try again.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleUnfriend = async (friendId: string, friendName: string) => {
    if (!user?.uid) return;
    if (!window.confirm(`Are you sure you want to unfriend ${friendName}? This action cannot be undone.`)) {
      return;
    }

    setProcessingFriendId(friendId);
    try {
      // Only delete the friend document from the current user's own friends list
      const currentUserFriendRef = doc(db, "users", user.uid, "friends", friendId);
      await deleteDoc(currentUserFriendRef);

      // The UI will update automatically due to the useFriendsList hook.
      // Additional actions (removing from other user's list, updating friendRequest status)
      // will be handled by a Cloud Function triggered by this deletion.
      console.log(`Successfully unfriended ${friendName} from current user's list.`);

    } catch (error) {
      console.error("Error unfriending user (client-side):", error);
      alert("Failed to unfriend. Please try again.");
    } finally {
      setProcessingFriendId(null);
    }
  };


  if (!user) {
    return <AuthPrompt />;
  }

  const totalLoading = loadingRequests || loadingFriends;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Users className="mr-3 text-red-500" size={32}/> Manage Friends
        </h1>
      </header>

      <section id="friend-requests" className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">Friend Requests</h2>
        {loadingRequests && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
            <p className="text-gray-600">Loading requests...</p>
          </div>
        )}
        {!loadingRequests && pendingRequests.length === 0 && (
          <div className="text-center py-10 bg-white shadow-sm rounded-lg border border-gray-200">
            <Send className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No pending friend requests.</p>
            <p className="text-sm text-gray-500 mt-1">When someone sends you a request, it will appear here.</p>
          </div>
        )}
        {!loadingRequests && pendingRequests.length > 0 && (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                isProcessing={processingRequestId === request.id}
              />
            ))}
          </div>
        )}
      </section>

      <section id="friends-list">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">Your Friends</h2>
        {loadingFriends && (
           <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
            <p className="text-gray-600">Loading friends list...</p>
          </div>
        )}
        {!loadingFriends && friends.length === 0 && (
          <div className="text-center py-10 bg-white shadow-sm rounded-lg border border-gray-200">
            <Smile className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">You haven't added any friends yet.</p>
            <p className="text-sm text-gray-500 mt-1">Search for people to connect with them!</p>
          </div>
        )}
        {!loadingFriends && friends.length > 0 && (
          <div className="space-y-3">
            {friends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                onUnfriend={handleUnfriend}
                isProcessing={processingFriendId === friend.uid}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
