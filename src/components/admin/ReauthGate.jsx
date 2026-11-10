import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, Unlock, User } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Alert } from '../ui/Feedback.jsx';
import { api, errorMessage } from '../../lib/api.js';
import { isUnlocked, lockProtected, unlockProtected, unlockRemainingMs } from '../../lib/protect.js';

/**
 * Himoyalangan bo‘lim: ichidagi narsa to‘g‘ridan-to‘g‘ri ko‘rinmaydi —
 * administrator login va parolini qayta kiritgandan keyin (server tekshiradi) 10 daqiqaga ochiladi.
 */
export default function ReauthGate({ title, description, children }) {
  const [open, setOpen] = useState(isUnlocked);

  // Vaqt tugaganda o‘zi yopiladi
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => setOpen(false), unlockRemainingMs() + 50);
    return () => clearTimeout(t);
  }, [open]);

  if (open) {
    return (
      <>
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              lockProtected();
              setOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Lock className="h-3.5 w-3.5" /> Bo‘limni yopish
          </button>
        </div>
        {children}
      </>
    );
  }
  return <UnlockForm title={title} description={description} onUnlocked={() => setOpen(true)} />;
}

function UnlockForm({ title, description, onUnlocked }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Login va parolni kiriting');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reauth', { username: username.trim(), password });
      unlockProtected();
      onUnlocked();
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'Server hali eski versiyada — backendni yangilang (deploy/update.sh)'
          : errorMessage(err, 'Login yoki parol noto‘g‘ri'),
      );
      setPassword('');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <form onSubmit={submit} className="card w-full max-w-md p-6 sm:p-8" noValidate>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        <div className="mt-5 space-y-4">
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              className="field-input pl-10"
              placeholder="Login"
              aria-label="Login"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type={show ? 'text' : 'password'}
              className="field-input pr-11 pl-10"
              placeholder="Parol"
              aria-label="Parol"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={show ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
            >
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          <Button type="submit" icon={Unlock} loading={loading} className="w-full">
            Ochish
          </Button>
        </div>
      </form>
    </div>
  );
}
