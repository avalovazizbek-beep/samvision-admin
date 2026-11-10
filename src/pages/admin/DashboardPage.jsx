import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudOff,
  CloudUpload,
  DoorOpen,
  Inbox,
  MonitorSmartphone,
  RefreshCw,
  ShieldX,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { StatusBadge, SamVisionBadge } from '../../components/ui/Badge.jsx';
import { Alert, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { api, errorMessage } from '../../lib/api.js';
import { dayLabel, initials, timeAgo } from '../../lib/format.js';

const CARD_TONES = {
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
};

function StatCard({ icon: Icon, label, value, tone = 'brand', to, sub }) {
  const body = (
    <div className="card group flex h-full items-start gap-4 p-5 transition hover:shadow-lift">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${CARD_TONES[tone]}`}>
        <Icon className="h-[22px] w-[22px]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded-2xl focus-visible:outline-offset-4">
      {body}
    </Link>
  ) : (
    body
  );
}

function DailyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="card p-5">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Oxirgi 14 kundagi arizalar</h2>
          <p className="text-sm text-slate-500">Jami: {total} ta</p>
        </div>
      </div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2" role="img" aria-label={`Oxirgi 14 kunda ${total} ta ariza`}>
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className="w-full rounded-t-md bg-brand-200 transition group-hover:bg-brand-500"
              style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100">
              {d.count} ta
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center text-[10px] text-slate-400 sm:text-[11px]">
            {i % 2 === 0 ? dayLabel(d.day) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-[92px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [sv, setSv] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, st] = await Promise.all([api.get('/admin/stats'), api.get('/admin/samvision/status')]);
      setStats(s.data);
      setSv(st.data);
      if (!st.data.issues?.length) {
        api
          .get('/admin/sv/dashboard')
          .then((r) => setToday(r.data))
          .catch(() => setToday(null));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Boshqaruv paneli"
        description="Ro‘yxatdan o‘tish arizalari va Sam-Vision integratsiyasi holati"
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load} loading={loading && !!stats}>
            Yangilash
          </Button>
        }
      />

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : !stats ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {sv?.issues?.length > 0 && (
            <Alert tone="warn" icon={AlertTriangle} title="Sam-Vision integratsiyasi to‘liq sozlanmagan">
              {sv.issues.join('; ')}.{' '}
              <Link to="/admin/integratsiya" className="font-semibold underline">
                Batafsil
              </Link>
            </Alert>
          )}
          {stats.samvisionError > 0 && (
            <Alert tone="error" icon={CloudOff} title={`${stats.samvisionError} ta xodim Sam-Vision’ga xatolik bilan yuborilgan`}>
              <Link to="/admin/arizalar?samvisionStatus=ERROR" className="font-semibold underline">
                Ko‘rish va qayta yuborish
              </Link>
            </Alert>
          )}

          {today && (
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Sam-Vision — bugun</h2>
                <Link to="/admin/davomat" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                  Davomat <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 divide-slate-100 sm:grid-cols-4 sm:divide-x">
                {[
                  { label: 'O‘tishlar (ruxsat)', value: today.grantedToday, to: '/admin/kirish-chiqish', tone: 'text-emerald-700', icon: DoorOpen },
                  { label: 'Rad etilgan', value: today.deniedToday, to: '/admin/kirish-chiqish', tone: 'text-red-600', icon: ShieldX },
                  { label: 'Onlayn qurilmalar', value: `${today.onlineDevices} / ${today.onlineDevices + today.offlineDevices}`, to: '/admin/qurilmalar', tone: 'text-slate-900', icon: MonitorSmartphone },
                  { label: 'Bazadagi odamlar', value: today.totalPersonnel, to: '/admin/xodimlar', tone: 'text-slate-900', icon: UsersRound },
                ].map((c) => (
                  <Link key={c.label} to={c.to} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
                    <c.icon className="h-5 w-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">{c.label}</p>
                      <p className={`text-xl font-bold tabular-nums ${c.tone}`}>{c.value}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Users}
              label="Jami arizalar"
              value={stats.total}
              tone="brand"
              to="/admin/arizalar"
              sub={`Xodimlar: ${stats.employees ?? 0} · Talabalar: ${stats.students ?? 0}`}
            />
            <StatCard icon={Inbox} label="Yangi arizalar" value={stats.pending} tone="amber" to="/admin/arizalar?status=PENDING" sub="Ko‘rib chiqish kutilmoqda" />
            <StatCard icon={CheckCircle2} label="Tasdiqlanganlar" value={stats.approved} tone="green" to="/admin/arizalar?status=APPROVED" />
            <StatCard icon={XCircle} label="Rad etilganlar" value={stats.rejected} tone="slate" to="/admin/arizalar?status=REJECTED" />
            <StatCard
              icon={CloudUpload}
              label="Sam-Vision’ga yuborilgan"
              value={stats.samvisionSuccess}
              tone="green"
              to="/admin/arizalar?samvisionStatus=SUCCESS"
              sub={`Terminalda yuz qayd etilgan: ${stats.faceEnrolled}`}
            />
            <StatCard
              icon={CloudOff}
              label="Xatolik bilan yuborilgan"
              value={stats.samvisionError}
              tone="red"
              to="/admin/arizalar?samvisionStatus=ERROR"
              sub={stats.samvisionWaiting ? `Navbatda: ${stats.samvisionWaiting}` : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DailyChart data={stats.daily} />
            </div>
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-slate-900">Bo‘limlar kesimida</h2>
              {stats.byDepartment.length === 0 ? (
                <p className="text-sm text-slate-500">Hali arizalar yo‘q</p>
              ) : (
                <ul className="space-y-3">
                  {stats.byDepartment.map((d) => {
                    const pct = stats.total ? Math.round((d.count / stats.total) * 100) : 0;
                    return (
                      <li key={d.id ?? 'none'}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="truncate text-slate-700">{d.name}</span>
                          <span className="shrink-0 font-semibold text-slate-900 tabular-nums">{d.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">So‘nggi arizalar</h2>
              <Link to="/admin/arizalar" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                Barchasi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {stats.recent.length === 0 ? (
              <EmptyState title="Hali arizalar yo‘q" description="Xodimlar ro‘yxatdan o‘tish sahifasi orqali ariza yuborganda shu yerda ko‘rinadi." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.recent.map((a) => (
                  <li key={a.id}>
                    <Link to={`/admin/arizalar/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {initials(a.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{a.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {a.departmentName ?? '—'} · {a.position}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                      </div>
                      <div className="hidden md:block">
                        <SamVisionBadge status={a.samvision.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
