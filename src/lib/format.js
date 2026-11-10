const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

/** Toshkent vaqti (UTC+5, yozgi vaqt yo‘q) */
function tashkent(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 5 * 3600 * 1000);
}

const pad = (n) => String(n).padStart(2, '0');

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = tashkent(iso);
  if (!d) return '—';
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function formatDateShort(iso) {
  if (!iso) return '—';
  const d = tashkent(iso);
  if (!d) return '—';
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** "YYYY-MM-DD" → "12 aprel 1995" */
export function formatBirthDate(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return s || '—';
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function dayLabel(s) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'hozirgina';
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} kun oldin`;
  return formatDateShort(iso);
}

/** +998901234567 → +998 90 123 45 67 */
export function formatPhone(p) {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(p ?? '');
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p ?? '—';
}

/** Kiritish vaqtida telefon maskasi: "90 123 45 67" */
export function maskPhoneInput(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length > 9) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

/** Unix millis → Toshkent vaqti "HH:MM" */
export function clockTime(millis) {
  if (!millis) return '—';
  const d = new Date(Number(millis) + 5 * 3600 * 1000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** daqiqa → "7 s 45 daq" */
export function duration(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (!m) return '—';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} s${r ? ` ${r} daq` : ''}` : `${r} daq`;
}

/** Toshkent vaqti bo‘yicha joriy oy "YYYY-MM" */
export function currentMonth() {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 7);
}

/** "2026-11" → "Noyabr 2026" */
export function monthLabel(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return ym;
  const name = MONTHS[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
}

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
/** Sam-Vision weekday (1 = dushanba … 7 = yakshanba) */
export function weekdayShort(n) {
  return WEEKDAYS[(Number(n) - 1 + 7) % 7] ?? '';
}

export function initials(name) {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
