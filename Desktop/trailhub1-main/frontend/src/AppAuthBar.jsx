// frontend/src/AppAuthBar.jsx
import React, { useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "./firebase";

export default function AppAuthBar() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in failed:", err);
      alert(err.message || "Sign-in failed");
    }
  }

  async function handleSignOut() {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Sign-out failed:", err);
      alert(err.message || "Sign-out failed");
    }
  }

  if (user) {
    return (
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="avatar"
            style={{ width: 28, height: 28, borderRadius: "50%" }}
          />
        )}
        <span style={{ fontSize: 13 }}>
          {user.displayName || user.email || "Signed in"}
        </span>
        <button onClick={handleSignOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: "auto" }}>
      <button onClick={handleSignIn}>Sign in with Google</button>
    </div>
  );
}
