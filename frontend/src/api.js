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
    
    // Dev convenience: when `localStorage.dev_user` is present, send it as x-dev-user
    // so the backend (when in dev mode) can accept a dev user for local testing
    try {
      const devUserJson = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('dev_user');
      if (devUserJson) {
        config.headers['x-dev-user'] = devUserJson;
      }
    } catch (e) {
      // ignore localStorage errors
    }

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
