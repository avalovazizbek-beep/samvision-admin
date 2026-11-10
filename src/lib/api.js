import axios from 'axios';

/**
 * Backend API mijozi. Frontendda hech qanday Sam-Vision tokeni yoki maxfiy
 * ma'lumot yo‘q — barcha Sam-Vision so‘rovlari faqat backend orqali bajariladi.
 */
const TOKEN_KEY = 'sv_admin_token';

export const api = axios.create({
  // Standart: panel bilan bir joyda — "/api" yoki yo‘l ostida "/samvision/api"
  baseURL: import.meta.env.VITE_API_URL || `${import.meta.env.BASE_URL}api`,
  timeout: 60000,
});

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private rejim — sessiya faqat xotirada qoladi */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* e'tiborsiz */
    }
  },
};

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use((cfg) => {
  const token = tokenStore.get();
  if (token && !cfg.url?.startsWith('/public')) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    if (status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/public')) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Har qanday xatodan foydalanuvchiga ko‘rsatiladigan matn */
export function errorMessage(error, fallback = 'Xatolik yuz berdi. Qayta urinib ko‘ring') {
  if (!error) return fallback;
  if (error.code === 'ECONNABORTED') return 'Server javob bermadi (vaqt tugadi). Internetni tekshirib, qayta urinib ko‘ring';
  if (!error.response) return 'Serverga ulanib bo‘lmadi. Internet aloqasini tekshiring';
  const data = error.response.data;
  if (data instanceof Blob) return fallback;
  return data?.message || fallback;
}

/** Validatsiya xatolari { field: message } */
export function fieldErrors(error) {
  return error?.response?.data?.fields ?? {};
}

/** Fayl yuklab olish (Excel eksport) — token bilan */
export async function downloadFile(url, params, fallbackName) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const disposition = res.headers['content-disposition'] ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const name = match?.[1] ?? fallbackName;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
