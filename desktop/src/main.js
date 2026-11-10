/**
 * Sam-Vision Admin — Windows ilovasi (Electron).
 *
 *  - Admin panel interfeysi ilova ichida (ui/), ma'lumotlar esa backend serveridan olinadi.
 *  - Server manzili dasturga qotirilgan (package.json → "samvision".serverUrl) — foydalanuvchidan so‘ralmaydi.
 *    Manzil o‘zgarsa, yangi versiya chiqariladi va dastur o‘zi yangilanadi.
 *  - Yangi versiya chiqsa, ilova ichida «Yangilash» taklif qilinadi (updater.js).
 *
 * Buyruq qatori parametrlari (ishlab chiqish uchun):
 *   --dev-url=http://localhost:5180   interfeysni Vite dev serveridan yuklash
 *   --server=URL                      boshqa backend bilan ishlash (masalan http://localhost:4800)
 *   --smoke-test                      oynasiz tekshiruv: interfeys va /api proksi ishlashini tekshirib chiqadi
 *   --user-data=PAPKA                 sozlamalar papkasini almashtirish (testlar uchun)
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, shell } = require('electron');
const settings = require('./settings');
const { startLocalServer } = require('./localServer');
const updater = require('./updater');

const args = process.argv.slice(1);
const argValue = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : undefined;
};
const SMOKE = args.includes('--smoke-test');
const DEV_URL = argValue('dev-url')?.replace(/\/+$/, '');
const USER_DATA = argValue('user-data');
if (USER_DATA) app.setPath('userData', path.resolve(USER_DATA));

const UI_DIR = path.join(__dirname, '..', 'ui');
const ICON = path.join(__dirname, '..', 'build', 'icon.png');
// Server manzili: package.json → "samvision".serverUrl (faqat ishlab chiqishda --server bilan almashtiriladi)
const SERVER_URL = settings.normalizeUrl(argValue('server') || require('../package.json').samvision?.serverUrl || '');

app.setAppUserModelId('uz.samvision.admin');

if (!SMOKE && !app.requestSingleInstanceLock()) {
  app.quit();
}

// Yangilangandan keyingi birinchi ochilish — admin panelda «Dastur yangilandi» xabari chiqadi.
// 1.0.1 versiya o‘zidan oldingi versiyani yozib qo‘ymagan: sozlamalar fayli bo‘lsa — demak avval ishlatilgan.
const previous = settings.get();
const UPDATED_FROM =
  previous.lastVersion && previous.lastVersion !== app.getVersion()
    ? previous.lastVersion
    : !previous.lastVersion && Object.keys(previous).length > 0
      ? 'oldingi versiya'
      : null;
if (previous.lastVersion !== app.getVersion()) settings.set({ lastVersion: app.getVersion() });

let mainWindow = null;
let local = null;
let base = null;
let updaterStarted = false;

/* ------------------------------ PIN uchun qurilma kaliti ------------------------------ */

// Server bergan qurilma kaliti Windows himoyasi (DPAPI) bilan shifrlanib settings.json'da saqlanadi
function readDeviceToken() {
  const stored = settings.get().deviceToken;
  if (!stored) return null;
  try {
    if (stored.startsWith('enc:')) return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'));
    return stored.startsWith('raw:') ? stored.slice(4) : null;
  } catch {
    return null;
  }
}

function writeDeviceToken(token) {
  if (!token) {
    settings.set({ deviceToken: null });
    return;
  }
  const value = safeStorage.isEncryptionAvailable() ? `enc:${safeStorage.encryptString(String(token)).toString('base64')}` : `raw:${token}`;
  settings.set({ deviceToken: value });
}

ipcMain.handle('device-token:get', () => readDeviceToken());
ipcMain.handle('device-token:set', (_e, token) => {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,200}$/.test(token)) return false;
  writeDeviceToken(token);
  return true;
});
ipcMain.handle('device-token:clear', () => writeDeviceToken(null));

