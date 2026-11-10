import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState(tokenStore.get() ? 'checking' : 'anonymous');

  const logout = useCallback(
    (reason) => {
      tokenStore.clear();
      setAdmin(null);
      setStatus('anonymous');
      navigate('/admin/login', { replace: true, state: reason ? { reason } : undefined });
    },
    [navigate],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAdmin(null);
      setStatus('anonymous');
      navigate('/admin/login', { replace: true, state: { reason: 'Sessiya muddati tugadi. Qayta kiring' } });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  useEffect(() => {
    if (status !== 'checking') return;
    api
      .get('/auth/me')
      .then((r) => {
        setAdmin(r.data.admin);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStore.clear();
        setStatus('anonymous');
      });
  }, [status]);

  const login = useCallback(async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    tokenStore.set(r.data.token);
    setAdmin(r.data.admin);
    setStatus('authenticated');
    return r.data.admin;
  }, []);

  const value = useMemo(() => ({ admin, status, login, logout }), [admin, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
