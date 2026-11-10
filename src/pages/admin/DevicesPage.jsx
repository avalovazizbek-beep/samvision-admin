import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownToLine, ArrowUpFromLine, Cpu, MonitorSmartphone, RefreshCw, Search, Wifi, WifiOff } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { api, errorMessage } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { formatDateTime, timeAgo } from '../../lib/format.js';

const STATUS_TABS = [
  { value: '', label: 'Hammasi', key: 'all' },
  { value: 'online', label: 'Onlayn', key: 'online' },
  { value: 'offline', label: 'Oflayn', key: 'offline' },
  { value: 'pending', label: 'Sinxron kutmoqda', key: 'pending' },
];

const GATE = {
  entry: { label: 'Kirish', icon: ArrowDownToLine },
  exit: { label: 'Chiqish', icon: ArrowUpFromLine },
};

export default function DevicesPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { data, error, loading, reload } = useApi('/admin/sv/devices', { status: status || undefined, search: search.trim() || undefined });

  async function refresh() {
    setRefreshing(true);
    try {
      await api.post('/admin/sv/refresh');
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Qurilmalar"
        description="Sam-Vision terminallari va ularning holati"
        actions={
          <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={refresh}>
            Yangilash
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                status === t.value ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
              {data?.counts && <span className="ml-1.5 text-xs font-medium text-slate-400 tabular-nums">{data.counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="field-input h-10 py-1.5 pl-9 text-sm"
            placeholder="Nomi, bo‘lim, IP, model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Qidirish"
          />
        </div>
      </div>

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={MonitorSmartphone} title="Qurilma topilmadi" />
        </div>
      ) : (
        <div className={`grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {data.items.map((d) => {
            const gate = GATE[d.gateMode];
            return (
              <article key={d.deviceId} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${d.online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {d.online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-slate-900">{d.name}</h2>
                    <p className="truncate text-sm text-slate-500">{[d.departmentName, d.location].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <Badge tone={d.online ? 'green' : 'red'}>{d.online ? 'Onlayn' : 'Oflayn'}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {gate && (
                    <Badge tone="blue" dot={false}>
                      <gate.icon className="h-3 w-3" /> {gate.label}
                    </Badge>
                  )}
                  {d.pendingSync && <Badge tone="amber">Sinxron kutmoqda</Badge>}
                  {d.syncEnabled === false && <Badge tone="slate">Sinxron o‘chirilgan</Badge>}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Oxirgi aloqa</dt>
                    <dd className="font-medium text-slate-700" title={formatDateTime(d.lastSeenAt)}>
                      {d.lastSeenAt ? timeAgo(d.lastSeenAt) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Oxirgi sinxron</dt>
                    <dd className="font-medium text-slate-700" title={d.lastSyncMessage ?? ''}>
                      {d.lastSyncAt ? timeAgo(d.lastSyncAt) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">IP manzil</dt>
                    <dd className="font-mono text-slate-700">{d.ip ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Model</dt>
                    <dd className="truncate font-medium text-slate-700">{[d.manufacturer, d.model].filter(Boolean).join(' ') || '—'}</dd>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-400">
                    <Cpu className="h-3.5 w-3.5" />
                    <span className="truncate font-mono">{d.machineNumber ?? d.deviceId}</span>
                    {d.appVersion && <span className="ml-auto shrink-0">v{d.appVersion}</span>}
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
