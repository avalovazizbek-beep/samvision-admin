import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, FileSpreadsheet, FilterX, Search, SearchX } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Badge, SamVisionBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { api, downloadFile, errorMessage } from '../../lib/api.js';
import { formatDateShort, formatPhone, initials } from '../../lib/format.js';
import { APPLICANT_TYPES, SAMVISION_ERROR_HINTS, SAMVISION_STATUS } from '../../lib/statuses.js';

const TABS = [
  { value: '', label: 'Hammasi' },
  { value: 'PENDING', label: 'Yangi' },
  { value: 'APPROVED', label: 'Tasdiqlangan' },
  { value: 'REJECTED', label: 'Rad etilgan' },
];

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const applicantType = params.get('applicantType') ?? '';
  const samvisionStatus = params.get('samvisionStatus') ?? '';
  const departmentId = params.get('departmentId') ?? '';
  const page = Number(params.get('page') ?? 1) || 1;
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const search = useDebounced(searchInput.trim());

  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(patch)) {
        if (v === '' || v === null || v === undefined || (k === 'page' && v === 1)) next.delete(k);
        else next.set(k, String(v));
      }
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  useEffect(() => {
    if ((params.get('search') ?? '') !== search) update({ search, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = useMemo(
    () => ({
      status: status || undefined,
      applicantType: applicantType || undefined,
      samvisionStatus: samvisionStatus || undefined,
      departmentId: departmentId || undefined,
      search: params.get('search') || undefined,
      page,
      pageSize: 20,
    }),
    [status, applicantType, samvisionStatus, departmentId, params, page],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/admin/applications', { params: query });
      setData(r.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/admin/departments')
      .then((r) => setDepartments(r.data.items))
      .catch(() => {});
  }, []);

  async function exportExcel() {
    setExporting(true);
    try {
      const { page: _p, pageSize: _s, ...filters } = query;
      await downloadFile('/admin/applications/export', filters, 'xodimlar.xlsx');
      toast.success('Excel fayl yuklab olindi');
    } catch (err) {
      toast.error(errorMessage(err, 'Eksport qilib bo‘lmadi'));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = status || applicantType || samvisionStatus || departmentId || params.get('search');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Arizalar"
        description="Xodimlarning ro‘yxatdan o‘tish arizalari"
        actions={
          <Button variant="outline" icon={FileSpreadsheet} onClick={exportExcel} loading={exporting}>
            Excel’ga eksport
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={status === t.value}
              onClick={() => update({ status: t.value, page: 1 })}
              className={`relative px-3.5 pt-1.5 pb-3 text-sm font-semibold whitespace-nowrap transition ${
                status === t.value ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {status === t.value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-700" />}
            </button>
          ))}
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-[1fr_150px_200px_190px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="field-input pl-10"
              placeholder="F.I.Sh., telefon, xodim raqami yoki ariza kodi"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Qidirish"
            />
          </div>
          <select
            className="field-input"
            value={applicantType}
            onChange={(e) => update({ applicantType: e.target.value, page: 1 })}
            aria-label="Turi bo‘yicha filtr"
          >
            <option value="">Barcha turlar</option>
            {Object.entries(APPLICANT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.plural}
              </option>
            ))}
          </select>
          <select
            className="field-input"
            value={departmentId}
            onChange={(e) => update({ departmentId: e.target.value, page: 1 })}
            aria-label="Bo‘lim bo‘yicha filtr"
          >
            <option value="">Barcha bo‘limlar</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="field-input"
            value={samvisionStatus}
            onChange={(e) => update({ samvisionStatus: e.target.value, page: 1 })}
            aria-label="Sam-Vision holati bo‘yicha filtr"
          >
            <option value="">Sam-Vision: barchasi</option>
            {Object.entries(SAMVISION_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          {hasFilters ? (
            <Button
              variant="ghost"
              icon={FilterX}
              onClick={() => {
                setSearchInput('');
                setParams(new URLSearchParams(), { replace: true });
              }}
            >
              Tozalash
            </Button>
          ) : (
            <span className="hidden md:block" />
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !data ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={SearchX} title="Hech narsa topilmadi" description="Qidiruv yoki filtr shartlarini o‘zgartirib ko‘ring." />
          ) : (
            <EmptyState title="Hali arizalar yo‘q" description="Xodimlar ro‘yxatdan o‘tganda arizalar shu yerda paydo bo‘ladi." />
          )
        ) : (
          <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {/* Desktop jadval */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Xodim</th>
                    <th className="px-3 py-3">Bo‘lim / lavozim</th>
                    <th className="px-3 py-3">Telefon</th>
                    <th className="px-3 py-3">Holat</th>
                    <th className="px-3 py-3">Sam-Vision</th>
                    <th className="px-3 py-3">Sana</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/admin/arizalar/${a.id}`)}
                      className="cursor-pointer transition hover:bg-brand-50/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            {initials(a.fullName)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/arizalar/${a.id}`}
                              className="block max-w-[240px] truncate font-semibold text-slate-900 hover:text-brand-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {a.fullName}
                            </Link>
                            <p className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                              <Badge tone={APPLICANT_TYPES[a.applicantType]?.tone ?? 'blue'} dot={false} className="px-1.5 py-0 font-sans text-[10px]">
                                {APPLICANT_TYPES[a.applicantType]?.label ?? 'Xodim'}
                              </Badge>
                              {a.trackingCode}
                              {a.employeeNumber ? ` · №${a.employeeNumber}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-[200px] truncate text-slate-800">{a.departmentName ?? '—'}</p>
                        <p className="max-w-[200px] truncate text-xs text-slate-500">
                          {a.applicantType === 'STUDENT' ? [a.course && `${a.course}-kurs`, a.studyGroup].filter(Boolean).join(', ') : a.position}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600 tabular-nums">{formatPhone(a.phone)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-3 py-3">
                        <SamVisionBadge status={a.samvision.status} />
                        {a.samvision.status === 'ERROR' && a.samvision.errorCode && (
                          <p className="mt-1 max-w-[180px] truncate text-xs text-red-600" title={SAMVISION_ERROR_HINTS[a.samvision.errorCode]}>
                            {SAMVISION_ERROR_HINTS[a.samvision.errorCode] ?? a.samvision.errorCode}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-500">{formatDateShort(a.createdAt)}</td>
                      <td className="px-3 py-3 text-slate-300">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobil kartalar */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {data.items.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/arizalar/${a.id}`} className="block px-4 py-4 active:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {initials(a.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{a.fullName}</p>
                        <p className="truncate text-sm text-slate-500">
                          {a.departmentName ?? '—'} · {a.position}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge tone={APPLICANT_TYPES[a.applicantType]?.tone ?? 'blue'} dot={false}>
                            {APPLICANT_TYPES[a.applicantType]?.label ?? 'Xodim'}
                          </Badge>
                          <StatusBadge status={a.status} />
                          <SamVisionBadge status={a.samvision.status} />
                          <span className="text-xs text-slate-400">{formatDateShort(a.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="mt-2 h-5 w-5 text-slate-300" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onChange={(p) => {
                update({ page: p });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
