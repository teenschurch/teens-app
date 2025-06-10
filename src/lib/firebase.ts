import { initializeApp, getApps, type FirebaseApp } from "firebase/app" // Added getApps, FirebaseApp
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging" // Added FCM imports

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize Firebase Cloud Messaging and get a reference to the service
export let fcmMessaging: Messaging | null = null;

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
  if (getApps().length > 0) { // Ensure Firebase app is initialized
    fcmMessaging = getMessaging(app);

    // Handle foreground messages
    onMessage(fcmMessaging, (payload) => {
      console.log("Foreground message received. ", payload);
      // Customize notification here
      const notificationTitle = payload.notification?.title || "New Message";
      const notificationOptions = {
        body: payload.notification?.body || "You have a new message.",
        icon: payload.notification?.icon || "/firebase-logo.png", // Default icon
      };
      new Notification(notificationTitle, notificationOptions);
    });
  }
} else {
  if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.warn(
      "Firebase VAPID key (NEXT_PUBLIC_FIREBASE_VAPID_KEY) is not set. FCM will not be initialized."
    );
  }
}

export async function requestNotificationPermission(appInstance: FirebaseApp, userId?: string) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.log(
      "Notification permission cannot be requested: Not in browser environment or VAPID key missing."
    );
    return null;
  }

  if (!fcmMessaging) {
    console.log("FCM Messaging not initialized. Cannot request permission.");
    return null;
  }

  console.log("Requesting notification permission...");
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error("VAPID key is missing. Cannot get FCM token.");
        return null;
      }
      const currentToken = await getToken(fcmMessaging, { vapidKey: vapidKey });
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        // TODO: Send this token to your server and save it associated with the user (e.g., in Firestore)
        // Example: if (userId) { saveTokenToFirestore(currentToken, userId); }
        return currentToken;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.log("Notification permission denied.");
      return null;
    }
  } catch (error) {
    console.error("Error getting notification permission or token: ", error);
    return null;
  }
}

export default app;