import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Triggered on the creation of a new message in any conversation.
 * It logs the message details, updates the parent conversation document,
 * and sends FCM notifications to other participants.
 */
export const onNewMessageNotification = functions.firestore
  .document("/conversations/{conversationId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const conversationId = context.params.conversationId;
    const messageId = context.params.messageId;
    const messageData = snapshot.data();

    functions.logger.info(
      `[${conversationId}] New message ${messageId}. Triggered by user ${messageData?.userId || "Unknown User"}.`,
      { conversationId, messageId, messageData }
    );

    // 1. Basic Message Validation & Conversation Update
    if (
      !messageData ||
      typeof messageData.text !== "string" ||
      typeof messageData.userId !== "string" ||
      !messageData.createdAt
    ) {
      functions.logger.warn(
        `[${conversationId}] Message ${messageId} data incomplete or invalid. Skipping further processing.`,
        { messageData }
      );
      return null;
    }

    const senderId = messageData.userId;
    const conversationRef = db.doc(`conversations/${conversationId}`);

    try {
      await conversationRef.update({
        lastMessage: {
          text: messageData.text,
          senderId: senderId,
          createdAt: messageData.createdAt,
        },
        updatedAt: messageData.createdAt,
      });
      functions.logger.info(
        `[${conversationId}] Successfully updated conversation with lastMessage.`
      );
    } catch (error) {
      functions.logger.error(
        `[${conversationId}] Error updating conversation with lastMessage:`,
        error
      );
      // Continue to send notifications even if this fails for now
    }

    // 2. Determine Recipients
    let conversationDoc;
    try {
      conversationDoc = await conversationRef.get();
      if (!conversationDoc.exists) {
        functions.logger.error(
          `[${conversationId}] Conversation document not found. Cannot send notifications.`
        );
        return null;
      }
    } catch (error) {
      functions.logger.error(
        `[${conversationId}] Error fetching conversation document:`,
        error
      );
      return null;
    }

    const conversationData = conversationDoc.data();
    if (!conversationData || !Array.isArray(conversationData.participants)) {
      functions.logger.error(
        `[${conversationId}] Invalid conversation data or missing participants.`
      );
      return null;
    }

    const recipients = conversationData.participants.filter(
      (pId: string) => pId !== senderId
    );

    if (recipients.length === 0) {
      functions.logger.info(
        `[${conversationId}] No recipients for notification (sender is only participant or no other participants).`
      );
      return null;
    }

    functions.logger.info(`[${conversationId}] Recipients: ${recipients.join(", ")}`);

    // 3. Fetch FCM Tokens for each recipient
    const allTokensPromises = recipients.map(async (recipientId: string) => {
      try {
        const tokensSnapshot = await db
          .collection(`users/${recipientId}/fcmTokens`)
          .get();
        if (tokensSnapshot.empty) {
          functions.logger.info(`[${conversationId}] No FCM tokens found for recipient ${recipientId}.`);
          return [];
        }
        // Assuming each document in fcmTokens has a 'token' field
        const userTokens = tokensSnapshot.docs
          .map((doc) => doc.data().token as string)
          .filter((token) => typeof token === "string" && token.length > 0);

        functions.logger.info(`[${conversationId}] Found ${userTokens.length} token(s) for ${recipientId}.`);
        return userTokens.map(token => ({ userId: recipientId, token })); // Keep userId for cleanup
      } catch (error) {
        functions.logger.error(
          `[${conversationId}] Error fetching tokens for recipient ${recipientId}:`,
          error
        );
        return [];
      }
    });

    const nestedTokenArrays = await Promise.all(allTokensPromises);
    const tokensWithUserId = nestedTokenArrays.flat(); // Flatten array of arrays
    const fcmTokens = tokensWithUserId.map(item => item.token);


    if (fcmTokens.length === 0) {
      functions.logger.info(
        `[${conversationId}] No valid FCM tokens found for any recipient. No notifications sent.`
      );
      return null;
    }
    functions.logger.info(
      `[${conversationId}] Total FCM tokens to send to: ${fcmTokens.length}`
    );


    // 4. Construct FCM Payload
    // Attempt to get sender's name (optional, could be from messageData or user profile)
    const senderName = messageData.displayName || "Someone"; // Fallback name

    const notificationPayload = {
      title: `New message from ${senderName}`,
      body: messageData.text.substring(0, 100) + (messageData.text.length > 100 ? "..." : ""), // Truncate body
      icon: "/chat-icon.png", // Optional: Replace with your app's icon URL
    };

    const dataPayload = {
      url: `/chat?conversationId=${conversationId}`, // Adjust to your app's deep link structure
      conversationId: conversationId,
      senderId: senderId,
    };

    functions.logger.info(
      `[${conversationId}] Prepared notification payload for ${fcmTokens.length} tokens.`,
      { notificationPayload, dataPayload }
    );

    // 5. Send Notifications
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: notificationPayload,
        data: dataPayload,
      });

      functions.logger.info(
        `[${conversationId}] FCM sendEachForMulticast completed. Success: ${response.successCount}, Failure: ${response.failureCount}.`
      );

      // 6. Token Cleanup (Optional but Recommended)
      const tokensToDeletePromises: Promise<any>[] = [];
      response.responses.forEach((result, index) => {
        const originalTokenWithUser = tokensWithUserId[index]; // originalToken includes userId
        if (!result.success) {
          functions.logger.warn(
            `[${conversationId}] Failed to send to token: ${originalTokenWithUser.token}. Error: ${result.error?.message || "Unknown error"}`,
            result.error
          );
          // Check for errors indicating an invalid or unregistered token
          if (
            result.error?.code === "messaging/invalid-registration-token" ||
            result.error?.code === "messaging/registration-token-not-registered"
          ) {
            functions.logger.info(
              `[${conversationId}] Scheduling deletion for invalid token: ${originalTokenWithUser.token} for user ${originalTokenWithUser.userId}`
            );
            // Assuming token documents are stored by the token string itself as ID, or find the doc by field
            // This example assumes token documents are stored as /users/{userId}/fcmTokens/{token_document_id_that_may_not_be_token}
            // and the token is stored in a field 'token'.
            // A more robust way is to query for the document containing this specific token.
            const tokenDocQuery = db.collection(`users/${originalTokenWithUser.userId}/fcmTokens`).where("token", "==", originalTokenWithUser.token);
            tokensToDeletePromises.push(
              tokenDocQuery.get().then(querySnapshot => {
                querySnapshot.forEach(docSnapshot => {
                  functions.logger.info(`[${conversationId}] Deleting token document ${docSnapshot.id} for user ${originalTokenWithUser.userId}`);
                  docSnapshot.ref.delete().catch(err => functions.logger.error(`Error deleting token doc ${docSnapshot.id}`, err));
                });
              })
            );
          }
        }
      });

      if (tokensToDeletePromises.length > 0) {
        await Promise.all(tokensToDeletePromises);
        functions.logger.info(
          `[${conversationId}] Completed processing ${tokensToDeletePromises.length} invalid tokens for deletion.`
        );
      }
    } catch (error) {
      functions.logger.error(
        `[${conversationId}] Error sending FCM messages via sendEachForMulticast:`,
        error
      );
    }

    return null;
  });

