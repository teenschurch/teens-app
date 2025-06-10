"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, UserPlus, CheckCircle, Clock } from "lucide-react"; // Added icons
import { searchUsers } from "@/lib/chatUtils";
import type { UserProfile, FriendRequest as FriendRequestType } from "@/lib/types"; // Renamed FriendRequest
import { useAuth } from "@/lib/AuthContext";
import { checkFriendshipStatus, getExistingFriendRequest } from "@/lib/friendUtils"; // Added
import { addDoc, collection, serverTimestamp } from "firebase/firestore"; // Added
import { db } from "@/lib/firebase"; // Added

// Define a new type for search results with status
type UserSearchResultItem = UserProfile & {
  requestStatus?: "friends" | "pending_sent" | "pending_received" | "none";
  isLoadingStatus?: boolean;
  existingRequestId?: string | null;
};

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, displayName: string) => void; // This is for starting chat
}

export default function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rawSearchResults, setRawSearchResults] = useState<UserProfile[]>([]); // Raw results from searchUsers
  const [detailedSearchResults, setDetailedSearchResults] = useState<UserSearchResultItem[]>([]); // Results with status
  const [loadingSearch, setLoadingSearch] = useState(false); // For initial user search
  const [loadingStatus, setLoadingStatus] = useState(false); // For fetching statuses
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const { user: currentUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const handleSearchUsers = useCallback(async (term: string) => {
    if (!term.trim() || !currentUser?.uid) {
      setRawSearchResults([]);
      setDetailedSearchResults([]);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    setDetailedSearchResults([]); // Clear detailed results while new raw search is performed
    try {
      const users = await searchUsers(term, currentUser.uid);
      setRawSearchResults(users); // This will trigger the useEffect below to fetch statuses
    } catch (error) {
      console.error("Error searching users:", error);
      setRawSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [currentUser?.uid]);

  // Effect to fetch statuses when rawSearchResults change
  useEffect(() => {
    if (!rawSearchResults.length || !currentUser?.uid) {
      setDetailedSearchResults([]);
      return;
    }

    const fetchStatuses = async () => {
      setLoadingStatus(true);
      const resultsWithStatus = await Promise.all(
        rawSearchResults.map(async (user) => {
          let status: UserSearchResultItem["requestStatus"] = "none";
          let existingRequestId: string | null = null;
          let isLoadingIndividualStatus = true; // To show loading per item initially

          try {
            const areFriends = await checkFriendshipStatus(currentUser.uid, user.uid);
            if (areFriends) {
              status = "friends";
            } else {
              const existingRequest = await getExistingFriendRequest(currentUser.uid, user.uid);
              if (existingRequest) {
                existingRequestId = existingRequest.id;
                status = existingRequest.senderId === currentUser.uid ? "pending_sent" : "pending_received";
              }
            }
          } catch (e) {
            console.error("Error fetching status for user", user.uid, e);
            status = "none"; // Default to none on error
          } finally {
            isLoadingIndividualStatus = false;
          }
          return { ...user, requestStatus: status, isLoadingStatus: isLoadingIndividualStatus, existingRequestId };
        })
      );
      setDetailedSearchResults(resultsWithStatus);
      setLoadingStatus(false);
    };

    fetchStatuses();
  }, [rawSearchResults, currentUser?.uid]);

  // Effect for debouncing search input
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    if (searchTerm.trim()) {
      const newTimeout = setTimeout(() => handleSearchUsers(searchTerm), 500);
      setDebounceTimeout(newTimeout);
    } else {
      setRawSearchResults([]);
      setDetailedSearchResults([]);
      setLoadingSearch(false);
    }
    return () => { if (debounceTimeout) clearTimeout(debounceTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Removed handleSearchUsers from deps as it's stable due to useCallback

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSendFriendRequest = async (recipientUser: UserProfile) => {
    if (!currentUser || !currentUser.uid || !currentUser.displayName) {
      alert("Your display name is not set. Please update your profile.");
      return;
    }
    if (!recipientUser.displayName) {
      alert("Recipient's display name is not available.");
      return;
    }

    setDetailedSearchResults(prev => prev.map(u => u.uid === recipientUser.uid ? { ...u, isLoadingStatus: true } : u));

    try {
      const newRequest: Omit<FriendRequestType, "id" | "createdAt" | "updatedAt"> = {
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL || "",
        recipientId: recipientUser.uid,
        recipientName: recipientUser.displayName,
        recipientPhotoURL: recipientUser.photoURL || "",
        status: "pending",
      };
      const docRef = await addDoc(collection(db, "friendRequests"), {
        ...newRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setDetailedSearchResults(prev => prev.map(u =>
        u.uid === recipientUser.uid ? { ...u, requestStatus: "pending_sent", isLoadingStatus: false, existingRequestId: docRef.id } : u
      ));
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request.");
      setDetailedSearchResults(prev => prev.map(u => u.uid === recipientUser.uid ? { ...u, isLoadingStatus: false } : u));
    }
  };

  const handleCloseAndReset = () => {
    setSearchTerm("");
    setRawSearchResults([]);
    setDetailedSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  const totalLoading = loadingSearch || loadingStatus;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Find People</h2>
          <button onClick={handleCloseAndReset} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100" aria-label="Close search modal">
            <X size={28} />
          </button>
        </div>
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
          />
          <Search size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {totalLoading && (
          <div className="flex justify-center items-center my-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            <p className="ml-2 text-sm text-gray-500">Searching...</p>
          </div>
        )}

        <div className="max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {!totalLoading && detailedSearchResults.length > 0 && (
            detailedSearchResults.map((userItem) => (
              <div key={userItem.uid} className="flex items-center justify-between p-3 my-1 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                <div className="flex items-center"
                     onClick={() => {
                       onSelectUser(userItem.uid, userItem.displayName);
                       handleCloseAndReset();
                     }}
                     role="button"
                     tabIndex={0}
                     onKeyDown={(e) => e.key === 'Enter' && onSelectUser(userItem.uid, userItem.displayName)}
                     className="cursor-pointer flex-grow"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-500">
                    {userItem.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{userItem.displayName}</p>
                    {userItem.email && <p className="text-xs text-gray-500">{userItem.email}</p>}
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {userItem.isLoadingStatus ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  ) : userItem.requestStatus === 'friends' ? (
                    <button disabled className="text-xs text-green-600 flex items-center p-1 rounded">
                      <CheckCircle size={16} className="mr-1" /> Friends
                    </button>
                  ) : userItem.requestStatus === 'pending_sent' ? (
                    <button disabled className="text-xs text-yellow-600 flex items-center p-1 rounded">
                      <Clock size={16} className="mr-1" /> Sent
                    </button>
                  ) : userItem.requestStatus === 'pending_received' ? (
                    <button
                      onClick={() => alert(`Accept request from ${userItem.displayName} - TBD`)}
                      className="text-xs bg-blue-500 text-white hover:bg-blue-600 flex items-center px-2 py-1 rounded-md"
                    >
                      Accept
                    </button>
                  ) : ( // 'none'
                    <button
                      onClick={() => handleSendFriendRequest(userItem)}
                      className="text-xs bg-red-500 text-white hover:bg-red-600 flex items-center px-2 py-1 rounded-md"
                    >
                      <UserPlus size={16} className="mr-1" /> Add
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {!totalLoading && detailedSearchResults.length === 0 && searchTerm.trim() && (
            <p className="text-sm text-gray-500 text-center py-4">No users found matching your search.</p>
          )}
          {!totalLoading && detailedSearchResults.length === 0 && !searchTerm.trim() && (
            <p className="text-sm text-gray-400 text-center py-4">Enter a name to search for people.</p>
          )}
        </div>
      </div>
    </div>
  );
}
