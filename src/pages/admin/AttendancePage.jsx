import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck2, CalendarX2, Clock3, Download, FileSpreadsheet, FileText, Search, TimerOff, TriangleAlert, UsersRound } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { PeriodPicker, TypeTabs, periodParams, periodText } from '../../components/admin/Filters.jsx';
import ArchiveStatus from '../../components/admin/ArchiveStatus.jsx';
import { downloadFile, errorMessage } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { currentMonth, duration, initials } from '../../lib/format.js';
import { APPLICANT_TYPES } from '../../lib/statuses.js';

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    brand: 'bg-brand-50 text-brand-700',
  };
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [period, setPeriod] = useState({ month: currentMonth() });
  const [type, setType] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');

  const params = { ...periodParams(period), type: type || undefined, departmentId: departmentId || undefined };
  const { data, error, loading, reload } = useApi('/admin/sv/attendance', params);
  const departments = useApi('/admin/departments').data?.items?.filter((d) => d.samvisionControlId) ?? [];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.employees ?? [];
    return (q ? list.filter((e) => `${e.full_name} ${e.employee_number}`.toLowerCase().includes(q)) : list)
      .slice()
      .sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), 'uz'));
  }, [data, search]);

  async function exportAll(source, format = 'xlsx') {
    setBusy(`${source}-${format}`);
    try {
      await downloadFile('/admin/sv/attendance/export', { ...params, source, format }, `davomat.${format}`);
      toast.success('Fayl yuklab olindi');
    } catch (err) {
      toast.error(errorMessage(err, 'Faylni yuklab bo‘lmadi'));
    } finally {
      setBusy('');
    }
  }

  async function exportPerson(e) {
    setBusy(e.record_id);
    try {
      await downloadFile(`/admin/sv/personnel/${e.record_id}/attendance/export`, periodParams(period), 'davomat.xlsx');
      toast.success(`${e.full_name} — davomat yuklab olindi`);
    } catch (err) {
      toast.error(errorMessage(err, 'Faylni yuklab bo‘lmadi'));
    } finally {
      setBusy('');
    }
  }

  const s = data?.summary;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Davomat"
        description="Sam-Vision terminallaridan olingan kelish-ketish ma’lumotlari"
        actions={
          <>
            <Button icon={FileSpreadsheet} loading={busy === 'full-xlsx'} onClick={() => exportAll('full')} title="Umumiy, Tabel, Kunlar, Kirish-chiqish varaqlari">
              Excel yuklash (to‘liq)
            </Button>
            {!type && (
              <>
                <Button variant="outline" icon={FileSpreadsheet} loading={busy === 'samvision-xlsx'} onClick={() => exportAll('samvision', 'xlsx')}>
                  Sam-Vision fayli
                </Button>
                <Button variant="ghost" icon={FileText} loading={busy === 'samvision-csv'} onClick={() => exportAll('samvision', 'csv')}>
                  CSV
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="card mb-6 space-y-3 p-4">
        <PeriodPicker value={period} onChange={setPeriod} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <TypeTabs value={type} onChange={setType} />
          <select className="field-input h-10 py-1.5 text-sm lg:w-64" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Bo‘lim">
            <option value="">Barcha bo‘limlar</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="relative lg:ml-auto lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="field-input h-10 py-1.5 pl-9 text-sm" placeholder="Ism yoki raqam" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Qidirish" />
          </div>
        </div>
        <ArchiveStatus onSynced={reload} />
      </div>

      {data?.source === 'archive' && (
        <Alert tone="warn" icon={TriangleAlert} className="mb-6" title="Sam-Vision hozir javob bermayapti — ma’lumot mahalliy arxivdan">
          Ko‘rsatilgan davomat backend oxirgi marta yozib olgan holatda. Sam-Vision tiklangach, avtomatik yangilanadi.
          {data.unavailableReason ? <span className="mt-1 block text-xs opacity-75">Sabab: {data.unavailableReason}</span> : null}
        </Alert>
      )}

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-[74px] rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={CalendarCheck2} label="Kelgan kunlar (jami)" value={s?.present_days ?? 0} tone="green" />
            <Metric icon={Clock3} label="Kechikishlar" value={s?.late_days ?? 0} tone="amber" />
            <Metric icon={CalendarX2} label="Kelmagan kunlar" value={s?.absent_days ?? 0} tone="red" />
            <Metric icon={TimerOff} label="Jami ishlangan vaqt" value={duration(s?.total_worked_minutes)} tone="brand" />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h2 className="font-semibold text-slate-900">
                {rows.length} kishi · <span className="font-normal text-slate-500">{periodText({ month: data.month, from: data.from, to: data.to })}</span>
              </h2>
            </div>
            {rows.length === 0 ? (
              <EmptyState icon={UsersRound} title="Ma’lumot yo‘q" description="Tanlangan davr va filtr bo‘yicha hech kim topilmadi." />
            ) : (
              <>
              {/* Telefon uchun ixcham ko‘rinish */}
              <ul className="divide-y divide-slate-100 lg:hidden">
                {rows.map((e) => {
                  const t = APPLICANT_TYPES[e.type] ?? APPLICANT_TYPES.EMPLOYEE;
                  const sm = e.summary ?? {};
                  return (
                    <li key={e.record_id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <Link to={`/admin/xodimlar/${e.record_id}`} className="block truncate font-semibold text-slate-900">
                            {e.full_name}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                            <Badge tone={t.tone} dot={false} className="px-1.5 py-0 text-[10px]">
                              {t.label}
                            </Badge>
                            {e.position || ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          icon={Download}
                          loading={busy === e.record_id}
                          onClick={() => exportPerson(e)}
                          aria-label={`${e.full_name} davomatini yuklash`}
                          className="h-9 w-9"
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-xs">
                        <div className="rounded-lg bg-emerald-50 py-1.5">
                          <p className="font-bold text-emerald-700 tabular-nums">{sm.present_days ?? 0}</p>
                          <p className="text-emerald-700/70">kelgan</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 py-1.5">
                          <p className="font-bold text-amber-700 tabular-nums">{sm.late_days ?? 0}</p>
                          <p className="text-amber-700/70">kechikkan</p>
                        </div>
                        <div className="rounded-lg bg-red-50 py-1.5">
                          <p className="font-bold text-red-600 tabular-nums">{sm.absent_days ?? 0}</p>
                          <p className="text-red-600/70">kelmagan</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 py-1.5">
                          <p className="font-bold whitespace-nowrap text-slate-800 tabular-nums">{Math.round((sm.total_worked_minutes ?? 0) / 60)} s</p>
                          <p className="text-slate-500">vaqt</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">F.I.Sh.</th>
                      <th className="px-3 py-3">Lavozim / guruh</th>
                      <th className="px-3 py-3 text-right">Kelgan</th>
                      <th className="px-3 py-3 text-right">Kechikkan</th>
                      <th className="px-3 py-3 text-right">Kelmagan</th>
                      <th className="px-3 py-3 text-right">Erta ketgan</th>
                      <th className="px-3 py-3 text-right">Vaqt</th>
                      <th className="w-12 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((e) => {
                      const t = APPLICANT_TYPES[e.type] ?? APPLICANT_TYPES.EMPLOYEE;
                      const sm = e.summary ?? {};
                      return (
                        <tr key={e.record_id} className="hover:bg-brand-50/40">
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                                {initials(e.full_name)}
                              </div>
                              <div className="min-w-0">
                                <Link to={`/admin/xodimlar/${e.record_id}`} className="block max-w-[240px] truncate font-semibold text-slate-900 hover:text-brand-700">
                                  {e.full_name}
                                </Link>
                                <div className="flex items-center gap-1.5">
                                  <Badge tone={t.tone} dot={false} className="px-1.5 py-0 text-[10px]">
                                    {t.label}
                                  </Badge>
                                  {e.employee_number && <span className="font-mono text-xs text-slate-400">№{e.employee_number}</span>}
                                  {e.detached_at && <span className="text-xs text-slate-400">(chiqarilgan)</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-600">{e.position || '—'}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 tabular-nums">{sm.present_days ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-amber-700 tabular-nums">{sm.late_days ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-red-600 tabular-nums">{sm.absent_days ?? 0}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{sm.early_leave_days ?? 0}</td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700 tabular-nums">{duration(sm.total_worked_minutes)}</td>
                          <td className="px-3 py-2.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              icon={Download}
                              loading={busy === e.record_id}
                              onClick={() => exportPerson(e)}
                              title="Shu odamning davomatini Excel’da yuklash"
                              aria-label={`${e.full_name} davomatini yuklash`}
                              className="h-8 w-8"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
