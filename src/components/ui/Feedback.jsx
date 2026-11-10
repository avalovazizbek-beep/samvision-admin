import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export function Spinner({ className = 'h-5 w-5', label }) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-500" role="status">
      <Loader2 className={`animate-spin text-brand-600 ${className}`} aria-hidden />
      {label && <span className="text-sm">{label}</span>}
      {!label && <span className="sr-only">Yuklanmoqda</span>}
    </span>
  );
}

export function PageLoader({ label = 'Yuklanmoqda…' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-7 w-7" label={label} />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Ma’lumotni yuklab bo‘lmadi', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center animate-fade-in" role="alert">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} className="mt-5" onClick={onRetry}>
          Qayta urinish
        </Button>
      )}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, icon: Icon, className = '' }) {
  const tones = {
    info: 'border-brand-200 bg-brand-50 text-brand-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  };
  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 text-sm ${tones[tone]} ${className}`}>
      {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  );
}
