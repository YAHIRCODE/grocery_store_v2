import { useState } from 'react';
import { AuthContext } from './authContextObject';
import api from '../services/api';

function getStoredUser() {
  const storedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (storedUser && token) {
    return JSON.parse(storedUser);
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading] = useState(false);

  async function login(email, password) {
    const response = await api.post('/login', { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  function logout() {
    api.post('/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
