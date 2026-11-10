/**
 * Ilova ichidagi kichik HTTP server (faqat 127.0.0.1):
 *  - admin interfeysining yig‘ilgan fayllarini (ui/) beradi, SPA marshrutlari index.html ga tushadi;
 *  - /api/* so‘rovlarini sozlamalardagi backend serveriga uzatadi (proksi).
 * Shu tufayli frontend kodi o‘zgarmaydi (u /api ga murojaat qiladi) va CORS muammosi bo‘lmaydi.
 */
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, body) {
  if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function proxy(req, res, serverUrl) {
  if (!serverUrl) return sendJson(res, 503, { message: 'Server manzili sozlanmagan', code: 'DESKTOP_NO_SERVER' });
  let target;
  try {
    target = new URL(req.url, `${serverUrl}/`);
  } catch {
    return sendJson(res, 500, { message: 'Server manzili noto‘g‘ri', code: 'DESKTOP_BAD_SERVER' });
  }
  const headers = { ...req.headers, host: target.host };
  // Mahalliy manba sarlavhalarini serverga yubormaymiz
  delete headers.origin;
  delete headers.referer;
  const mod = target.protocol === 'https:' ? https : http;
  const upstream = mod.request(target, { method: req.method, headers, timeout: 180000 }, (up) => {
    res.writeHead(up.statusCode ?? 502, up.headers);
    up.pipe(res);
  });
  upstream.on('timeout', () => upstream.destroy(new Error('server javob bermadi')));
  upstream.on('error', (err) => {
    sendJson(res, 502, { message: `Serverga ulanib bo‘lmadi (${serverUrl}): ${err.message}`, code: 'DESKTOP_PROXY' });
  });
  req.pipe(upstream);
  return undefined;
}

function serveStatic(req, res, uiDir) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  let file = path.resolve(uiDir, `.${urlPath}`);
  if (!file.startsWith(path.resolve(uiDir))) return sendJson(res, 403, { message: 'Taqiqlangan' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // Fayl kengaytmasi bo‘lmagan yo‘llar — SPA marshruti
    if (path.extname(urlPath)) return sendJson(res, 404, { message: 'Topilmadi' });
    file = path.join(uiDir, 'index.html');
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(file).pipe(res);
  return undefined;
}

/** @returns {Promise<{ port: number, close: () => void }>} */
function startLocalServer({ uiDir, getServerUrl }) {
  const server = http.createServer((req, res) => {
    try {
      if (req.url.startsWith('/api/') || req.url === '/api') return proxy(req, res, getServerUrl());
      if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { message: 'Ruxsat etilmagan' });
      return serveStatic(req, res, uiDir);
    } catch (err) {
      return sendJson(res, 500, { message: err.message });
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, close: () => server.close() }));
  });
}

module.exports = { startLocalServer };
