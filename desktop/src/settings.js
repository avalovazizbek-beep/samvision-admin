/**
 * Ilova sozlamalari: %APPDATA%\Sam-Vision Admin\settings.json
 *   deviceToken — PIN bilan kirish uchun qurilma kaliti (Windows DPAPI bilan shifrlangan)
 *   bounds      — oyna o‘lchami va joylashuvi
 * Server manzili bu yerda emas — u dasturga qotirilgan (package.json → "samvision".serverUrl).
 * Yangilanishda bu fayl saqlanib qoladi (u dastur papkasida emas).
 */
const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const file = () => path.join(app.getPath('userData'), 'settings.json');
let cache = null;

function get() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(file(), 'utf8'));
  } catch {
    cache = {};
  }
  return cache;
}

function set(patch) {
  cache = { ...get(), ...patch };
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(cache, null, 2), 'utf8');
  return cache;
}

/** "192.168.1.10:4800" → "http://192.168.1.10:4800"; oxiridagi "/" va "/api" olib tashlanadi */
function normalizeUrl(input) {
  let v = String(input ?? '').trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
  const u = new URL(v);
  return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '').replace(/\/api$/, '')}`;
}

module.exports = { get, set, normalizeUrl };