/* ------------------------------ Admin panelga ko‘prik ------------------------------ */

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  packaged: app.isPackaged,
  serverUrl: SERVER_URL,
  hostname: os.hostname(),
  updatedFrom: UPDATED_FROM,
}));
ipcMain.handle('app:open-external', (_e, url) => {
  if (/^https?:\/\//i.test(String(url))) shell.openExternal(url);
});

/* ------------------------------ Menyu ------------------------------ */

function buildMenu() {
  const template = [
    {
      label: 'Dastur',
      submenu: [
        { label: 'Yangilanishlarni tekshirish', click: () => updater.check({ manual: true }) },
        { type: 'separator' },
        { label: 'Chiqish', role: 'quit' },
      ],
    },
    {
      label: 'Ko‘rinish',
      submenu: [
        { label: 'Qayta yuklash', role: 'reload' },
        { type: 'separator' },
        { label: 'Kattalashtirish', role: 'zoomIn' },
        { label: 'Kichiklashtirish', role: 'zoomOut' },
        { label: 'Asl o‘lcham', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'To‘liq ekran', role: 'togglefullscreen' },
        ...(app.isPackaged ? [] : [{ label: 'Dasturchi vositalari', role: 'toggleDevTools' }]),
      ],
    },
    {
      label: 'Yordam',
      submenu: [
        {
          label: 'Dastur haqida',
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sam-Vision Admin',
              message: `Sam-Vision Admin ${app.getVersion()}`,
              detail: `Server: ${SERVER_URL || '—'}\nMa’lumotlar papkasi: ${app.getPath('userData')}`,
            }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ------------------------------ Asosiy oyna ------------------------------ */

let downloadsHooked = false;

async function openMain() {
  if (!DEV_URL && !fs.existsSync(path.join(UI_DIR, 'index.html'))) {
    dialog.showErrorBox('Sam-Vision Admin', 'Admin interfeysi topilmadi. Avval "npm run ui" ni bajaring.');
    app.quit();
    return;
  }
  if (!DEV_URL && !local) local = await startLocalServer({ uiDir: UI_DIR, getServerUrl: () => SERVER_URL });
  base = DEV_URL ?? `http://127.0.0.1:${local.port}`;

  const b = settings.get().bounds ?? {};
  mainWindow = new BrowserWindow({
    width: b.width ?? 1360,
    height: b.height ?? 860,
    x: b.x,
    y: b.y,
    minWidth: 980,
    minHeight: 640,
    title: 'Sam-Vision Admin',
    icon: ICON,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  if (b.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => {
    if (!SMOKE) mainWindow.show();
  });
  // Oyna sarlavhasi doim ilova nomi bo‘lib qoladi
  mainWindow.on('page-title-updated', (event) => event.preventDefault());

  // Yangi oynalar: rasm (blob) — ilova ichida; boshqa saytlar — tizim brauzerida
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('blob:')) return { action: 'allow' };
    if (url.startsWith(base)) {
      const rest = url.slice(base.length) || '/';
      if (rest.startsWith('/admin')) mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(base)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  // Excel va boshqa fayllar: saqlash oynasi "Yuklanmalar" papkasida ochiladi
  if (!downloadsHooked) {
    downloadsHooked = true;
    mainWindow.webContents.session.on('will-download', (_e, item) => {
      item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
    });
  }

  const saveBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    settings.set({ bounds: { ...mainWindow.getNormalBounds(), maximized: mainWindow.isMaximized() } });
  };
  mainWindow.on('close', saveBounds);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  buildMenu();
  if (!updaterStarted) {
    updaterStarted = true;
    updater.init(mainWindow);
  } else {
    updater.setWindow(mainWindow);
  }

  await mainWindow.loadURL(`${base}/admin`);
}

/* ------------------------------ Oynasiz tekshiruv (smoke test) ------------------------------ */

async function smoke() {
  await openMain();
  // --smoke-login=login:parol berilsa — proksi orqali POST (login) va fayl yuklab olish ham tekshiriladi
  const login = argValue('smoke-login');
  const result = await mainWindow.webContents.executeJavaScript(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const text = () => document.querySelector('#root')?.innerText.trim() ?? '';
    for (let i = 0; i < 80 && (!text() || text().includes('Yuklanmoqda')); i++) await wait(250);
    const health = await fetch('/api/health').then((r) => r.json()).catch((e) => ({ error: String(e) }));
    const info = window.samvisionDesktop ? await window.samvisionDesktop.getInfo() : null;
    const update = window.samvisionDesktop ? await window.samvisionDesktop.checkForUpdates() : null;
    // PIN qurilma kaliti: shifrlab saqlash → o‘qish → o‘chirish (faqat test papkasida)
    let deviceToken = null;
    if (${JSON.stringify(Boolean(USER_DATA))} && window.samvisionDesktop?.deviceToken) {
      const t = 'T'.repeat(43);
      const saved = await window.samvisionDesktop.deviceToken.set(t);
      const read = await window.samvisionDesktop.deviceToken.get();
      await window.samvisionDesktop.deviceToken.clear();
      deviceToken = { saved, roundtrip: read === t, cleared: (await window.samvisionDesktop.deviceToken.get()) === null };
    }
    let auth = null;
    const creds = ${JSON.stringify(login ?? null)};
    if (creds) {
      const [username, password] = creds.split(':');
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const body = await r.json();
      const month = new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 7);
      const x = await fetch('/api/admin/sv/attendance/export?month=' + month, { headers: { Authorization: 'Bearer ' + body.token } });
      const buf = new Uint8Array(await x.arrayBuffer());
      auth = { login: r.status, export: x.status, type: x.headers.get('content-type'), bytes: buf.length, zip: buf[0] === 0x50 && buf[1] === 0x4b };
    }
    return {
      path: location.pathname,
      text: text().replace(/\\s+/g, ' ').slice(0, 120),
      bridge: typeof window.samvisionDesktop,
      info,
      update,
      deviceToken,
      health,
      auth,
    };
  })()`);
  result.windowTitle = mainWindow.getTitle();

  // --smoke-shot=fayl.png — tizimga kirgan holda davomat sahifasining skrinshoti
  const shot = argValue('smoke-shot');
  if (shot && login) {
    const [username, password] = login.split(':');
    await mainWindow.webContents.executeJavaScript(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(${JSON.stringify({ username, password })}) }).then((r) => r.json()).then((b) => localStorage.setItem('sv_admin_token', b.token))`);
    mainWindow.setSize(1440, 900);
    await mainWindow.loadURL(`${base}/admin/davomat`);
    await mainWindow.webContents.executeJavaScript(`(async () => {
      for (let i = 0; i < 80 && !document.body.innerText.includes('Kelgan kunlar'); i++) await new Promise((r) => setTimeout(r, 250));
      await window.samvisionDesktop.checkForUpdates();
      await new Promise((r) => setTimeout(r, 1500));
    })()`);
    const image = await mainWindow.webContents.capturePage();
    fs.writeFileSync(path.resolve(shot), image.toPNG());
  }
  process.stdout.write(`SMOKE_RESULT ${JSON.stringify(result)}\n`);
  app.exit(result?.health?.ok ? 0 : 1);
}

/* ------------------------------ Hayot sikli ------------------------------ */

app.whenReady().then(() => {
  if (SMOKE) {
    smoke().catch((err) => {
      process.stderr.write(`SMOKE_ERROR ${err.stack ?? err}\n`);
      app.exit(1);
    });
    return;
  }
  openMain().catch((err) => {
    dialog.showErrorBox('Sam-Vision Admin', `Ilovani ochib bo‘lmadi: ${err.message}`);
    app.quit();
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  updater.stop();
  local?.close();
  app.quit();
});
