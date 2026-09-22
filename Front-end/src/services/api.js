import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

// Autenticación por cookie de sesión HttpOnly (Sanctum stateful), no por
// token Bearer en localStorage: withCredentials manda/recibe la cookie de
// sesión, withXSRFToken adjunta el header X-XSRF-TOKEN (requerido cross-site,
// axios no lo hace automático fuera de same-site) leyendo la cookie
// XSRF-TOKEN que Laravel expone sin HttpOnly justo para esto.
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  withXSRFToken: true,
});

// Debe llamarse antes de cualquier POST/PUT/PATCH/DELETE que dependa de una
// sesión nueva (típicamente antes de /login): sin esto no hay cookie
// XSRF-TOKEN todavía y Laravel rechaza la petición con 419.
export function ensureCsrfCookie() {
  return axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true });
}

export default api;
