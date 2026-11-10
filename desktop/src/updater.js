/**
 * Avtomatik yangilanish (electron-updater, GitHub Releases).
 *
 * Ishlash tartibi:
 *  1. Ilova ochilganda (va har 30 daqiqada) GitHub'dagi eng so‘nggi relizni tekshiradi.
 *  2. Yangi versiya bo‘lsa — admin panel tepasida «Yangi versiya mavjud — Yangilash» chiqadi.
 *  3. «Yangilash» → yuklab olinadi (jarayon foizi ko‘rinadi) → «Qayta ishga tushirish» → o‘rnatiladi.
 *     Dasturni o‘chirib qayta o‘rnatish shart emas; sozlamalar saqlanib qoladi.
 */
const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

let window = null;
let lastStatus = { state: 'idle' };
let timer = null;

function send(status) {
  lastStatus = status;
  if (window && !window.isDestroyed()) window.webContents.send('update:status', status);
}

function errorText(err) {
  const msg = String(err?.message ?? err);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|net::/i.test(msg)) return 'Internetga ulanib bo‘lmadi';
  if (/404|No published versions|Cannot find latest/i.test(msg)) return 'Yangilanishlar serverida reliz topilmadi';
  return msg.split('\n')[0].slice(0, 200);
}

async function check({ manual = false } = {}) {
  if (!app.isPackaged) {
    const s = { state: 'dev', message: 'Ishlab chiqish rejimida yangilanish tekshirilmaydi (faqat o‘rnatilgan exe’da)' };
    if (manual) send(s);
    return s;
  }
  try {
    send({ state: 'checking', manual });
    await autoUpdater.checkForUpdates();
  } catch (err) {
    send({ state: 'error', message: errorText(err), manual });
  }
  return lastStatus;
}

function init(win) {
  window = win;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('update-available', (info) =>
    send({ state: 'available', version: info.version, notes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null }),
  );
  autoUpdater.on('update-not-available', () => send({ state: 'none', version: app.getVersion(), manual: lastStatus.manual }));
  autoUpdater.on('download-progress', (p) => send({ state: 'downloading', percent: Math.round(p.percent ?? 0), version: lastStatus.version }));
  autoUpdater.on('update-downloaded', (info) => send({ state: 'downloaded', version: info.version }));
  autoUpdater.on('error', (err) => send({ state: 'error', message: errorText(err) }));

  ipcMain.handle('update:status', () => lastStatus);
  ipcMain.handle('update:check', () => check({ manual: true }));
  ipcMain.handle('update:download', async () => {
    if (!app.isPackaged) return { ok: false };
    send({ state: 'downloading', percent: 0, version: lastStatus.version });
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (err) {
      send({ state: 'error', message: errorText(err) });
      return { ok: false };
    }
  });
  ipcMain.handle('update:install', () => {
    // isSilent=false, isForceRunAfter=true — o‘rnatilgach ilova o‘zi qayta ochiladi
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return { ok: true };
  });

  setTimeout(() => check(), 5000);
  timer = setInterval(() => check(), 30 * 60 * 1000);
}

function setWindow(win) {
  window = win;
}

function stop() {
  if (timer) clearInterval(timer);
}

module.exports = { init, check, setWindow, stop };
