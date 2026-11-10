import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, RefreshCw, Search, SearchX, UsersRound } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { TypeTabs } from '../../components/admin/Filters.jsx';
import { api, errorMessage } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { initials } from '../../lib/format.js';
import { APPLICANT_TYPES } from '../../lib/statuses.js';

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function FaceBadge({ value }) {
  if (value === true) return <Badge tone="green">Yuz qayd etilgan</Badge>;
  if (value === false) return <Badge tone="amber">Yuz qayd etilmagan</Badge>;
  return <Badge tone="slate">Yuz: noma’lum</Badge>;
}

export default function SvPersonnelPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [face, setFace] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const search = useDebounced(searchInput.trim());

  useEffect(() => setPage(1), [type, departmentId, face, search]);

  const { data, error, loading, reload } = useApi('/admin/sv/personnel', {
    type: type || undefined,
    departmentId: departmentId || undefined,
    face: face || undefined,
    search: search || undefined,
    page,
    pageSize: 25,
  });
  const departments = useApi('/admin/departments').data?.items?.filter((d) => d.samvisionControlId) ?? [];

  async function refresh() {
    setRefreshing(true);
    try {
      await api.post('/admin/sv/refresh');
      await reload();
      toast.success('Sam-Vision’dan yangilandi');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Xodimlar va talabalar"
        description="Sam-Vision bazasidagi barcha odamlar (kabinetdagi ro‘yxat bilan bir xil)"
        actions={
          <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={refresh}>
            Yangilash
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <TypeTabs value={type} onChange={setType} counts={data?.counts} />
          <select className="field-input h-10 py-1.5 text-sm lg:w-56" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Bo‘lim">
            <option value="">Barcha bo‘limlar</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select className="field-input h-10 py-1.5 text-sm lg:w-48" value={face} onChange={(e) => setFace(e.target.value)} aria-label="Yuz holati">
            <option value="">Yuz: barchasi</option>
            <option value="yes">Yuz qayd etilgan</option>
            <option value="no">Yuz qayd etilmagan</option>
          </select>
          <div className="relative lg:ml-auto lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="field-input h-10 py-1.5 pl-9 text-sm"
              placeholder="Ism, raqam, lavozim, bo‘lim"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Qidirish"
            />
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          search || type || departmentId || face ? (
            <EmptyState icon={SearchX} title="Hech kim topilmadi" description="Filtrlarni o‘zgartirib ko‘ring." />
          ) : (
            <EmptyState icon={UsersRound} title="Sam-Vision bazasi bo‘sh" />
          )
        ) : (
          <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <ul className="divide-y divide-slate-100">
              {data.items.map((p) => {
                const t = APPLICANT_TYPES[p.type] ?? APPLICANT_TYPES.EMPLOYEE;
                return (
                  <li key={p.recordId}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/xodimlar/${p.recordId}`)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-brand-50/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {initials(p.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{p.fullName}</p>
                        <p className="truncate text-sm text-slate-500">
                          {[p.departments.map((d) => d.name).join(', '), p.position, p.employeeNumber && `№${p.employeeNumber}`].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <div className="hidden flex-wrap items-center justify-end gap-1.5 sm:flex">
                        <Badge tone={t.tone}>{t.label}</Badge>
                        <FaceBadge value={p.faceEnrolled} />
                        {p.arrivedToday && <Badge tone="green">Bugun keldi</Badge>}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
