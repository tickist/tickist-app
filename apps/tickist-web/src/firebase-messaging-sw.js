// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-app.js";
import {
    getMessaging,
    onBackgroundMessage,
    isSupported,
} from "https://www.gstatic.com/firebasejs/9.0.1/firebase-messaging-sw.js";

const app = initializeApp({
    apiKey: "AIzaSyDu-vOMokFGi5I3oV5tLN5PIqctHyCNcNg",
    authDomain: "proven-reality-657.firebaseapp.com",
    databaseURL: "https://proven-reality-657.firebaseio.com",
    projectId: "proven-reality-657",
    storageBucket: "proven-reality-657.appspot.com",
    messagingSenderId: "924613962771",
    appId: "1:924613962771:web:52fe355b5723d6af",
});

isSupported().then((isSupported) => {
    if (isSupported) {
        const messaging = getMessaging(app);

        onBackgroundMessage(messaging, function (payload) {
            console.log(
                "[firebase-messaging-sw.js] Received background message ",
                payload
            );
            // Customize notification here
            const notificationTitle = "Background Message Title";
            const notificationOptions = {
                body: "Background Message body.",
                icon: "/firebase-logo.png",
            };

            return self.registration.showNotification(
                notificationTitle,
                notificationOptions
            );
        });
    }
});

/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.
 // [START initialize_firebase_in_sw]
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 // importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-app.js');
 // importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-messaging.js');
 // Initialize the Firebase app in the service worker by passing in the
 // messagingSenderId.

 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();
 // [END initialize_firebase_in_sw]
 **/

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]

// [END background_handler]
