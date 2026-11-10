import { useState } from 'react';
import toast from 'react-hot-toast';
import { Database, RefreshCw, TriangleAlert } from 'lucide-react';
import { api, errorMessage } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { timeAgo } from '../../lib/format.js';

/**
 * Davomatning mahalliy arxivi holati: backend fon rejimida Sam-Vision'dan yozib boradi.
 * onSynced — qo‘lda yangilangandan so‘ng sahifani qayta yuklash uchun.
 */
export default function ArchiveStatus({ onSynced }) {
  const { data, reload } = useApi('/admin/sv/archive/status');
  const [syncing, setSyncing] = useState(false);

  async function syncNow() {
    setSyncing(true);
    try {
      const r = await api.post('/admin/sv/archive/sync');
      if (r.data.result.ok) toast.success(`Arxiv yangilandi: ${r.data.result.days} kun, ${r.data.result.events} yangi o‘tish`);
      else toast.error(`Arxivni yangilab bo‘lmadi: ${r.data.result.error}`);
      await reload();
      onSynced?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSyncing(false);
    }
  }

  if (!data) return null;
  if (!data.enabled) {
    return <p className="text-xs text-slate-500">Mahalliy arxiv o‘chirilgan (ATTENDANCE_SYNC_ENABLED=false)</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5 text-brand-600" />
        Mahalliy arxiv: {data.daysCount} kunlik yozuv, {data.eventsCount} o‘tish
        {data.oldestDate ? ` (${data.oldestDate} dan)` : ''}
      </span>
      <span>
        · har {data.intervalMinutes} daqiqada yangilanadi
        {data.lastSuccessAt ? `, oxirgisi ${timeAgo(data.lastSuccessAt)}` : ''}
      </span>
      {data.lastError && (
        <span className="inline-flex items-center gap-1 text-amber-700" title={data.lastError.message}>
          <TriangleAlert className="h-3.5 w-3.5" /> oxirgi urinishda xato
        </span>
      )}
      <button
        type="button"
        onClick={syncNow}
        disabled={syncing || data.running}
        className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${syncing || data.running ? 'animate-spin' : ''}`} />
        {syncing || data.running ? 'Yangilanmoqda…' : 'Hozir yangilash'}
      </button>
    </div>
  );
}
