import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const pages = [];
  const push = (p) => pages.push(p);
  const window = 1;
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= window) push(p);
    else if (pages[pages.length - 1] !== '…') push('…');
  }

  const btn = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition';
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">{from}–{to}</span> / {total} ta
      </p>
      <nav className="flex items-center gap-1" aria-label="Sahifalar">
        <button
          type="button"
          className={`${btn} text-slate-600 hover:bg-slate-100 disabled:opacity-40`}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Oldingi sahifa"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${p === page ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${btn} text-slate-600 hover:bg-slate-100 disabled:opacity-40`}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Keyingi sahifa"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
