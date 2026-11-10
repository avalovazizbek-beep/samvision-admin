import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CloudUpload,
  ImageOff,
  ImageUp,
  Link2,
  Pencil,
  RefreshCw,
  ScanFace,
  Send,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Badge, SamVisionBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Alert, ErrorState, PageLoader, Spinner } from '../../components/ui/Feedback.jsx';
import { SelectInput, TextArea, TextInput } from '../../components/ui/Field.jsx';
import { api, errorMessage, fieldErrors } from '../../lib/api.js';
import { formatBirthDate, formatDateTime, formatPhone } from '../../lib/format.js';
import { APPLICANT_TYPES, AUDIT_LABELS, FIELD_LABELS, SAMVISION_ERROR_HINTS } from '../../lib/statuses.js';
import { fileToNormalizedJpeg } from '../../lib/image.js';

const REJECT_REASONS = [
  'Surat talabga javob bermaydi — yuz aniq ko‘rinmaydi',
  'Ma’lumotlar noto‘g‘ri yoki to‘liq emas',
  'Bu shaxs tashkilot xodimi emas',
  'Takroriy ariza',
];

/* ------------------------------ Yordamchi komponentlar ------------------------------ */

function InfoRow({ label, children, mono }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm sm:grid-cols-[160px_1fr]">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`min-w-0 font-medium break-words text-slate-900 ${mono ? 'font-mono text-[13px]' : ''}`}>{children ?? '—'}</dd>
    </div>
  );
}

