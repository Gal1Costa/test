// frontend/src/api.js
import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: "http://localhost:3000", // backend
});

// Attach Firebase ID token (if logged in) to all requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    config.headers = config.headers || {};

    if (user) {
      // User is signed in with Firebase → get ID token
      const token = await user.getIdToken(/* forceRefresh */ false);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Optional: dev fallback (only if you still want x-dev-user when not logged in)
      if (import.meta.env.DEV) {
        config.headers["x-dev-user"] = JSON.stringify({
          id: "11111111-1111-1111-1111-111111111111",
          role: "hiker",
          email: "hiker@example.com",
          name: "Demo Hiker",
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
