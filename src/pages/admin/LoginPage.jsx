import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, LogIn, ShieldCheck, User } from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import Button from '../../components/ui/Button.jsx';
import { Alert, PageLoader } from '../../components/ui/Feedback.jsx';
import PinPad, { isWeakPin } from '../../components/admin/PinPad.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../lib/api.js';

/* ------------------------------ Login + parol ------------------------------ */

function PasswordForm() {
  const { login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Login va parolni kiriting');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(errorMessage(err, 'Kirishda xatolik'));
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Administrator paneli</h1>
      <p className="mt-1 text-sm text-slate-500">Login va parol bilan kiring. Keyin shu kompyuter uchun PIN kod o‘rnatasiz</p>

      {location.state?.reason && !error && (
        <Alert tone="warn" className="mt-5">
          {location.state.reason}
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
            Login
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="username"
              className="field-input pl-10"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Parol
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={show ? 'text' : 'password'}
              className="field-input pr-11 pl-10"
              autoComplete="current-password"
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
        </div>
        <Button type="submit" size="lg" icon={LogIn} loading={loading} className="w-full">
          Kirish
        </Button>
      </form>
    </>
  );
}

/* ------------------------------ PIN bilan kirish ------------------------------ */

function PinUnlock() {
  const { pinLogin, forgetDevice } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);

  async function submit(pin) {
    setBusy(true);
    setError('');
    try {
      await pinLogin(pin);
    } catch (err) {
      setError(errorMessage(err, 'PIN kod noto‘g‘ri'));
      setResetKey((k) => k + 1);
      setBusy(false);
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Lock className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">PIN kodni kiriting</h1>
      <p className="mt-1 text-sm text-slate-500">Shu kompyuter uchun o‘rnatilgan 4 xonali PIN kod</p>
      {location.state?.reason && !error && (
        <Alert tone="warn" className="mt-5 text-left">
          {location.state.reason}
        </Alert>
      )}
      <div className="mt-6">
        <PinPad onComplete={submit} busy={busy} error={error} resetKey={resetKey} />
      </div>
      <button
        type="button"
        onClick={() => forgetDevice('PIN kod bekor qilindi. Login va parol bilan kirib, yangisini o‘rnating')}
        className="mt-6 text-sm font-semibold text-brand-700 hover:underline"
      >
        PIN kodni unutdingizmi? Login va parol bilan kirish
      </button>
    </div>
  );
}

/* ------------------------------ PIN o‘rnatish ------------------------------ */

function PinSetup() {
  const { setupPin, logout } = useAuth();
  const [first, setFirst] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const restart = (message) => {
    setFirst(null);
    setError(message);
    setResetKey((k) => k + 1);
  };

  async function onComplete(pin) {
    if (!first) {
      if (isWeakPin(pin)) {
        restart('Bu PIN juda oson (1111, 1234 kabi). Boshqasini tanlang');
        return;
      }
      setFirst(pin);
      setError('');
      setResetKey((k) => k + 1);
      return;
    }
    if (pin !== first) {
      restart('PIN kodlar mos kelmadi. Qaytadan kiriting');
      return;
    }
    setBusy(true);
    try {
      await setupPin(pin);
    } catch (err) {
      setBusy(false);
      restart(errorMessage(err, 'PIN kodni saqlab bo‘lmadi'));
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {first ? <ShieldCheck className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{first ? 'PIN kodni takrorlang' : 'PIN kod o‘rnating'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {first
          ? 'Tasdiqlash uchun shu 4 raqamni yana bir bor tering'
          : 'Keyingi safar dasturga login va parolsiz — shu 4 xonali PIN kod bilan kirasiz'}
      </p>
      <div className="mt-6">
        <PinPad onComplete={onComplete} busy={busy} error={error} resetKey={resetKey} />
      </div>
      <button type="button" onClick={() => logout()} className="mt-6 text-sm font-semibold text-slate-500 hover:underline">
        Bekor qilish va chiqish
      </button>
    </div>
  );
}

/* ------------------------------ Sahifa ------------------------------ */

export default function LoginPage() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <PageLoader label="Yuklanmoqda…" />;
  if (status === 'authenticated') {
    const to = location.state?.from && location.state.from !== '/admin/login' ? location.state.from : '/admin';
    return <Navigate to={to} replace />;
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 lg:block">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <span className="inline-flex w-fit rounded-xl bg-white/95 px-3 py-2">
            <Logo />
          </span>
          <div>
            <h2 className="text-3xl font-bold leading-tight">Xodimlarni ro‘yxatdan o‘tkazish boshqaruvi</h2>
            <p className="mt-3 max-w-md text-brand-100">
              Arizalarni ko‘rib chiqing, tasdiqlang va xodimlarni Sam-Vision bazasiga bir bosishda qo‘shing.
            </p>
          </div>
          <p className="text-sm text-brand-200">© {new Date().getFullYear()} Sam-Vision</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {status === 'pin' && <PinUnlock />}
          {status === 'pin-setup' && <PinSetup />}
          {status === 'anonymous' && <PasswordForm />}
        </div>
      </div>
    </div>
  );
}
