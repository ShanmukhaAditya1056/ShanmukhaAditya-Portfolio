import axios from 'axios';

// Same-origin by default (Vite proxies /api in dev; Express serves the build in prod).
// Set VITE_API_URL when the API is hosted on a different domain.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