// Function to handle reciprocal unfriend and update original request status when a friend doc is deleted
export const onFriendDocumentDeleted = functions.firestore
  .document("users/{userId}/friends/{friendId}")
  .onDelete(async (snapshot, context) => {
    const deletedFriendData = snapshot.data(); // Data of the friend document that was deleted
    const unfrienderId = context.params.userId; // The user who initiated the unfriend action
    const unfriendedId = context.params.friendId; // The user who was unfriended

    functions.logger.info(
      `Friend document deleted: users/${unfrienderId}/friends/${unfriendedId}.`,
      { unfrienderId, unfriendedId, deletedFriendData }
    );

    // 1. Batch Operations
    const batch = db.batch();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    // 2. Reciprocal Deletion: Delete the corresponding friend document from the other user's list
    const reciprocalFriendRef = db.collection("users").doc(unfriendedId).collection("friends").doc(unfrienderId);
    batch.delete(reciprocalFriendRef);
    functions.logger.info(
      `Scheduled deletion of reciprocal friend document: users/${unfriendedId}/friends/${unfrienderId}.`
    );

    // 3. Update Original Friend Request status to "unfriended"
    // Query for the "accepted" friend request between these two users
    // Check where unfriender was sender and unfriended was recipient
    const frQuery1 = db.collection("friendRequests")
      .where("senderId", "==", unfrienderId)
      .where("recipientId", "==", unfriendedId)
      .where("status", "==", "accepted")
      .limit(1);

    // Check where unfriended was sender and unfriender was recipient
    const frQuery2 = db.collection("friendRequests")
      .where("senderId", "==", unfriendedId)
      .where("recipientId", "==", unfrienderId)
      .where("status", "==", "accepted")
      .limit(1);

    try {
      const [snap1, snap2] = await Promise.all([frQuery1.get(), frQuery2.get()]);
      let requestToUpdateRef: admin.firestore.DocumentReference | null = null;

      if (!snap1.empty) {
        requestToUpdateRef = snap1.docs[0].ref;
      } else if (!snap2.empty) {
        requestToUpdateRef = snap2.docs[0].ref;
      }

      if (requestToUpdateRef) {
        functions.logger.info(
          `Found original friend request ${requestToUpdateRef.id} to update to 'unfriended'.`
        );
        batch.update(requestToUpdateRef, {
          status: "unfriended",
          updatedAt: serverTimestamp,
        });
      } else {
        functions.logger.warn(
          `No 'accepted' friend request found between ${unfrienderId} and ${unfriendedId} to mark as 'unfriended'. This might be normal if the friendship was created before requests had status, or if the request was already cleaned up.`
        );
      }
    } catch (queryError) {
      functions.logger.error(
        `Error querying for original friend request between ${unfrienderId} and ${unfriendedId}:`,
        queryError
      );
      // Decide if you want to proceed with batch commit even if query fails.
      // For now, we'll proceed to at least try the reciprocal delete.
    }

    // 4. Commit Batch
    try {
      await batch.commit();
      functions.logger.info(
        `Successfully processed unfriend actions for ${unfrienderId} and ${unfriendedId} (reciprocal delete and request update).`
      );
    } catch (batchError) {
      functions.logger.error(
        `Error committing batch for unfriend operations between ${unfrienderId} and ${unfriendedId}:`,
        batchError
      );
    }

    return null;
  });

