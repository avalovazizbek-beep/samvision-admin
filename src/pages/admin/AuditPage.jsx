import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { api, errorMessage } from '../../lib/api.js';
import { formatDateTime } from '../../lib/format.js';
import { AUDIT_LABELS } from '../../lib/statuses.js';

const TONE = (action) =>
  action.endsWith('ERROR') || action.endsWith('FAILED') || action === 'PIN_LOCKED' || action === 'APPLICATION_REJECTED' || action === 'APPLICATION_DELETED'
    ? 'bg-red-500'
    : action.startsWith('SAMVISION') || action === 'APPLICATION_APPROVED'
      ? 'bg-emerald-500'
      : 'bg-brand-500';

function summary(e) {
  const d = e.details ?? {};
  switch (e.action) {
    case 'LOGIN_FAILED':
    case 'REAUTH':
    case 'REAUTH_FAILED':
      return `Login: ${d.username ?? '—'}`;
    case 'LOGIN':
      return d.method === 'pin' ? 'PIN kod bilan' : null;
    case 'PIN_LOGIN_FAILED':
      return d.attempts ? `${d.attempts}-urinish` : null;
    case 'PIN_SET':
      return d.deviceName ?? null;
    case 'APPLICATION_REJECTED':
      return d.reason;
    case 'SAMVISION_SYNC_ERROR':
      return `${d.code}: ${d.message}`;
    case 'SAMVISION_SYNC_SUCCESS':
    case 'SAMVISION_LINKED':
      return d.recordId ? `record_id: ${d.recordId}` : null;
    case 'EXPORTED':
      return `${d.count} ta yozuv`;
    case 'DEPARTMENTS_SYNCED':
      return `Jami ${d.total}, yangi ${d.created}, yangilangan ${d.updated}, nofaol ${d.deactivated}`;
    case 'APPLICATION_DELETED':
      return d.trackingCode ? `Ariza ${d.trackingCode}` : null;
    case 'DEPARTMENT_CREATED':
    case 'DEPARTMENT_UPDATED':
      return d.name ?? null;
    default:
      return null;
  }
}

export default function AuditPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await api.get('/admin/audit-logs', { params: { page, pageSize: 30, action: action || undefined } });
      setData(r.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [page, action]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit jurnali"
        description="Administratorlar va tizim tomonidan bajarilgan barcha amallar"
        actions={
          <select
            className="field-input w-64"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            aria-label="Amal turi"
          >
            <option value="">Barcha amallar</option>
            {Object.entries(AUDIT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        }
      />
      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !data ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={History} title="Yozuvlar yo‘q" />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {data.items.map((e) => {
                const s = summary(e);
                return (
                  <li key={e.id} className="flex gap-3 px-5 py-3.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE(e.action)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {AUDIT_LABELS[e.action] ?? e.action}
                        {e.applicationId && e.applicationName && (
                          <>
                            {' — '}
                            <Link to={`/admin/arizalar/${e.applicationId}`} className="text-brand-700 hover:underline">
                              {e.applicationName}
                            </Link>
                          </>
                        )}
                      </p>
                      {s && <p className="truncate text-sm text-slate-500">{s}</p>}
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-400">
                      <p>{formatDateTime(e.createdAt)}</p>
                      <p>
                        {e.admin ?? (e.action === 'APPLICATION_SUBMITTED' ? 'Xodim' : 'Tizim')}
                        {e.ip ? ` · ${e.ip}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
