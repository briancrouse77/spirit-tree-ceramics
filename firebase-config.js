// ── Firebase Configuration ──────────────────────────────────────────────────
// PASTE YOUR FIREBASE CONFIG VALUES BELOW (from Firebase Console → Project Settings → Your apps)
// Then push to GitHub and Netlify/Pages will serve the updated site.

const firebaseConfig = {
  apiKey:            "PASTE_apiKey_HERE",
  authDomain:        "PASTE_authDomain_HERE",
  projectId:         "PASTE_projectId_HERE",
  storageBucket:     "PASTE_storageBucket_HERE",
  messagingSenderId: "PASTE_messagingSenderId_HERE",
  appId:             "PASTE_appId_HERE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