// Function to create friendship documents and notify sender when a friend request is accepted
export const onFriendRequestAccepted = functions.firestore
  .document("friendRequests/{requestId}")
  .onUpdate(async (change, context) => {
    const requestId = context.params.requestId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    functions.logger.info(
      `Friend request ${requestId} updated. Before: ${beforeData.status}, After: ${afterData.status}.`,
      { requestId, beforeData, afterData }
    );

    // 1. Condition Check: Proceed only if status changed from 'pending' to 'accepted'
    if (beforeData.status !== "pending" || afterData.status !== "accepted") {
      functions.logger.info(
        `Friend request ${requestId} status change does not meet criteria for action (was not pending -> accepted). Current status: ${afterData.status}.`
      );
      return null;
    }

    // 2. Data Extraction and Validation
    const {
      senderId,
      senderName,
      senderPhotoURL,
      recipientId,
      recipientName,
      recipientPhotoURL,
    } = afterData;

    if (!senderId || !recipientId || !senderName || !recipientName) {
      functions.logger.error(
        `Friend request ${requestId} is missing essential user IDs or names. Cannot create friendship.`,
        { afterData }
      );
      return null;
    }

    functions.logger.info(
      `Processing accepted friend request ${requestId} between ${senderName} (sender) and ${recipientName} (recipient).`
    );

    // 3. Create Friendship Documents (Batch Write)
    const batch = db.batch();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    const friendDataForSender = {
      uid: recipientId,
      displayName: recipientName,
      photoURL: recipientPhotoURL || null, // Default to null if undefined
      friendSince: serverTimestamp,
    };
    const senderFriendRef = db.collection("users").doc(senderId).collection("friends").doc(recipientId);
    batch.set(senderFriendRef, friendDataForSender);

    const friendDataForRecipient = {
      uid: senderId,
      displayName: senderName,
      photoURL: senderPhotoURL || null, // Default to null if undefined
      friendSince: serverTimestamp,
    };
    const recipientFriendRef = db.collection("users").doc(recipientId).collection("friends").doc(senderId);
    batch.set(recipientFriendRef, friendDataForRecipient);

    try {
      await batch.commit();
      functions.logger.info(
        `Successfully created reciprocal friendship for request ${requestId} between ${senderId} and ${recipientId}.`
      );
    } catch (error) {
      functions.logger.error(
        `Error creating friendship documents for request ${requestId}:`,
        error
      );
      return null; // Exit if friendship creation fails
    }

    // 4. Send Notification to Sender (Optional)
    let senderTokens: string[];
    try {
      const tokensSnapshot = await db
        .collection(`users/${senderId}/fcmTokens`)
        .get();
      if (tokensSnapshot.empty) {
        functions.logger.info(
          `No FCM tokens found for sender ${senderId} (request ${requestId}). Cannot send acceptance notification.`
        );
        return null;
      }
      senderTokens = tokensSnapshot.docs
        .map((doc) => doc.data().token as string)
        .filter((token) => typeof token === "string" && token.length > 0);

      if (senderTokens.length === 0) {
        functions.logger.info(
          `No valid FCM tokens extracted for sender ${senderId}.`
        );
        return null;
      }
    } catch (error) {
      functions.logger.error(
        `Error fetching tokens for sender ${senderId} (request ${requestId}):`,
        error
      );
      return null; // Don't proceed if token fetching fails
    }

    const notificationPayload = {
      title: "Friend Request Accepted",
      body: `${recipientName} accepted your friend request!`,
      icon: recipientPhotoURL || "/default-avatar.png",
    };

    const dataPayload = {
      url: `/profile/${recipientId}`, // Link to the new friend's profile
      type: "friend_request_accepted",
      friendId: recipientId, // ID of the user who accepted
      requestId: requestId,
    };

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: senderTokens,
        notification: notificationPayload,
        data: dataPayload,
      });
      functions.logger.info(
        `Acceptance notification FCM sendEachForMulticast completed for request ${requestId} to sender ${senderId}. Success: ${response.successCount}, Failure: ${response.failureCount}.`
      );

      // Token Cleanup for sender
      const tokensToDeletePromises: Promise<any>[] = [];
      response.responses.forEach((result, index) => {
        const token = senderTokens[index];
        if (!result.success) {
          functions.logger.warn(
            `Failed to send acceptance notification to token: ${token} for sender ${senderId}. Error: ${result.error?.message}`,
            result.error
          );
          if (
            result.error?.code === "messaging/invalid-registration-token" ||
            result.error?.code === "messaging/registration-token-not-registered"
          ) {
            const tokenDocQuery = db.collection(`users/${senderId}/fcmTokens`).where("token", "==", token);
            tokensToDeletePromises.push(
              tokenDocQuery.get().then(querySnapshot => {
                querySnapshot.forEach(docSnapshot => {
                   functions.logger.info(`Deleting token document ${docSnapshot.id} for sender ${senderId}`);
                   docSnapshot.ref.delete().catch(err => functions.logger.error(`Error deleting token doc ${docSnapshot.id} for sender ${senderId}`, err));
                });
              }).catch(err => functions.logger.error(`Error querying for token doc to delete for sender ${senderId}`, err))
            );
          }
        }
      });
      if (tokensToDeletePromises.length > 0) {
        await Promise.all(tokensToDeletePromises);
        functions.logger.info(
          `Completed token cleanup for sender ${senderId} after acceptance notification for request ${requestId}.`
        );
      }
    } catch (error) {
      functions.logger.error(
        `Error sending acceptance FCM for request ${requestId} to sender ${senderId}:`,
        error
      );
    }

    return null;
  });

