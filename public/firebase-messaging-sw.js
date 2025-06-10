// Scripts for Firebase v9.6.10
// IMPORTANT: You must update these versions to the latest compatible Firebase SDK versions.
// See: https://firebase.google.com/docs/web/setup#available-libraries
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js");

// IMPORTANT: Replace this with your project's Firebase REAL configuration!
// This configuration is used by the service worker to initialize Firebase.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // TODO: Replace with your actual config
  authDomain: "YOUR_AUTH_DOMAIN", // TODO: Replace with your actual config
  projectId: "YOUR_PROJECT_ID", // TODO: Replace with your actual config
  storageBucket: "YOUR_STORAGE_BUCKET", // TODO: Replace with your actual config
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // TODO: Replace with your actual config
  appId: "YOUR_APP_ID", // TODO: Replace with your actual config
  // measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification?.title || "New Message";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new background message.",
    icon: payload.notification?.icon || "/firebase-logo.png", // A default icon
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || "/", // Default to open root
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click Received.", event.notification);

  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || new URL("/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, focus it.
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log("[firebase-messaging-sw.js] Service worker registered and listening for messages.");
