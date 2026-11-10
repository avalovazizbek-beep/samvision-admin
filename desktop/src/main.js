/**
 * Sam-Vision Admin — Windows ilovasi (Electron).
 *
 *  - Admin panel interfeysi ilova ichida (ui/), ma'lumotlar esa sozlamalardagi backend serveridan olinadi.
 *  - Birinchi ochilishda server manzili so‘raladi va tekshiriladi.
 *  - Yangi versiya chiqsa, ilova ichida «Yangilash» taklif qilinadi (updater.js).
 *
 * Buyruq qatori parametrlari (ishlab chiqish uchun):
 *   --dev-url=http://localhost:5180   interfeysni Vite dev serveridan yuklash
 *   --smoke-test --server=URL         oynasiz tekshiruv: interfeys va /api proksi ishlashini tekshirib chiqadi
 *   --user-data=PAPKA                 sozlamalar papkasini almashtirish (testlar uchun)
 */
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
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

app.setAppUserModelId('uz.samvision.admin');

if (!SMOKE && !app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;
let setupWindow = null;
let local = null;
let base = null;
let updaterStarted = false;

/* ------------------------------ Server manzilini tekshirish ------------------------------ */

async function testServer(input) {
  let serverUrl;
  try {
    serverUrl = settings.normalizeUrl(input);
  } catch {
    return { ok: false, message: 'Manzil noto‘g‘ri yozilgan' };
  }
  if (!serverUrl) return { ok: false, message: 'Server manzilini kiriting' };
  try {
    const r = await fetch(`${serverUrl}/api/health`, { signal: AbortSignal.timeout(8000) });
    const body = await r.json().catch(() => null);
    if (!body || typeof body.ok !== 'boolean') {
      return { ok: false, message: `Bu manzilda Sam-Vision backend topilmadi (HTTP ${r.status})` };
    }
    if (!body.ok) return { ok: false, message: 'Server ishlayapti, lekin ma’lumotlar bazasiga ulana olmayapti' };
    return { ok: true, serverUrl };
  } catch (err) {
    return { ok: false, message: `Serverga ulanib bo‘lmadi: ${err.name === 'TimeoutError' ? 'javob kelmadi' : err.message}` };
  }
}

/* ------------------------------ Sozlash oynasi ------------------------------ */

function openSetup() {
  if (setupWindow) {
    setupWindow.focus();
    return;
  }
  setupWindow = new BrowserWindow({
    width: 580,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Sam-Vision Admin — server manzili',
    icon: ICON,
    parent: mainWindow ?? undefined,
    modal: Boolean(mainWindow),
    show: !SMOKE,
    webPreferences: {
      preload: path.join(__dirname, 'setup', 'setup-preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  setupWindow.setMenu(null);
  setupWindow.loadFile(path.join(__dirname, 'setup', 'setup.html'));
  setupWindow.on('closed', () => {
    setupWindow = null;
    if (!mainWindow && !settings.get().serverUrl) app.quit();
  });
}

ipcMain.handle('setup:load', () => settings.get());
ipcMain.handle('setup:test', (_e, url) => testServer(url));
ipcMain.handle('setup:save', async (_e, data) => {
  const t = await testServer(data?.serverUrl);
  if (!t.ok) return t;
  let publicUrl = '';
  try {
    publicUrl = data?.publicUrl ? settings.normalizeUrl(data.publicUrl) : '';
  } catch {
    publicUrl = '';
  }
  settings.set({ serverUrl: t.serverUrl, publicUrl });
  // Avval asosiy oyna ochiladi, keyin sozlash oynasi yopiladi (aks holda ilova yopilib qoladi)
  if (mainWindow) mainWindow.webContents.reload();
  else await openMain();
  setupWindow?.close();
  return { ok: true };
});
ipcMain.handle('setup:cancel', () => setupWindow?.close());

/* ------------------------------ Admin panelga ko‘prik ------------------------------ */

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  packaged: app.isPackaged,
  serverUrl: settings.get().serverUrl ?? '',
  publicUrl: settings.get().publicUrl ?? '',
}));
ipcMain.handle('app:settings', () => openSetup());
ipcMain.handle('app:open-external', (_e, url) => {
  if (/^https?:\/\//i.test(String(url))) shell.openExternal(url);
});

/* ------------------------------ Menyu ------------------------------ */

function buildMenu() {
  const template = [
    {
      label: 'Dastur',
      submenu: [
        { label: 'Server manzili…', click: () => openSetup() },
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
              detail: `Server: ${settings.get().serverUrl || '—'}\nMa’lumotlar papkasi: ${app.getPath('userData')}`,
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
  if (!settings.get().serverUrl && !DEV_URL) {
    openSetup();
    return;
  }
  if (!DEV_URL && !fs.existsSync(path.join(UI_DIR, 'index.html'))) {
    dialog.showErrorBox('Sam-Vision Admin', 'Admin interfeysi topilmadi. Avval "npm run ui" ni bajaring.');
    app.quit();
    return;
  }
  if (!DEV_URL && !local) local = await startLocalServer({ uiDir: UI_DIR, getServerUrl: () => settings.get().serverUrl });
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
      else if (settings.get().publicUrl) shell.openExternal(`${settings.get().publicUrl}${rest}`);
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
  const server = argValue('server');
  if (server) settings.set({ serverUrl: settings.normalizeUrl(server) });
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