// Function to send notification when a new friend request is created
export const onFriendRequestCreated = functions.firestore
  .document("friendRequests/{requestId}")
  .onCreate(async (snapshot, context) => {
    const requestId = context.params.requestId;
    const requestData = snapshot.data();

    functions.logger.info(
      `New friend request ${requestId} created.`,
      { requestId, requestData }
    );

    // 1. Data Validation
    if (
      !requestData ||
      !requestData.recipientId ||
      !requestData.senderName ||
      requestData.status !== "pending"
    ) {
      functions.logger.warn(
        `Friend request ${requestId} data incomplete, invalid, or status not pending. Skipping notification.`,
        { requestData }
      );
      return null;
    }

    const recipientId = requestData.recipientId;
    const senderId = requestData.senderId;
    const senderName = requestData.senderName;

    // 2. Fetch Recipient's FCM Tokens
    let recipientTokens: string[];
    try {
      const tokensSnapshot = await db
        .collection(`users/${recipientId}/fcmTokens`)
        .get();
      if (tokensSnapshot.empty) {
        functions.logger.info(
          `No FCM tokens found for recipient ${recipientId} of friend request ${requestId}.`
        );
        return null;
      }
      // Assuming each document in fcmTokens has a 'token' field
      // Or, if the document ID is the token itself, use doc.id
      recipientTokens = tokensSnapshot.docs
        .map((doc) => doc.data().token as string) // Adjust if token is doc ID: .map(doc => doc.id)
        .filter((token) => typeof token === "string" && token.length > 0);

      if (recipientTokens.length === 0) {
        functions.logger.info(
          `No valid FCM tokens extracted for recipient ${recipientId}.`
        );
        return null;
      }
      functions.logger.info(
        `Found ${recipientTokens.length} token(s) for recipient ${recipientId}.`,
        { recipientTokens }
      );
    } catch (error) {
      functions.logger.error(
        `Error fetching tokens for recipient ${recipientId} (request ${requestId}):`,
        error
      );
      return null;
    }

    // 3. Construct FCM Payload
    const notificationPayload = {
      title: "New Friend Request",
      body: `${senderName} sent you a friend request.`,
      icon: requestData.senderPhotoURL || "/default-avatar.png", // Use sender's photo or a default
    };

    const dataPayload = {
      url: "/friends", // Path to the page where users can manage friend requests
      type: "friend_request",
      senderId: senderId,
      requestId: requestId,
    };

    functions.logger.info(
      `Prepared friend request notification for ${recipientId} from ${senderName}.`,
      { notificationPayload, dataPayload }
    );

    // 4. Send Notifications
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: recipientTokens,
        notification: notificationPayload,
        data: dataPayload,
      });

      functions.logger.info(
        `Friend request FCM sendEachForMulticast completed for ${requestId}. Success: ${response.successCount}, Failure: ${response.failureCount}.`
      );

      // 5. Token Cleanup
      const tokensToDeletePromises: Promise<any>[] = [];
      response.responses.forEach((result, index) => {
        const token = recipientTokens[index];
        if (!result.success) {
          functions.logger.warn(
            `Failed to send friend request notification to token: ${token}. Error: ${result.error?.message}`,
            result.error
          );
          if (
            result.error?.code === "messaging/invalid-registration-token" ||
            result.error?.code === "messaging/registration-token-not-registered"
          ) {
            functions.logger.info(
              `Scheduling deletion for invalid token: ${token} for user ${recipientId}.`
            );
            // Query for the document by the 'token' field and delete it.
            // This is safer if token is not the document ID.
            const tokenDocQuery = db.collection(`users/${recipientId}/fcmTokens`).where("token", "==", token);
            tokensToDeletePromises.push(
              tokenDocQuery.get().then(querySnapshot => {
                querySnapshot.forEach(docSnapshot => {
                   functions.logger.info(`Deleting token document ${docSnapshot.id} (token: ${token}) for user ${recipientId}`);
                   docSnapshot.ref.delete().catch(err => functions.logger.error(`Error deleting token doc ${docSnapshot.id}`, err));
                });
              }).catch(err => functions.logger.error(`Error querying for token doc to delete (token: ${token})`, err))
            );
          }
        }
      });

      if (tokensToDeletePromises.length > 0) {
        await Promise.all(tokensToDeletePromises);
        functions.logger.info(
          `Completed processing ${tokensToDeletePromises.length} invalid tokens for deletion for user ${recipientId}.`
        );
      }
    } catch (error) {
      functions.logger.error(
        `Error sending friend request FCM via sendEachForMulticast for request ${requestId}:`,
        error
      );
    }
    return null;
  });
