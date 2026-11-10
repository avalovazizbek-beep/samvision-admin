import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, KeyRound, PlugZap, ServerCog, XCircle } from 'lucide-react';
import { PageHeader } from '../../layouts/AdminLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Alert, ErrorState, PageLoader } from '../../components/ui/Feedback.jsx';
import { TextInput } from '../../components/ui/Field.jsx';
import ReauthGate from '../../components/admin/ReauthGate.jsx';
import { api, deviceStore, errorMessage, fieldErrors } from '../../lib/api.js';

function Row({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-900">
        {ok === true && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
        {ok === false && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setErrors({ confirm: 'Parollar mos kelmadi' });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      // Shu kompyuterning PIN kodi saqlanib qoladi, boshqa kompyuterlardagilari bekor qilinadi
      const deviceToken = await deviceStore.get().catch(() => null);
      const r = await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword, deviceToken });
      toast.success(r.data.revokedDevices ? `Parol almashtirildi. Boshqa ${r.data.revokedDevices} ta qurilmadagi PIN kod bekor qilindi` : 'Parol almashtirildi');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={submit} className="card p-5" noValidate>
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
        <KeyRound className="h-[18px] w-[18px] text-brand-600" /> Administrator parolini almashtirish
      </h2>
      <div className="space-y-4">
        <TextInput label="Joriy parol" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
        <TextInput label="Yangi parol" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="Kamida 10 belgi, harf va raqam" />
        <TextInput label="Yangi parolni takrorlang" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" loading={saving}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}

function IntegrationContent() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  async function load() {
    setError('');
    try {
      const r = await api.get('/admin/samvision/status');
      setStatus(r.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const r = await api.post('/admin/samvision/test');
      setResult(r.data);
      if (r.data.ok) toast.success('Sam-Vision bilan aloqa ishlayapti');
      else toast.error('Tekshiruvda muammo topildi');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTesting(false);
    }
  }

  if (error) return <div className="card"><ErrorState message={error} onRetry={load} /></div>;
  if (!status) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sam-Vision integratsiyasi"
        description="Ulanish sozlamalari backend .env faylida saqlanadi — bu yerda faqat holati ko‘rsatiladi"
        actions={
          <Button icon={PlugZap} loading={testing} onClick={test}>
            Ulanishni tekshirish
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <ServerCog className="h-[18px] w-[18px] text-brand-600" /> Joriy sozlamalar
            </h2>
            <div className="divide-y divide-slate-100">
              <Row label="Integratsiya" value={status.enabled ? 'Yoqilgan' : 'O‘chirilgan'} ok={status.enabled} />
              <Row label="API manzili" value={`${status.baseUrl}${status.apiPrefix}`} />
              <Row label="Avtorizatsiya" value={status.authMode === 'login' ? 'Login + parol' : `API kalit (${status.apiKeyHeader})`} />
              {status.authMode === 'login' ? (
                <>
                  <Row label="Login" value={status.identifierSet ? 'Kiritilgan' : 'Kiritilmagan'} ok={status.identifierSet} />
                  <Row label="Parol" value={status.passwordSet ? 'Kiritilgan' : 'Kiritilmagan'} ok={status.passwordSet} />
                </>
              ) : (
                <Row label="API kalit" value={status.apiKeySet ? 'Kiritilgan' : 'Kiritilmagan'} ok={status.apiKeySet} />
              )}
              <Row label="Kompaniya (X-Company-Id)" value={status.companyId ?? 'Kiritilmagan'} ok={!!status.companyId} />
              <Row label="Kutish vaqti" value={`${Math.round(status.timeoutMs / 1000)} soniya`} />
            </div>
            {status.issues.length > 0 && (
              <Alert tone="warn" className="mt-4" title="Sozlanishi kerak">
                <ul className="list-disc pl-4">
                  {status.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </section>

          <Alert tone="info" title="Yuz biometrik shabloni haqida">
            Tizim Sam-Vision’ga oddiy yuz suratini (<code>avatar_base64</code>) yuboradi, <code>face_template</code> bo‘sh qoladi —
            Sam-Vision kabinetining o‘zi ham shunday qiladi. Terminal sinxronlanganda suratdan yuzni o‘zi qayd etadi. Holatini
            ariza sahifasidagi «Terminal holati» tugmasi bilan tekshiring.
          </Alert>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Ulanish tekshiruvi</h2>
            {!result ? (
              <p className="text-sm text-slate-500">
                «Ulanishni tekshirish» faqat o‘qish so‘rovlarini bajaradi (login, kompaniyalar, bo‘limlar, xodimlar ro‘yxatiga
                ruxsat). Hech qanday xodim yaratilmaydi.
              </p>
            ) : (
              <ol className="space-y-3">
                {result.steps.map((s) => (
                  <li key={s.name} className="flex gap-3 text-sm">
                    {s.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {s.name} {s.ms != null && <span className="font-normal text-slate-400">· {s.ms} ms</span>}
                      </p>
                      {s.error && (
                        <p className="text-red-600">
                          {s.error.code ? `[${s.error.code}${s.error.status ? ` / HTTP ${s.error.status}` : ''}] ` : ''}
                          {s.error.message}
                        </p>
                      )}
                      {s.detail?.companies && (
                        <ul className="mt-1 space-y-0.5 text-slate-600">
                          {s.detail.companies.map((c) => (
                            <li key={c.id}>
                              <span className="font-mono text-xs">{c.id}</span> — {c.name}
                            </li>
                          ))}
                        </ul>
                      )}
                      {s.detail?.name && <p className="text-slate-600">{s.detail.name}</p>}
                      {s.detail?.count != null && !s.detail.companies && <p className="text-slate-600">Topildi: {s.detail.count} ta</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <ChangePassword />
        </div>
      </div>
    </div>
  );
}

export default function IntegrationPage() {
  return (
    <ReauthGate
      title="Himoyalangan bo‘lim"
      description="Integratsiya sozlamalari va administrator parolini ko‘rish uchun administrator login va parolini kiriting"
    >
      <IntegrationContent />
    </ReauthGate>
  );
}
