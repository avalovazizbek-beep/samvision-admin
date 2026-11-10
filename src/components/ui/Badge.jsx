import { APPLICATION_STATUS, SAMVISION_STATUS } from '../../lib/statuses.js';

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-brand-50 text-brand-800 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
};

const DOTS = {
  slate: 'bg-slate-400',
  blue: 'bg-brand-500 animate-pulse',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function Badge({ tone = 'slate', dot = true, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = APPLICATION_STATUS[status] ?? { label: status, tone: 'slate' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function SamVisionBadge({ status }) {
  const s = SAMVISION_STATUS[status] ?? { label: status, tone: 'slate' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
