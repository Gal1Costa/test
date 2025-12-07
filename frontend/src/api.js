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
      // Force refresh token to ensure we have the latest user data
      const token = await user.getIdToken(/* forceRefresh */ true);
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
