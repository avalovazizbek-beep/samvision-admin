import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  CalendarCheck2,
  ClipboardList,
  DoorOpen,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  PlugZap,
  UsersRound,
  X,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { PageLoader } from '../components/ui/Feedback.jsx';
import DesktopUpdateBanner from '../components/admin/DesktopUpdateBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/format.js';
import { desktop } from '../lib/desktop.js';

/** Windows ilovasida: versiya, server manzili va yangilanish tugmasi */
function DesktopFooter() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    desktop?.getInfo().then(setInfo).catch(() => {});
  }, []);
  if (!desktop || !info) return null;
  return (
    <div className="space-y-1 border-t border-slate-200 px-5 py-2.5 text-[11px] text-slate-400">
      <p className="truncate" title={info.serverUrl}>
        Versiya {info.version} · {info.serverUrl.replace(/^https?:\/\//, '')}
      </p>
      <div className="flex gap-3">
        <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => desktop.checkForUpdates()}>
          Yangilanishni tekshirish
        </button>
        <button type="button" className="font-semibold text-slate-500 hover:underline" onClick={() => desktop.openSettings()}>
          Server manzili
        </button>
      </div>
    </div>
  );
}

/**
 * «Ro‘yxatdan o‘tish sahifasi» havolasi (frontend alohida saytda):
 * brauzerda — VITE_PUBLIC_SITE_URL; Windows ilovasida — ilova sozlamalaridagi manzil.
 */
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || '';

function PublicPageLink() {
  const [publicUrl, setPublicUrl] = useState(desktop ? null : PUBLIC_SITE_URL);
  useEffect(() => {
    desktop?.getInfo().then((i) => setPublicUrl(i.publicUrl || PUBLIC_SITE_URL)).catch(() => {});
  }, []);
  if (!publicUrl) return null;
  const cls = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900';
  if (desktop) {
    return (
      <button type="button" className={`${cls} w-full`} onClick={() => desktop.openExternal(publicUrl)}>
        <ExternalLink className="h-[18px] w-[18px]" aria-hidden />
        Ro‘yxatdan o‘tish sahifasi
      </button>
    );
  }
  return (
    <a href={publicUrl} target="_blank" rel="noreferrer" className={cls}>
      <ExternalLink className="h-[18px] w-[18px]" aria-hidden />
      Ro‘yxatdan o‘tish sahifasi
    </a>
  );
}

const NAV = [
  {
    title: 'Ro‘yxatdan o‘tish',
    items: [
      { to: '/admin', label: 'Boshqaruv paneli', icon: LayoutDashboard, end: true },
      { to: '/admin/arizalar', label: 'Arizalar', icon: ClipboardList },
      { to: '/admin/bolimlar', label: 'Bo‘limlar', icon: Building2 },
    ],
  },
  {
    title: 'Sam-Vision',
    items: [
      { to: '/admin/davomat', label: 'Davomat', icon: CalendarCheck2 },
      { to: '/admin/xodimlar', label: 'Xodimlar va talabalar', icon: UsersRound },
      { to: '/admin/qurilmalar', label: 'Qurilmalar', icon: MonitorSmartphone },
      { to: '/admin/kirish-chiqish', label: 'Kirish-chiqish jurnali', icon: DoorOpen },
    ],
  },
  {
    title: 'Tizim',
    items: [
      { to: '/admin/integratsiya', label: 'Integratsiya', icon: PlugZap },
      { to: '/admin/jurnal', label: 'Audit jurnali', icon: History },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  const { admin, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Asosiy menyu">
        {NAV.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-brand-700 text-white shadow-sm shadow-brand-700/30' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <PublicPageLink />
      </nav>
      <DesktopFooter />
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
            {initials(admin?.fullName || admin?.username) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{admin?.fullName || admin?.username}</p>
            <p className="truncate text-xs text-slate-500">Administrator</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Chiqish"
            title="Chiqish"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { status } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (status === 'checking') return <PageLoader label="Sessiya tekshirilmoqda…" />;
  if (status !== 'authenticated') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-dvh bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl animate-slide-up">
            <button
              type="button"
              className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Menyuni yopish"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Menyuni ochish"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <DesktopUpdateBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
