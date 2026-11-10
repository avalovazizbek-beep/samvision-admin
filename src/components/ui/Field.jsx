import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/** Yorliq, xato va maslahat matni bilan forma maydoni */
export function Field({ label, required, error, hint, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ label, required, error, hint, className, inputClassName = '', ...props }) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(a11y) => <input className={`field-input ${inputClassName}`} required={required} {...a11y} {...props} />}
    </Field>
  );
}

export function SelectInput({ label, required, error, hint, className, children, ...props }) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(a11y) => (
        <div className="relative">
          <select className="field-input appearance-none pr-10" required={required} {...a11y} {...props}>
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
        </div>
      )}
    </Field>
  );
}

export function TextArea({ label, required, error, hint, className, ...props }) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(a11y) => <textarea className="field-input min-h-24 resize-y" required={required} {...a11y} {...props} />}
    </Field>
  );
}
