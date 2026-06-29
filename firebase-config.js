// ── Firebase Configuration ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCtJCXA4UmNU3zWq778ZcOPvTOxZE6HRJE",
  authDomain:        "spirit-tree-ceramics.firebaseapp.com",
  projectId:         "spirit-tree-ceramics",
  storageBucket:     "spirit-tree-ceramics.firebasestorage.app",
  messagingSenderId: "820287397307",
  appId:             "1:820287397307:web:0265203ed7e7c638d6389e",
  measurementId:     "G-0RG8MXX2WS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