function Card({ title, icon: Icon, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          {Icon && <Icon className="h-[18px] w-[18px] text-brand-600" />}
          {title}
        </h2>
        {actions}
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

function AuthorizedPhoto({ id, version }) {
  const [url, setUrl] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setState('loading');
    api
      .get(`/admin/applications/${id}/photo`, { responseType: 'blob', params: { v: version } })
      .then((r) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(r.data);
        setUrl(objectUrl);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, version]);

  if (state === 'loading') {
    return (
      <div className="flex aspect-[3/4] items-center justify-center bg-slate-100">
        <Spinner />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
        <ImageOff className="h-8 w-8" />
        <span className="text-sm">Suratni yuklab bo‘lmadi</span>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" title="To‘liq o‘lchamda ochish">
      <img src={url} alt="Xodimning yuz surati" className="aspect-[3/4] w-full object-cover" />
    </a>
  );
}

function auditDetails(entry) {
  const d = entry.details;
  if (!d) return null;
  if (entry.action === 'APPLICATION_REJECTED') return `Sabab: ${d.reason}`;
  if (entry.action === 'APPLICATION_UPDATED' && d.changes) {
    return Object.entries(d.changes)
      .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: «${v.from ?? '—'}» → «${v.to ?? '—'}»`)
      .join('; ');
  }
  if (entry.action === 'SAMVISION_SYNC_SUCCESS') return `record_id: ${d.recordId}${d.forced ? ' (majburiy yuborish)' : ''}`;
  if (entry.action === 'SAMVISION_SYNC_ERROR') return `${SAMVISION_ERROR_HINTS[d.code] ?? d.code}: ${d.message}`;
  if (entry.action === 'SAMVISION_LINKED') return `record_id: ${d.recordId}`;
  if (entry.action === 'SAMVISION_REFRESHED')
    return d.faceEnrolled === true ? 'Yuz qayd etilgan' : d.faceEnrolled === false ? 'Yuz hali qayd etilmagan' : 'Holat noma’lum';
  return null;
}

/* ------------------------------ Modal oynalar ------------------------------ */

function EditModal({ open, onClose, application, departments, onSaved }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && application) {
      setForm({
        lastName: application.lastName,
        firstName: application.firstName,
        middleName: application.middleName ?? '',
        birthDate: application.birthDate,
        phone: application.phone,
        departmentId: String(application.departmentId ?? ''),
        position: application.position,
        employeeNumber: application.employeeNumber ?? '',
        applicantType: application.applicantType ?? 'EMPLOYEE',
        course: application.course ? String(application.course) : '',
        studyGroup: application.studyGroup ?? '',
      });
      setErrors({});
    }
  }, [open, application]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const student = form.applicantType === 'STUDENT';
      const body = {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        course: student && form.course ? Number(form.course) : null,
        studyGroup: student ? form.studyGroup : null,
        position: student ? undefined : form.position,
      };
      const r = await api.patch(`/admin/applications/${application.id}`, body);
      if (r.data.warning) toast(r.data.warning, { icon: '⚠️', duration: 7000 });
      else toast.success(r.data.changed ? 'O‘zgarishlar saqlandi' : 'O‘zgarish yo‘q');
      onSaved(r.data.application);
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
      title="Ma’lumotlarni tahrirlash"
      size="lg"
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
      {application?.samvision.status === 'SUCCESS' && (
        <Alert tone="warn" icon={TriangleAlert} className="mb-4">
          Xodim allaqachon Sam-Vision bazasida. O‘zgarishlar faqat shu tizimda saqlanadi — kerak bo‘lsa, Sam-Vision kabinetida ham
          yangilang.
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput label="Turi" value={form.applicantType ?? 'EMPLOYEE'} onChange={set('applicantType')} error={errors.applicantType} className="sm:col-span-2">
          <option value="EMPLOYEE">Xodim</option>
          <option value="STUDENT">Talaba</option>
        </SelectInput>
        <TextInput label="Familiya" value={form.lastName ?? ''} onChange={set('lastName')} error={errors.lastName} />
        <TextInput label="Ism" value={form.firstName ?? ''} onChange={set('firstName')} error={errors.firstName} />
        <TextInput label="Otasining ismi" value={form.middleName ?? ''} onChange={set('middleName')} error={errors.middleName} />
        <TextInput label="Tug‘ilgan sana" type="date" value={form.birthDate ?? ''} onChange={set('birthDate')} error={errors.birthDate} />
        <TextInput label="Telefon" value={form.phone ?? ''} onChange={set('phone')} error={errors.phone} hint="+998XXXXXXXXX" />
        <SelectInput label="Bo‘lim" value={form.departmentId ?? ''} onChange={set('departmentId')} error={errors.departmentId}>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.samvisionId ? '' : ' (Sam-Vision’ga bog‘lanmagan)'}
            </option>
          ))}
        </SelectInput>
        {form.applicantType === 'STUDENT' ? (
          <>
            <SelectInput label="Kurs" value={form.course ?? ''} onChange={set('course')} error={errors.course}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                <option key={c} value={c}>
                  {c}-kurs
                </option>
              ))}
            </SelectInput>
            <TextInput label="Guruh" value={form.studyGroup ?? ''} onChange={set('studyGroup')} error={errors.studyGroup} />
          </>
        ) : (
          <TextInput label="Lavozim" value={form.position ?? ''} onChange={set('position')} error={errors.position} />
        )}
        <TextInput
          label={form.applicantType === 'STUDENT' ? 'Talaba ID' : 'Xodim raqami'}
          value={form.employeeNumber ?? ''}
          onChange={set('employeeNumber')}
          error={errors.employeeNumber}
        />
      </div>
    </Modal>
  );
}

function RejectModal({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Arizani rad etish"
      description="Sabab ariza tarixida saqlanadi"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="danger" icon={Ban} loading={loading} disabled={reason.trim().length < 3} onClick={() => onConfirm(reason.trim())}>
            Rad etish
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {REJECT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              reason === r ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <TextArea label="Rad etish sababi" required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
    </Modal>
  );
}

function LinkModal({ open, onClose, candidates, onConfirm, loading }) {
  const [recordId, setRecordId] = useState('');
  useEffect(() => {
    if (open) setRecordId(candidates?.[0]?.record_id ?? '');
  }, [open, candidates]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mavjud Sam-Vision yozuviga bog‘lash"
      description="Yangi xodim yaratilmaydi — ariza tanlangan yozuv bilan bog‘lanadi"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button icon={Link2} loading={loading} disabled={!recordId.trim()} onClick={() => onConfirm(recordId.trim())}>
            Bog‘lash
          </Button>
        </>
      }
    >
      {candidates?.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">Sam-Vision topgan o‘xshash yozuvlar:</p>
          {candidates.map((c) => (
            <label
              key={c.record_id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${
                recordId === c.record_id ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input type="radio" name="candidate" className="mt-1 accent-brand-700" checked={recordId === c.record_id} onChange={() => setRecordId(c.record_id)} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                  {c.full_name || '—'}
                  <Badge tone={c.strength === 'strong' ? 'red' : 'amber'} dot={false}>
                    {c.strength === 'strong' ? 'Kuchli moslik' : 'Qisman moslik'}
                  </Badge>
                </span>
                <span className="block text-slate-500">
                  {[c.birth_date && `Tug‘ilgan: ${c.birth_date}`, c.employee_number && `№${c.employee_number}`, c.position].filter(Boolean).join(' · ') || '—'}
                </span>
                <span className="block font-mono text-xs text-slate-400">{c.record_id}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      <TextInput label="Sam-Vision record_id" value={recordId} onChange={(e) => setRecordId(e.target.value)} hint="Kabinetdagi xodim kartasidan ham olish mumkin" />
    </Modal>
  );
}

function ConfirmModal({ open, onClose, title, children, confirmLabel, variant = 'primary', icon, loading, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant={variant} icon={icon} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{children}</div>
    </Modal>
  );
}

/* ------------------------------ Sahifa ------------------------------ */

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [audit, setAudit] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [modal, setModal] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);
  const photoInput = useRef(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await api.get(`/admin/applications/${id}`);
      setApp(r.data.application);
      setAudit(r.data.audit);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Ariza topilmadi yoki o‘chirilgan' : errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
    api
      .get('/admin/departments')
      .then((r) => setDepartments(r.data.items))
      .catch(() => {});
  }, [load]);

  async function refreshAudit() {
    try {
      const r = await api.get(`/admin/applications/${id}`);
      setAudit(r.data.audit);
    } catch {
      /* e'tiborsiz */
    }
  }

  function reportSync(application) {
    const s = application.samvision;
    if (s.status === 'SUCCESS') toast.success('Xodim Sam-Vision bazasiga qo‘shildi');
    else if (s.status === 'ERROR') toast.error(`Sam-Vision: ${SAMVISION_ERROR_HINTS[s.errorCode] ?? s.errorCode}`, { duration: 6000 });
  }

  async function run(name, fn) {
    setBusy(name);
    try {
      await fn();
    } catch (err) {
      toast.error(errorMessage(err));
      await load();
    } finally {
      setBusy('');
      refreshAudit();
    }
  }

  const approve = () =>
    run('approve', async () => {
      const r = await api.post(`/admin/applications/${id}/approve`);
      setApp(r.data.application);
      setModal('');
      if (r.data.syncAttempted) reportSync(r.data.application);
      else toast.success('Ariza tasdiqlandi (Sam-Vision integratsiyasi o‘chirilgan)');
    });

  const reject = (reason) =>
    run('reject', async () => {
      const r = await api.post(`/admin/applications/${id}/reject`, { reason });
      setApp(r.data.application);
      setModal('');
      toast.success('Ariza rad etildi');
    });

  const sync = (force = false) =>
    run(force ? 'force' : 'sync', async () => {
      const r = await api.post(`/admin/applications/${id}/sync`, { force });
      setApp(r.data.application);
      setModal('');
      reportSync(r.data.application);
    });

  const link = (recordId) =>
    run('link', async () => {
      const r = await api.post(`/admin/applications/${id}/link`, { recordId });
      setApp(r.data.application);
      setModal('');
      toast.success('Ariza Sam-Vision yozuviga bog‘landi');
    });

  const refreshRemote = () =>
    run('refresh', async () => {
      const r = await api.post(`/admin/applications/${id}/refresh`);
      setApp(r.data.application);
      const f = r.data.application.samvision.faceEnrolled;
      toast.success(f === true ? 'Yuz terminalda qayd etilgan' : f === false ? 'Yuz hali qayd etilmagan' : 'Holat yangilandi');
    });

  const remove = () =>
    run('delete', async () => {
      await api.delete(`/admin/applications/${id}`);
      toast.success('Ariza va surat o‘chirildi');
      navigate('/admin/arizalar', { replace: true });
    });

  async function replacePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await run('photo', async () => {
      const { blob } = await fileToNormalizedJpeg(file);
      const fd = new FormData();
      fd.append('photo', blob, 'face.jpg');
      const r = await api.put(`/admin/applications/${id}/photo`, fd);
      setApp(r.data.application);
      setPhotoVersion((v) => v + 1);
      toast.success('Surat almashtirildi');
    });
  }

  if (error) {
    return (
      <div className="card">
        <ErrorState message={error} onRetry={load} />
        <div className="pb-8 text-center">
          <Link to="/admin/arizalar" className="text-sm font-semibold text-brand-700">
            Arizalar ro‘yxatiga qaytish
          </Link>
        </div>
      </div>
    );
  }
  if (!app) return <PageLoader />;

  const sv = app.samvision;
  const lockedRemote = sv.status === 'SUCCESS' || sv.status === 'SENDING';
  const canApprove = app.status !== 'APPROVED';
  const canReject = app.status !== 'REJECTED' && !lockedRemote;
  const canSync = app.status === 'APPROVED' && (sv.status === 'ERROR' || sv.status === 'NOT_SENT');
  const isDuplicate = sv.status === 'ERROR' && sv.errorCode === 'DUPLICATE';
  const candidates = sv.response?.error?.body?.candidates ?? [];
  const conflict = sv.response?.error?.conflict;
  const svError = sv.status === 'ERROR' ? sv.response?.error : null;
  const serverCheck = app.photoCheck?.server;
  const clientCheck = app.photoCheck?.client;
  const isStudent = app.applicantType === 'STUDENT';

  return (
    <div className="animate-fade-in">
      <Link to="/admin/arizalar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Arizalar
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{app.fullName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={app.status} />
            <SamVisionBadge status={sv.status} />
            <span className="font-mono text-xs text-slate-400">{app.trackingCode}</span>
            <span className="text-xs text-slate-400">· {formatDateTime(app.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <Button variant="success" icon={CheckCircle2} onClick={() => setModal('approve')} loading={busy === 'approve'}>
              Tasdiqlash
            </Button>
          )}
          {canReject && (
            <Button variant="danger-outline" icon={Ban} onClick={() => setModal('reject')}>
              Rad etish
            </Button>
          )}
          <Button variant="outline" icon={Pencil} onClick={() => setModal('edit')} disabled={sv.status === 'SENDING'}>
            Tahrirlash
          </Button>
          {!lockedRemote && (
            <Button variant="ghost" icon={Trash2} onClick={() => setModal('delete')} className="text-red-600 hover:bg-red-50">
              O‘chirish
            </Button>
          )}
        </div>
      </div>

      {app.status === 'REJECTED' && app.rejectionReason && (
        <Alert tone="error" icon={XCircle} title="Ariza rad etilgan" className="mb-6">
          {app.rejectionReason}
          {app.reviewedBy && (
            <span className="mt-1 block text-xs opacity-75">
              {app.reviewedBy.fullName || app.reviewedBy.username} · {formatDateTime(app.reviewedAt)}
            </span>
          )}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Chap ustun — surat */}
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <AuthorizedPhoto id={app.id} version={photoVersion} />
            <div className="space-y-2 p-4 text-sm">
              <p className="font-semibold text-slate-900">Surat tekshiruvi</p>
              {clientCheck?.detector === 'mediapipe' ? (
                <p className="flex items-center gap-1.5 text-slate-600">
                  <ScanFace className="h-4 w-4 text-emerald-600" />
                  Yuz aniqlandi: {clientCheck.faces ?? '—'} ta, ishonch {clientCheck.faceScore != null ? `${Math.round(clientCheck.faceScore * 100)}%` : '—'}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-amber-700">
                  <TriangleAlert className="h-4 w-4" /> Yuz avtomatik tekshirilmagan — qo‘lda tekshiring
                </p>
              )}
              {serverCheck && (
                <p className="text-slate-500">
                  {serverCheck.width}×{serverCheck.height} · yorug‘lik {Math.round(serverCheck.brightness)} · aniqlik {Math.round(serverCheck.sharpness)}
                </p>
              )}
              {serverCheck?.warnings?.length > 0 && <p className="text-amber-700">{serverCheck.warnings.join('; ')}</p>}
              {!lockedRemote && (
                <>
                  <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={replacePhoto} />
                  <Button variant="secondary" size="sm" icon={ImageUp} className="mt-2 w-full" loading={busy === 'photo'} onClick={() => photoInput.current?.click()}>
                    Suratni almashtirish
                  </Button>
                </>
              )}
            </div>
          </section>

          <Card title="Rozilik" icon={ShieldCheck}>
            <dl className="divide-y divide-slate-100">
              <InfoRow label="Holat">{app.consent.given ? 'Berilgan' : 'Berilmagan'}</InfoRow>
              <InfoRow label="Versiya">{app.consent.version}</InfoRow>
              <InfoRow label="Vaqt">{formatDateTime(app.consent.at)}</InfoRow>
              <InfoRow label="IP manzil" mono>
                {app.consent.ip}
              </InfoRow>
            </dl>
          </Card>
        </div>

        {/* O‘ng ustun */}
        <div className="min-w-0 space-y-6">
          <Card title={isStudent ? 'Talaba ma’lumotlari' : 'Xodim ma’lumotlari'}>
            <dl className="divide-y divide-slate-100">
              <InfoRow label="Turi">
                <Badge tone={APPLICANT_TYPES[app.applicantType]?.tone ?? 'blue'} dot={false}>
                  {APPLICANT_TYPES[app.applicantType]?.label ?? 'Xodim'}
                </Badge>
              </InfoRow>
              <InfoRow label="Familiya">{app.lastName}</InfoRow>
              <InfoRow label="Ism">{app.firstName}</InfoRow>
              <InfoRow label="Otasining ismi">{app.middleName}</InfoRow>
              <InfoRow label="Tug‘ilgan sana">{formatBirthDate(app.birthDate)}</InfoRow>
              <InfoRow label="Telefon">
                <a href={`tel:${app.phone}`} className="text-brand-700 hover:underline">
                  {formatPhone(app.phone)}
                </a>
              </InfoRow>
              <InfoRow label={isStudent ? 'Fakultet / bo‘lim' : 'Bo‘lim'}>
                {app.departmentName}
                {app.departmentName && !app.departmentSamvisionId && (
                  <span className="mt-1 block text-xs font-normal text-amber-700">Sam-Vision bo‘limiga bog‘lanmagan</span>
                )}
              </InfoRow>
              {isStudent ? (
                <>
                  <InfoRow label="Kurs">{app.course ? `${app.course}-kurs` : null}</InfoRow>
                  <InfoRow label="Guruh">{app.studyGroup}</InfoRow>
                </>
              ) : (
                <InfoRow label="Lavozim">{app.position}</InfoRow>
              )}
              <InfoRow label={isStudent ? 'Talaba ID' : 'Xodim raqami'}>{app.employeeNumber}</InfoRow>
              {app.reviewedBy && (
                <InfoRow label="Ko‘rib chiqdi">
                  {app.reviewedBy.fullName || app.reviewedBy.username} · {formatDateTime(app.reviewedAt)}
                </InfoRow>
              )}
            </dl>
          </Card>

          <Card
            title="Sam-Vision bazasi"
            icon={CloudUpload}
            actions={
              sv.recordId && (
                <Button variant="ghost" size="sm" icon={RefreshCw} loading={busy === 'refresh'} onClick={refreshRemote}>
                  Terminal holati
                </Button>
              )
            }
          >
            {app.status !== 'APPROVED' && sv.status === 'NOT_SENT' && (
              <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" /> Ariza tasdiqlangandan so‘ng avtomatik yuboriladi
              </p>
            )}

            {svError && (
              <Alert tone="error" icon={TriangleAlert} title={SAMVISION_ERROR_HINTS[svError.code] ?? 'Yuborishda xatolik'} className="my-2">
                {svError.message}
                {svError.status ? <span className="ml-1 opacity-70">(HTTP {svError.status})</span> : null}
                {conflict && (
                  <span className="mt-1 block">
                    Band qiymat: <b>{conflict.value}</b>, egasi: <span className="font-mono">{conflict.ownerId}</span>
                  </span>
                )}
              </Alert>
            )}

            {isDuplicate && candidates.length > 0 && (
              <div className="my-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm">
                <p className="mb-2 font-semibold text-amber-900">Sam-Vision’dagi o‘xshash yozuvlar:</p>
                <ul className="space-y-1.5">
                  {candidates.map((c) => (
                    <li key={c.record_id} className="text-amber-900">
                      <b>{c.full_name}</b> {c.birth_date && `· ${c.birth_date}`} {c.employee_number && `· №${c.employee_number}`}{' '}
                      <Badge tone={c.strength === 'strong' ? 'red' : 'amber'} dot={false} className="ml-1">
                        {c.strength === 'strong' ? 'kuchli' : 'qisman'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <dl className="divide-y divide-slate-100">
              <InfoRow label="Holat">
                <SamVisionBadge status={sv.status} />
              </InfoRow>
              <InfoRow label="Sam-Vision ID" mono>
                {sv.recordId}
                {sv.recordId && (
                  <Link
                    to={`/admin/xodimlar/${sv.recordId}`}
                    className="mt-1 flex items-center gap-1 font-sans text-sm font-semibold text-brand-700 hover:underline"
                  >
                    <CalendarDays className="h-4 w-4" /> Sam-Vision kartasi va davomati
                  </Link>
                )}
              </InfoRow>
              <InfoRow label="Yuz terminalda">
                {sv.faceEnrolled === true ? (
                  <span className="text-emerald-700">Qayd etilgan</span>
                ) : sv.faceEnrolled === false ? (
                  <span className="text-amber-700">Hali qayd etilmagan (terminal sinxronizatsiyasi kutilmoqda)</span>
                ) : sv.recordId ? (
                  'Noma’lum — «Terminal holati» tugmasini bosing'
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Urinishlar">{sv.attempts}</InfoRow>
              <InfoRow label="Yuborilgan vaqt">{sv.sentAt ? formatDateTime(sv.sentAt) : '—'}</InfoRow>
              {sv.checkedAt && <InfoRow label="Oxirgi tekshiruv">{formatDateTime(sv.checkedAt)}</InfoRow>}
            </dl>

            {(canSync || isDuplicate) && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 pb-1">
                {canSync && !isDuplicate && (
                  <Button icon={Send} loading={busy === 'sync'} onClick={() => sync(false)}>
                    {sv.status === 'ERROR' ? 'Qayta yuborish' : 'Sam-Vision’ga yuborish'}
                  </Button>
                )}
                {isDuplicate && (
                  <>
                    <Button icon={Link2} onClick={() => setModal('link')}>
                      Mavjud yozuvga bog‘lash
                    </Button>
                    <Button variant="outline" icon={Send} onClick={() => setModal('force')}>
                      Baribir yangi xodim sifatida yuborish
                    </Button>
                  </>
                )}
                {sv.status === 'ERROR' && !isDuplicate && (
                  <Button variant="outline" icon={Link2} onClick={() => setModal('link')}>
                    Mavjud yozuvga bog‘lash
                  </Button>
                )}
              </div>
            )}

            {sv.response && (
              <details className="mt-3 rounded-xl border border-slate-200 text-sm">
                <summary className="cursor-pointer px-3 py-2 font-medium text-slate-600 select-none">Sam-Vision so‘rov/javobi (texnik)</summary>
                <pre className="max-h-80 overflow-auto border-t border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {JSON.stringify(sv.response, null, 2)}
                </pre>
              </details>
            )}
          </Card>

          <Card title="Ariza tarixi" icon={Clock}>
            {audit.length === 0 ? (
              <p className="py-2 text-sm text-slate-500">Yozuvlar yo‘q</p>
            ) : (
              <ol className="relative my-2 space-y-4 border-l border-slate-200 pl-5">
                {audit.map((e) => {
                  const detail = auditDetails(e);
                  const bad = e.action.endsWith('ERROR') || e.action === 'APPLICATION_REJECTED';
                  return (
                    <li key={e.id} className="relative">
                      <span
                        className={`absolute top-1 -left-[25px] h-2.5 w-2.5 rounded-full ring-4 ring-white ${bad ? 'bg-red-500' : 'bg-brand-500'}`}
                      />
                      <p className="text-sm font-medium text-slate-900">{AUDIT_LABELS[e.action] ?? e.action}</p>
                      {detail && <p className="text-sm break-words text-slate-600">{detail}</p>}
                      <p className="text-xs text-slate-400">
                        {formatDateTime(e.createdAt)} · {e.admin ?? 'Xodimning o‘zi'}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={modal === 'approve'}
        onClose={() => setModal('')}
        title="Arizani tasdiqlash"
        confirmLabel="Tasdiqlash va yuborish"
        variant="success"
        icon={CheckCircle2}
        loading={busy === 'approve'}
        onConfirm={approve}
      >
        <p>
          <b>{app.fullName}</b> arizasi tasdiqlanadi va xodim darhol Sam-Vision bazasiga qo‘shiladi.
        </p>
        {!app.departmentSamvisionId && (
          <Alert tone="warn" className="mt-3">
            «{app.departmentName ?? '—'}» bo‘limi Sam-Vision bo‘limiga bog‘lanmagan — yuborish xato bilan tugaydi. Avval bo‘limni
            bog‘lang yoki arizadagi bo‘limni o‘zgartiring.
          </Alert>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={modal === 'force'}
        onClose={() => setModal('')}
        title="Baribir yuborish"
        confirmLabel="Yangi xodim yaratish"
        icon={Send}
        loading={busy === 'force'}
        onConfirm={() => sync(true)}
      >
        Sam-Vision’da o‘xshash xodim topilgan. Agar bu boshqa shaxs ekanini tekshirgan bo‘lsangiz, takroriylik tekshiruvisiz yangi
        xodim yaratiladi.
      </ConfirmModal>

      <ConfirmModal
        open={modal === 'delete'}
        onClose={() => setModal('')}
        title="Arizani o‘chirish"
        confirmLabel="O‘chirish"
        variant="danger"
        icon={Trash2}
        loading={busy === 'delete'}
        onConfirm={remove}
      >
        Ariza va xodimning surati butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.
      </ConfirmModal>

      <RejectModal open={modal === 'reject'} onClose={() => setModal('')} onConfirm={reject} loading={busy === 'reject'} />
      <LinkModal open={modal === 'link'} onClose={() => setModal('')} candidates={candidates} onConfirm={link} loading={busy === 'link'} />
      <EditModal
        open={modal === 'edit'}
        onClose={() => setModal('')}
        application={app}
        departments={departments}
        onSaved={(a) => {
          setApp(a);
          refreshAudit();
        }}
      />
    </div>
  );
}
