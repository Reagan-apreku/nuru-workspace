import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Attach Clerk session token to authenticated requests.
 * Call this once after Clerk loads with the getToken function.
 */
export function setAuthInterceptor(getToken) {
  api.interceptors.request.use(async (config) => {
    // Skip auth for public endpoints
    const publicPaths = ['/clients', '/feedback'];
    const isPublicPost = config.method === 'post' && publicPaths.some((p) => config.url === p);

    if (!isPublicPost) {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // No token available, proceed without auth
      }
    }

    return config;
  });
}

export default api;
