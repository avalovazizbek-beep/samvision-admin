import { useState } from 'react';

/**
 * Logotip uchun joy.
 * Haqiqiy Sam-Vision logotipini frontend/public/logo.svg (yoki VITE_LOGO_URL) sifatida joylang —
 * fayl topilmasa, vaqtinchalik belgi va matn ko‘rsatiladi.
 */
const BASE = import.meta.env.BASE_URL;
const LOGO_URL = import.meta.env.VITE_LOGO_URL || `${BASE}logo.svg`;

export default function Logo({ inverted = false, compact = false, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={LOGO_URL}
        alt="Sam-Vision"
        className={`h-9 w-auto ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src={`${BASE}logo-mark.svg`} alt="" className="h-9 w-9" aria-hidden />
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-[17px] font-bold tracking-tight ${inverted ? 'text-white' : 'text-slate-900'}`}>
            Sam-Vision
          </span>
          <span className={`block text-[11px] font-medium uppercase tracking-wider ${inverted ? 'text-brand-200' : 'text-slate-500'}`}>
            Xodimlar ro‘yxati
          </span>
        </span>
      )}
    </span>
  );
}
