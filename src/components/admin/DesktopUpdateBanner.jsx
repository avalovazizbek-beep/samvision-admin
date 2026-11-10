import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2, RefreshCw, Sparkles, TriangleAlert, X } from 'lucide-react';
import { desktop } from '../../lib/desktop.js';

/**
 * Windows ilovasida yangi versiya haqida xabar:
 *   available   → «Yangi versiya X mavjud» + [Yangilash]
 *   downloading → jarayon foizi
 *   installing  → yangi versiya o‘zi o‘rnatilmoqda, dastur qayta ochiladi (hech narsa bosish shart emas)
 * Dasturni o‘chirib qayta o‘rnatish kerak emas.
 */
export default function DesktopUpdateBanner() {
  const [status, setStatus] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!desktop) return undefined;
    desktop.getUpdateStatus().then(setStatus).catch(() => {});
    return desktop.onUpdateStatus((s) => {
      setStatus(s);
      setHidden(false);
    });
  }, []);

  if (!desktop || !status || hidden) return null;
  const { state } = status;
  const show = ['available', 'downloading', 'downloaded', 'installing'].includes(state) || (status.manual && ['none', 'error', 'dev'].includes(state));
  if (!show) return null;

  const tone =
    state === 'error'
      ? 'border-red-200 bg-red-50 text-red-900'
      : state === 'none' || state === 'dev'
        ? 'border-slate-200 bg-white text-slate-700'
        : state === 'installing'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-brand-200 bg-brand-50 text-brand-900';

  return (
    <div className={`mb-5 flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-card sm:flex-row sm:items-center ${tone}`} role="status">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {state === 'available' && <Sparkles className="h-5 w-5 shrink-0 text-brand-600" />}
        {state === 'downloading' && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-600" />}
        {state === 'downloaded' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
        {state === 'installing' && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-600" />}
        {state === 'error' && <TriangleAlert className="h-5 w-5 shrink-0 text-red-600" />}
        {(state === 'none' || state === 'dev') && <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-400" />}
        <div className="min-w-0">
          {state === 'available' && (
            <p>
              <b>Yangi versiya {status.version} mavjud.</b> «Yangilash» ni bosing — yangi versiya o‘zi yuklanib o‘rnatiladi, dastur qayta
              ochiladi. Sozlamalar va PIN kod saqlanadi.
            </p>
          )}
          {state === 'downloading' && (
            <div>
              <p>Yangilanish yuklab olinmoqda… {status.percent ?? 0}%</p>
              <div className="mt-1.5 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${status.percent ?? 0}%` }} />
              </div>
            </div>
          )}
          {state === 'downloaded' && (
            <p>
              <b>Versiya {status.version} tayyor.</b> O‘rnatish uchun dastur qayta ishga tushadi.
            </p>
          )}
          {state === 'installing' && (
            <p>
              <b>Versiya {status.version} o‘rnatilmoqda…</b> Dastur bir necha soniyada yopilib, yangi versiyada qayta ochiladi.
            </p>
          )}
          {state === 'error' && <p>Yangilanishni tekshirib bo‘lmadi: {status.message}</p>}
          {state === 'none' && <p>Sizda eng so‘nggi versiya ({status.version}).</p>}
          {state === 'dev' && <p>{status.message}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {state === 'available' && (
          <button
            type="button"
            onClick={() => desktop.downloadUpdate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 font-semibold text-white hover:bg-brand-800"
          >
            <Download className="h-4 w-4" /> Yangilash
          </button>
        )}
        {state === 'downloaded' && (
          <button
            type="button"
            onClick={() => desktop.installUpdate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 font-semibold text-white hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" /> Qayta ishga tushirish
          </button>
        )}
        {!['downloading', 'installing'].includes(state) && (
          <button type="button" onClick={() => setHidden(true)} className="rounded-lg p-1.5 opacity-60 hover:bg-black/5 hover:opacity-100" aria-label="Yopish">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
