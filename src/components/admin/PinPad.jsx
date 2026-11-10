import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, Loader2 } from 'lucide-react';

export const PIN_LENGTH = 4;

/** 1111, 1234, 4321 kabi oson PIN'lar (backenddagi tekshiruv bilan bir xil) */
export function isWeakPin(pin) {
  if (new Set(pin).size === 1) return true;
  const d = [...pin].map(Number);
  const step = d[1] - d[0];
  return Math.abs(step) === 1 && d.every((v, i) => i === 0 || v - d[i - 1] === step);
}

/**
 * PIN kod terish: nuqtalar + raqamli klaviatura (sichqoncha bilan ham, klaviaturadan ham).
 * 4-raqam terilishi bilan onComplete(pin) chaqiriladi. `resetKey` o‘zgarsa — maydon tozalanadi.
 */
export default function PinPad({ onComplete, busy = false, error = '', resetKey = 0 }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setPin('');
  }, [resetKey]);

  useEffect(() => {
    if (!error) return undefined;
    setShake(true);
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [error, resetKey]);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  // 4-raqam terilganda — biroz kutib (oxirgi nuqta ko‘rinsin) natijani beramiz
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return undefined;
    const t = setTimeout(() => completeRef.current(pin), 120);
    return () => clearTimeout(t);
  }, [pin]);

  const press = useCallback(
    (digit) => {
      if (busy) return;
      setPin((p) => (p.length >= PIN_LENGTH ? p : p + digit));
    },
    [busy],
  );
  const back = useCallback(() => !busy && setPin((p) => p.slice(0, -1)), [busy]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        back();
      } else if (e.key === 'Escape') {
        setPin('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, back]);

  const keyCls =
    'flex h-14 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 active:bg-slate-100 disabled:opacity-50';

  return (
    <div className="select-none">
      <div className={`flex h-10 items-center justify-center gap-4 ${shake ? 'animate-shake' : ''}`} aria-live="polite" aria-label={`${pin.length} ta raqam terildi`}>
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        ) : (
          Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full transition ${
                error && !pin ? 'bg-red-400' : i < pin.length ? 'scale-110 bg-brand-700' : 'bg-slate-200'
              }`}
            />
          ))
        )}
      </div>
      <p className="mt-2 min-h-5 text-center text-sm text-red-600" role="alert">
        {error}
      </p>
      <div className="mx-auto mt-3 grid max-w-[280px] grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className={keyCls} onClick={() => press(d)} disabled={busy}>
            {d}
          </button>
        ))}
        <span />
        <button type="button" className={keyCls} onClick={() => press('0')} disabled={busy}>
          0
        </button>
        <button type="button" className={`${keyCls} text-slate-500`} onClick={back} disabled={busy} aria-label="O‘chirish">
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
