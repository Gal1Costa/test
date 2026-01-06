// frontend/src/api.js
import axios from "axios";
import { auth } from "./firebase";

// baseURL="/api" so all calls are prefixed with /api
// Components should call api.get('/me') not api.get('/api/me')
const api = axios.create({
  baseURL: "/api",
});

// Attach Firebase ID token (if logged in) to all requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    config.headers = config.headers || {};

    // Attach Firebase ID token when available (production flow)
    if (user) {
      const token = await user.getIdToken(/* forceRefresh */ true);
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Helper: delete current authenticated user (frontend convenience)
// Used by admin features for user management
async function deleteMe() {
  try {
    const res = await api.delete('/me');
    return res.data;
  } catch (err) {
    // rethrow so callers can handle
    throw err;
  }
}

export { deleteMe };