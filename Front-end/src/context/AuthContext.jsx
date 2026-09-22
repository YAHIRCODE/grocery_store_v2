import { useState, useEffect } from 'react';
import { AuthContext } from './authContextObject';
import api, { ensureCsrfCookie } from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // La sesión vive en una cookie HttpOnly que JS no puede leer, así que la
  // única forma de saber si ya hay sesión activa (p.ej. tras recargar la
  // página) es preguntarle al backend.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/me')
      .then((response) => setUser(response.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    await ensureCsrfCookie();
    const response = await api.post('/login', { email, password });
    setUser(response.data.user);
    return response.data.user;
  }

  async function logout() {
    try {
      await api.post('/logout');
    } catch {
      // ignore
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}