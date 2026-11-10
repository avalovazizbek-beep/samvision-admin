import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Check, Link2Off, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { SelectInput, TextInput } from '../../components/ui/Field.jsx';
import { api, errorMessage, fieldErrors } from '../../lib/api.js';
import { formatDateTime } from '../../lib/format.js';
import { AUDIENCES } from '../../lib/statuses.js';

/** Bo‘limni o‘chirish (faqat arizasi yo‘q bo‘limlar) */
function DeleteModal({ department, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/admin/departments/${department.id}`);
      toast.success(`«${department.name}» o‘chirildi`);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={Boolean(department)}
      onClose={onClose}
      title="Bo‘limni o‘chirish"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="danger" icon={Trash2} loading={busy} onClick={remove}>
            O‘chirish
          </Button>
        </>
      }
    >
      {department && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <b className="text-slate-900">«{department.name}»</b> bo‘limi ro‘yxatdan butunlay o‘chiriladi.
          </p>
          {department.samvisionId && (
            <Alert tone="warn">
              Bu bo‘lim Sam-Vision’da bor — keyingi «Sam-Vision’dan sinxronlash» da u qaytib qo‘shiladi. Formadan olib tashlash uchun
              «Formada» ni o‘chirish kifoya.
            </Alert>
          )}
        </div>
      )}
    </Modal>
  );
}

function DepartmentModal({ open, onClose, department, onSaved }) {
  const [name, setName] = useState('');
  const [samvisionId, setSamvisionId] = useState('');
  const [audience, setAudience] = useState('BOTH');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(department?.name ?? '');
      setSamvisionId(department?.samvisionId ?? '');
      setAudience(department?.audience ?? 'BOTH');
      setErrors({});
    }
  }, [open, department]);

  async function save() {
    setSaving(true);
    try {
      const body = { name, samvisionId, audience };
      const r = department ? await api.patch(`/admin/departments/${department.id}`, body) : await api.post('/admin/departments', body);
      toast.success(department ? 'Bo‘lim saqlandi' : 'Bo‘lim qo‘shildi');
      onSaved(r.data.department);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? 'Bo‘limni tahrirlash' : 'Yangi bo‘lim'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button icon={Check} loading={saving} onClick={save}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextInput label="Bo‘lim nomi" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <SelectInput
          label="Kimlar uchun"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          error={errors.audience}
          hint="Ro‘yxatdan o‘tish formasida bu bo‘lim kimga ko‘rinishini belgilaydi"
        >
          {Object.entries(AUDIENCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </SelectInput>
        <TextInput
          label="Sam-Vision bo‘lim ID"
          value={samvisionId}
          onChange={(e) => setSamvisionId(e.target.value)}
          error={errors.samvisionId}
          hint="Bo‘sh bo‘lsa, bu bo‘limdagi xodimlarni Sam-Vision’ga yuborib bo‘lmaydi. Eng oson yo‘li — «Sam-Vision’dan sinxronlash»"
        />
      </div>
    </Modal>
  );
}

export default function DepartmentsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await api.get('/admin/departments');
      setItems(r.data.items);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      const r = await api.post('/admin/departments/sync');
      setItems(r.data.items);
      const { total, created, updated, deactivated } = r.data.result;
      toast.success(`Sam-Vision’da ${total} ta bo‘lim: ${created} ta yangi, ${updated} ta yangilandi${deactivated ? `, ${deactivated} ta nofaol` : ''}`, {
        duration: 6000,
      });
    } catch (err) {
      toast.error(errorMessage(err, 'Sinxronlab bo‘lmadi'));
    } finally {
      setSyncing(false);
    }
  }

  async function changeAudience(d, audience) {
    setToggling(d.id);
    try {
      const r = await api.patch(`/admin/departments/${d.id}`, { audience });
      setItems((list) => list.map((x) => (x.id === d.id ? { ...x, ...r.data.department } : x)));
      toast.success(`«${d.name}»: ${AUDIENCES[audience].toLowerCase()}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setToggling(null);
    }
  }

  async function toggle(d) {
    setToggling(d.id);
    try {
      const r = await api.patch(`/admin/departments/${d.id}`, { isActive: !d.isActive });
      setItems((list) => list.map((x) => (x.id === d.id ? { ...x, ...r.data.department } : x)));
      toast.success(r.data.department.isActive ? 'Bo‘lim formada ko‘rsatiladi' : 'Bo‘lim formadan yashirildi');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setToggling(null);
    }
  }

  const unmapped = items?.filter((d) => d.isActive && !d.samvisionId).length ?? 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bo‘limlar"
        description="Ro‘yxatdan o‘tish formasidagi bo‘limlar va ularning Sam-Vision bilan bog‘lanishi"
        actions={
          <>
            <Button variant="outline" icon={Plus} onClick={() => setEditing({})}>
              Qo‘lda qo‘shish
            </Button>
            <Button icon={RefreshCw} loading={syncing} onClick={sync}>
              Sam-Vision’dan sinxronlash
            </Button>
          </>
        }
      />

      {unmapped > 0 && (
        <Alert tone="warn" icon={Link2Off} className="mb-6" title={`${unmapped} ta faol bo‘lim Sam-Vision’ga bog‘lanmagan`}>
          Bu bo‘limlardagi tasdiqlangan xodimlar Sam-Vision’ga yuborilmaydi. Sam-Vision ID ni kiriting yoki sinxronlang.
        </Alert>
      )}

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !items ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Bo‘limlar yo‘q"
            description="Bo‘limlarni Sam-Vision’dan sinxronlang — shundan so‘ng xodimlar ro‘yxatdan o‘tishda ularni tanlay oladi."
            action={
              <Button icon={RefreshCw} loading={syncing} onClick={sync}>
                Sam-Vision’dan sinxronlash
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${d.isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate font-semibold ${d.isActive ? 'text-slate-900' : 'text-slate-400'}`}>{d.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {d.departmentType === 'class' ? 'Guruh / sinf · ' : ''}
                      {d.samvisionId ? 'Sam-Vision bilan bog‘langan' : 'Sam-Vision ID yo‘q'}
                      {d.syncedAt ? ` · sinxronlangan ${formatDateTime(d.syncedAt)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {d.samvisionId ? <Badge tone="green">Bog‘langan</Badge> : <Badge tone="amber">Bog‘lanmagan</Badge>}
                  <select
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none"
                    value={d.audience ?? 'BOTH'}
                    disabled={toggling === d.id}
                    onChange={(e) => changeAudience(d, e.target.value)}
                    aria-label={`${d.name} — kimlar uchun`}
                  >
                    {Object.entries(AUDIENCES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">{d.applicationsCount} ta ariza</span>
                  <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={d.isActive}
                      disabled={toggling === d.id}
                      onChange={() => toggle(d)}
                    />
                    <span className="relative h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
                    Formada
                  </label>
                  <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(d)} aria-label={`${d.name} — tahrirlash`}>
                    <span className="sr-only sm:not-sr-only">Tahrirlash</span>
                  </Button>
                  {d.applicationsCount === 0 && (
                    <button
                      type="button"
                      onClick={() => setDeleting(d)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`${d.name} — o‘chirish`}
                      title="O‘chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DeleteModal department={deleting} onClose={() => setDeleting(null)} onDeleted={() => load()} />
      <DepartmentModal
        open={editing !== null}
        department={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={() => load()}
      />
    </div>
  );
}
