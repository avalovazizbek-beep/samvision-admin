/**
 * Avtomatik yangilanish (electron-updater, GitHub Releases).
 *
 * Ishlash tartibi:
 *  1. Ilova ochilganda va har 30 daqiqada GitHub'dagi eng so‘nggi relizni tekshiradi.
 *  2. Yangi versiya bo‘lsa — admin panel tepasida «Yangi versiya mavjud — Yangilash».
 *  3. «Yangilash» → yuklab olinadi (foizi ko‘rinadi) → o‘zi jimgina o‘rnatiladi → dastur qayta ochiladi.
 *     Dasturni o‘chirib qayta o‘rnatish shart emas; sozlamalar saqlanib qoladi.
 * Avtomatik tekshiruvdagi xatolar (internet yo‘q va h.k.) foydalanuvchiga ko‘rsatilmaydi.
 */
const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

let window = null;
let lastStatus = { state: 'idle' };
let timer = null;
let manualCheck = false;

// Relizlar hali umuman yo‘q — bu xato emas, "eng so‘nggi versiya" degani
const NO_RELEASE = /404|No published versions|Cannot find latest|Unable to find latest version|latest\.yml/i;

function send(status) {
  lastStatus = status;
  if (window && !window.isDestroyed()) window.webContents.send('update:status', status);
}

function errorText(err) {
  const msg = String(err?.message ?? err);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|net::/i.test(msg)) return 'Internetga ulanib bo‘lmadi';
  return msg.split('\n')[0].slice(0, 200);
}

function onError(err) {
  if (NO_RELEASE.test(String(err?.message ?? err))) {
    send({ state: 'none', version: app.getVersion(), manual: manualCheck });
  } else {
    send({ state: 'error', message: errorText(err), manual: manualCheck });
  }
}

async function check({ manual = false } = {}) {
  manualCheck = manual;
  if (!app.isPackaged) {
    const s = { state: 'dev', message: 'Ishlab chiqish rejimida yangilanish tekshirilmaydi (faqat o‘rnatilgan exe’da)', manual };
    send(s);
    return s;
  }
  // Yuklab olinayotgan yoki o‘rnatilayotgan bo‘lsa — qayta tekshirmaymiz
  if (['downloading', 'installing'].includes(lastStatus.state)) return lastStatus;
  try {
    send({ state: 'checking', manual });
    await autoUpdater.checkForUpdates();
  } catch (err) {
    onError(err);
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
  autoUpdater.on('update-not-available', () => send({ state: 'none', version: app.getVersion(), manual: manualCheck }));
  autoUpdater.on('download-progress', (p) => send({ state: 'downloading', percent: Math.round(p.percent ?? 0), version: lastStatus.version }));
  autoUpdater.on('update-downloaded', (info) => {
    // Yuklab olindi — jimgina o‘rnatib, dasturni qayta ochamiz (foydalanuvchi hech narsa bosmaydi)
    send({ state: 'installing', version: info.version });
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 2500);
  });
  autoUpdater.on('error', onError);

  ipcMain.handle('update:status', () => lastStatus);
  ipcMain.handle('update:check', () => check({ manual: true }));
  ipcMain.handle('update:download', async () => {
    if (!app.isPackaged) return { ok: false };
    send({ state: 'downloading', percent: 0, version: lastStatus.version });
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (err) {
      manualCheck = true; // foydalanuvchi o‘zi bosgan — xatoni ko‘rsatamiz
      onError(err);
      return { ok: false };
    }
  });
  ipcMain.handle('update:install', () => {
    send({ state: 'installing', version: lastStatus.version });
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
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
