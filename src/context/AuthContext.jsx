import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, deviceStore, setUnauthorizedHandler, tokenStore } from '../lib/api.js';
import { desktop } from '../lib/desktop.js';
import { lockProtected } from '../lib/protect.js';

const AuthContext = createContext(null);

/**
 * Kirish holatlari:
 *   checking      — tekshirilmoqda
 *   anonymous     — login + parol bilan kirish
 *   pin           — shu kompyuterda PIN o‘rnatilgan: PIN terib kiriladi
 *   pin-setup     — login + parol bilan kirildi, endi PIN o‘rnatish kerak (majburiy)
 *   authenticated — panel ochiq
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('checking');
  const hasDevice = useRef(false);

  const lockedState = () => (hasDevice.current ? 'pin' : 'anonymous');

  // Ilova ochilganda: sessiya bormi, shu kompyuterda PIN o‘rnatilganmi
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const device = await deviceStore.get().catch(() => null);
      hasDevice.current = Boolean(device);
      let next = lockedState();
      if (tokenStore.get()) {
        try {
          const r = await api.get('/auth/me');
          if (!cancelled) setAdmin(r.data.admin);
          next = device ? 'authenticated' : 'pin-setup';
        } catch {
          tokenStore.clear();
        }
      }
      if (!cancelled) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Chiqish = qulflash: PIN o‘rnatilgan bo‘lsa keyingi safar PIN so‘raladi */
  const logout = useCallback(
    (reason) => {
      tokenStore.clear();
      lockProtected();
      setAdmin(null);
      setStatus(lockedState());
      navigate('/admin/login', { replace: true, state: reason ? { reason } : undefined });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      lockProtected();
      setAdmin(null);
      setStatus(lockedState());
      navigate('/admin/login', { replace: true, state: { reason: 'Sessiya muddati tugadi. Qayta kiring' } });
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const login = useCallback(async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    tokenStore.set(r.data.token);
    setAdmin(r.data.admin);
    setStatus(hasDevice.current ? 'authenticated' : 'pin-setup');
    return r.data.admin;
  }, []);

  const setupPin = useCallback(async (pin) => {
    let deviceName = 'Brauzer';
    if (desktop) {
      const info = await desktop.getInfo().catch(() => null);
      deviceName = info?.hostname ? `Windows ilovasi · ${info.hostname}` : 'Windows ilovasi';
    }
    let r;
    try {
      r = await api.post('/auth/pin/setup', { pin, deviceName });
    } catch (err) {
      // Server hali eski versiyada (PIN qo‘llab-quvvatlanmaydi) — panelga PIN'siz kiritamiz
      if (err.response?.status === 404) {
        setStatus('authenticated');
        return;
      }
      throw err;
    }
    await deviceStore.set(r.data.deviceToken);
    hasDevice.current = true;
    setStatus('authenticated');
  }, []);

  /** Qurilmani unutish: PIN bekor qilinadi, login + parol bilan kiriladi */
  const forgetDevice = useCallback(async (reason) => {
    const deviceToken = await deviceStore.get().catch(() => null);
    if (deviceToken) await api.post('/auth/pin/forget', { deviceToken }).catch(() => {});
    await deviceStore.clear().catch(() => {});
    hasDevice.current = false;
    tokenStore.clear();
    setAdmin(null);
    setStatus('anonymous');
    navigate('/admin/login', { replace: true, state: reason ? { reason } : undefined });
  }, [navigate]);

  const pinLogin = useCallback(
    async (pin) => {
      const deviceToken = await deviceStore.get();
      try {
        const r = await api.post('/auth/pin/login', { deviceToken, pin });
        tokenStore.set(r.data.token);
        setAdmin(r.data.admin);
        setStatus('authenticated');
      } catch (err) {
        const code = err.response?.data?.code;
        // Qurilma bekor qilingan yoki bloklangan — endi faqat login + parol
        if (code === 'PIN_LOCKED' || code === 'PIN_DEVICE_UNKNOWN' || code === 'VALIDATION') {
          await deviceStore.clear().catch(() => {});
          hasDevice.current = false;
          setStatus('anonymous');
          navigate('/admin/login', { replace: true, state: { reason: err.response?.data?.message } });
          return;
        }
        throw err;
      }
    },
    [navigate],
  );

  const value = useMemo(
    () => ({ admin, status, login, logout, setupPin, pinLogin, forgetDevice }),
    [admin, status, login, logout, setupPin, pinLogin, forgetDevice],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
