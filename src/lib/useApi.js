import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api.js';

/**
 * GET so‘rovi uchun oddiy hook: { data, error, loading, reload }.
 * params o‘zgarsa qayta yuklanadi; eski javob yangisini bosib ketmaydi.
 */
export function useApi(url, params, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(enabled && url));
  const seq = useRef(0);
  const key = JSON.stringify(params ?? {});

  const reload = useCallback(async () => {
    if (!enabled || !url) return;
    const id = ++seq.current;
    setLoading(true);
    setError('');
    try {
      const r = await api.get(url, { params: JSON.parse(key) });
      if (id === seq.current) setData(r.data);
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [url, key, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
