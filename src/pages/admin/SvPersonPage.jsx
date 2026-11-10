import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, ExternalLink, FileSpreadsheet, FileText, UserRound } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, PageLoader, Spinner } from '../../components/ui/Feedback.jsx';
import { PeriodPicker, periodParams } from '../../components/admin/Filters.jsx';
import { FaceBadge } from './SvPersonnelPage.jsx';
import { api, downloadFile, errorMessage } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { clockTime, currentMonth, duration, formatBirthDate, initials, weekdayShort } from '../../lib/format.js';
import { APPLICANT_TYPES, ATTENDANCE_FLAGS } from '../../lib/statuses.js';

function Photo({ recordId, name }) {
  const [url, setUrl] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    api
      .get(`/admin/sv/personnel/${recordId}/photo`, { responseType: 'blob' })
      .then((r) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(r.data);
        setUrl(objectUrl);
        setState('ready');
      })
      .catch(() => !cancelled && setState('none'));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recordId]);

  if (state === 'loading') {
    return (
      <div className="flex aspect-[3/4] items-center justify-center bg-slate-100">
        <Spinner />
      </div>
    );
  }
  if (state === 'none') {
    return (
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 bg-brand-50 text-brand-700">
        <span className="text-4xl font-bold">{initials(name)}</span>
        <span className="text-xs text-brand-600">Surat yo‘q</span>
      </div>
    );
  }
  return <img src={url} alt={name} className="aspect-[3/4] w-full object-cover" />;
}

function Stat({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export default function SvPersonPage() {
  const { recordId } = useParams();
  const [period, setPeriod] = useState({ month: currentMonth() });
  const [busy, setBusy] = useState('');
  const person = useApi(`/admin/sv/personnel/${recordId}`);
  const att = useApi(`/admin/sv/personnel/${recordId}/attendance`, periodParams(period));

  async function exportFile(source, format = 'xlsx') {
    setBusy(`${source}-${format}`);
    try {
      await downloadFile(`/admin/sv/personnel/${recordId}/attendance/export`, { ...periodParams(period), source, format }, `davomat.${format}`);
      toast.success('Davomat fayli yuklab olindi');
    } catch (err) {
      toast.error(errorMessage(err, 'Faylni yuklab bo‘lmadi'));
    } finally {
      setBusy('');
    }
  }

  if (person.error) {
    return (
      <div className="card">
        <ErrorState message={person.error} onRetry={person.reload} />
      </div>
    );
  }
  if (!person.data) return <PageLoader />;

  const p = person.data.person;
  const t = APPLICANT_TYPES[p.type] ?? APPLICANT_TYPES.EMPLOYEE;
  const s = att.data?.summary;
  const days = [...(att.data?.days ?? [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <div className="animate-fade-in">
      <Link to="/admin/xodimlar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Xodimlar va talabalar
      </Link>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <Photo recordId={recordId} name={p.fullName} />
            <div className="space-y-3 p-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{p.fullName}</h1>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={t.tone}>{t.label}</Badge>
                  <FaceBadge value={p.faceEnrolled} />
                  {p.arrivedToday && <Badge tone="green">Bugun keldi</Badge>}
                </div>
              </div>
              <dl className="space-y-1.5 text-sm">
                {[
                  ['Bo‘lim', p.departments.map((d) => d.name).join(', ')],
                  [p.type === 'STUDENT' ? 'Kurs / guruh' : 'Lavozim', p.position],
                  [p.type === 'STUDENT' ? 'Talaba ID' : 'Xodim raqami', p.employeeNumber],
                  ['Tug‘ilgan sana', p.birthDate ? formatBirthDate(p.birthDate) : ''],
                  ['NFC karta', p.nfc ? 'Bor' : ''],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-right font-medium text-slate-900">{v}</dd>
                    </div>
                  ))}
              </dl>
              {p.applicationId && (
                <Link to={`/admin/arizalar/${p.applicationId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  <ExternalLink className="h-4 w-4" /> Ro‘yxatdan o‘tish arizasi
                </Link>
              )}
            </div>
          </section>
        </div>

        <section className="card min-w-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <CalendarDays className="h-[18px] w-[18px] text-brand-600" /> Davomat
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={FileSpreadsheet} loading={busy === 'full-xlsx'} onClick={() => exportFile('full')}>
                Excel yuklash (to‘liq)
              </Button>
              <Button variant="outline" size="sm" icon={FileSpreadsheet} loading={busy === 'samvision-xlsx'} onClick={() => exportFile('samvision', 'xlsx')}>
                Sam-Vision fayli
              </Button>
              <Button variant="ghost" size="sm" icon={FileText} loading={busy === 'samvision-csv'} onClick={() => exportFile('samvision', 'csv')}>
                CSV
              </Button>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <PeriodPicker value={period} onChange={setPeriod} />

            {att.error ? (
              <ErrorState message={att.error} onRetry={att.reload} />
            ) : !att.data ? (
              <div className="skeleton h-64" />
            ) : (
              <div className={`space-y-4 transition-opacity ${att.loading ? 'opacity-60' : ''}`}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Kelgan kunlar" value={s?.present_days ?? 0} tone="text-emerald-700" />
                  <Stat label="Kechikkan" value={s?.late_days ?? 0} tone="text-amber-700" />
                  <Stat label="Kelmagan" value={s?.absent_days ?? 0} tone="text-red-600" />
                  <Stat label="Jami vaqt" value={duration(s?.total_worked_minutes)} />
                </div>

                {days.length === 0 ? (
                  <EmptyState icon={UserRound} title="Bu davrda yozuv yo‘q" />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Sana</th>
                          <th className="px-3 py-2.5">Keldi</th>
                          <th className="px-3 py-2.5">Ketdi</th>
                          <th className="px-3 py-2.5 text-right">Vaqt</th>
                          <th className="px-3 py-2.5">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {days.map((d) => (
                          <tr key={d.date} className={d.scheduled ? '' : 'bg-slate-50/60'}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="font-medium text-slate-900">{d.date}</span>{' '}
                              <span className="text-xs text-slate-400">{weekdayShort(d.weekday)}</span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium tabular-nums">{clockTime(d.arrival_time_millis)}</span>
                              {d.arrival_device_name && <span className="ml-1.5 text-xs text-slate-400">{d.arrival_device_name}</span>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium tabular-nums">{clockTime(d.departure_time_millis)}</span>
                              {d.departure_device_name && <span className="ml-1.5 text-xs text-slate-400">{d.departure_device_name}</span>}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">{duration(d.worked_minutes)}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {(d.flags ?? []).map((f) => {
                                  const fl = ATTENDANCE_FLAGS[f] ?? { label: f, tone: 'slate' };
                                  return (
                                    <Badge key={f} tone={fl.tone} dot={false}>
                                      {fl.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
