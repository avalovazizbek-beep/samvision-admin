import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import Button from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../lib/api.js';

export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'authenticated') return <Navigate to={location.state?.from || '/admin'} replace />;

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
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Kirishda xatolik'));
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Administrator paneli</h1>
          <p className="mt-1 text-sm text-slate-500">Davom etish uchun tizimga kiring</p>

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
        </div>
      </div>
    </div>
  );
}
