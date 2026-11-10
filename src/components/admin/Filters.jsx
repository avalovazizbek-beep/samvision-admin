import { CalendarDays, CalendarRange } from 'lucide-react';
import { currentMonth } from '../../lib/format.js';

/* ------------------------------ Davr tanlagich ------------------------------ */

const tz = () => new Date(Date.now() + 5 * 3600 * 1000); // Toshkent
const iso = (d) => d.toISOString().slice(0, 10);

function presets() {
  const now = tz();
  const today = iso(now);
  const weekday = (now.getUTCDay() + 6) % 7; // 0 = dushanba
  const monday = new Date(now.getTime() - weekday * 86400000);
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return [
    { label: 'Bugun', value: { from: today, to: today } },
    { label: 'Shu hafta', value: { from: iso(monday), to: today } },
    { label: 'Shu oy', value: { month: currentMonth() } },
    { label: 'O‘tgan oy', value: { month: prev.toISOString().slice(0, 7) } },
  ];
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** "YYYY-MM" → oyning 1-kunidan oxirigacha (joriy oy bo‘lsa — bugungacha) */
function monthToRange(month) {
  const [y, m] = month.split('-').map(Number);
  const last = iso(new Date(Date.UTC(y, m, 0)));
  const today = iso(tz());
  return { from: `${month}-01`, to: today.startsWith(month) ? today : last };
}

/** value: { month: 'YYYY-MM' } | { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } */
export function PeriodPicker({ value, onChange }) {
  const isRange = Boolean(value.from);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {presets().map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              same(p.value, value) ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {isRange ? (
        <div className="flex items-center gap-1.5">
          <CalendarRange className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="date"
            className="field-input h-10 w-[150px] py-1.5 text-sm"
            value={value.from}
            max={value.to}
            onChange={(e) => e.target.value && onChange({ from: e.target.value, to: value.to })}
            aria-label="Boshlanish sanasi"
          />
          <span className="text-slate-400">—</span>
          <input
            type="date"
            className="field-input h-10 w-[150px] py-1.5 text-sm"
            value={value.to}
            min={value.from}
            onChange={(e) => e.target.value && onChange({ from: value.from, to: e.target.value })}
            aria-label="Tugash sanasi"
          />
          <button type="button" className="text-xs font-medium text-brand-700 hover:underline" onClick={() => onChange({ month: value.from.slice(0, 7) })}>
            Oy bo‘yicha
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="month"
            className="field-input h-10 w-[170px] py-1.5 text-sm"
            value={value.month}
            onChange={(e) => e.target.value && onChange({ month: e.target.value })}
            aria-label="Oy"
          />
          <button type="button" className="text-xs font-medium text-brand-700 hover:underline" onClick={() => onChange(monthToRange(value.month))}>
            Sana oralig‘i
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Hammasi / Xodimlar / Talabalar ------------------------------ */

const TYPES = [
  { value: '', label: 'Hammasi', countKey: 'all' },
  { value: 'EMPLOYEE', label: 'Xodimlar', countKey: 'EMPLOYEE' },
  { value: 'STUDENT', label: 'Talabalar', countKey: 'STUDENT' },
];

export function TypeTabs({ value, onChange, counts }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Turi">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            value === t.value ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.label}
          {counts && counts[t.countKey] != null && <span className="ml-1.5 text-xs font-medium text-slate-400 tabular-nums">{counts[t.countKey]}</span>}
        </button>
      ))}
    </div>
  );
}

/** Davrni URL/so‘rov parametrlariga aylantirish */
export const periodParams = (p) => (p.month ? { month: p.month } : { from: p.from, to: p.to });
export const periodText = (p) => (p.month ? p.month : `${p.from} — ${p.to}`);
