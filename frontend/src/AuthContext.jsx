import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = 'http://localhost:8000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cs_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('cs_token'));

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API}/auth/logout/`, {
          method: 'POST',
          headers: { Authorization: `Token ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('cs_token');
    setToken(null);
    setUser(null);
  }, [token]);

  // Verify stored token on mount
  useEffect(() => {
    let active = true;
    if (token) {
      fetch(`${API}/auth/profile/`, {
        headers: { Authorization: `Token ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!active) return;
          if (data) {
            setUser(data);
          } else {
            logout();
          }
        })
        .catch(() => {
          if (!active) return;
          logout();
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password, confirm_password, role) => {
    const res = await fetch(`${API}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, confirm_password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.is_admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
