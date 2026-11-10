import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Search, ShieldX, XCircle } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { TypeTabs } from '../../components/admin/Filters.jsx';
import { useApi } from '../../lib/useApi.js';
import { formatDateTime } from '../../lib/format.js';
import { APPLICANT_TYPES } from '../../lib/statuses.js';

const PAGE_SIZE = 50;

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function LogsPage() {
  const [result, setResult] = useState('');
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(true);
  const search = useDebounced(searchInput.trim());

  useEffect(() => setPage(1), [result, type, search]);

  const { data, error, loading, reload } = useApi('/admin/sv/logs', {
    result: result || undefined,
    type: type || undefined,
    search: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  // Jonli rejim: birinchi sahifada har 15 soniyada yangilanadi
  useEffect(() => {
    if (!live || page !== 1) return undefined;
    const id = setInterval(reload, 15000);
    return () => clearInterval(id);
  }, [live, page, reload]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Kirish-chiqish jurnali"
        description="Terminallardagi har bir o‘tish urinishi (Sam-Vision)"
        actions={
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={live} onChange={(e) => setLive(e.target.checked)} />
            Jonli (15 soniya)
          </label>
        }
      />

      {data && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="card px-4 py-3">
            <p className="text-xs text-slate-500">Jami</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{data.total}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs text-slate-500">Ruxsat berilgan</p>
            <p className="text-xl font-bold text-emerald-700 tabular-nums">{data.totalGranted}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs text-slate-500">Rad etilgan</p>
            <p className="text-xl font-bold text-red-600 tabular-nums">{data.totalDenied}</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              ['', 'Hammasi'],
              ['granted', 'Ruxsat'],
              ['denied', 'Rad etilgan'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setResult(v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${result === v ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <TypeTabs value={type} onChange={setType} />
          <div className="relative lg:ml-auto lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="field-input h-10 py-1.5 pl-9 text-sm"
              placeholder="Ism bo‘yicha qidirish"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Qidirish"
            />
          </div>
        </div>
        {type && <p className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">Tur bo‘yicha filtr joriy sahifadagi yozuvlarga qo‘llanadi.</p>}

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={History} title="Yozuvlar yo‘q" />
        ) : (
          <div className={`transition-opacity ${loading ? 'opacity-70' : ''}`}>
            <ul className="divide-y divide-slate-100">
              {data.items.map((e) => {
                const t = e.type ? APPLICANT_TYPES[e.type] : null;
                const GateIcon = e.gateMode === 'exit' ? ArrowUpFromLine : ArrowDownToLine;
                return (
                  <li key={e.eventId} className="flex items-center gap-3 px-5 py-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${e.granted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {e.granted ? <CheckCircle2 className="h-5 w-5" /> : e.personName ? <XCircle className="h-5 w-5" /> : <ShieldX className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {e.recordId ? (
                          <Link to={`/admin/xodimlar/${e.recordId}`} className="hover:text-brand-700">
                            {e.personName ?? 'Noma’lum'}
                          </Link>
                        ) : (
                          e.personName ?? 'Noma’lum shaxs'
                        )}
                        {t && (
                          <Badge tone={t.tone} dot={false} className="ml-2 align-middle text-[10px]">
                            {t.label}
                          </Badge>
                        )}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <GateIcon className="h-3.5 w-3.5 shrink-0" />
                        {[e.deviceName, e.departmentName, e.message].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-xs whitespace-nowrap text-slate-500">{formatDateTime(e.receivedAt)}</span>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} totalPages={Math.max(1, Math.ceil(data.total / PAGE_SIZE))} total={data.total} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
