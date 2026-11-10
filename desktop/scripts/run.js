/**
 * Electron'ni lokal ishga tushirish.
 * VS Code ichidagi ba'zi jarayonlarda ELECTRON_RUN_AS_NODE=1 o‘rnatilgan bo‘ladi — u Electron'ni
 * oddiy Node rejimiga o‘tkazib qo‘yadi. Shu sababli bola jarayon muhitidan uni olib tashlaymiz.
 *
 *   node scripts/run.js [--dev-url=http://localhost:5180] [--smoke-test --server=http://localhost:4800]
 */
const path = require('node:path');
const { spawn } = require('node:child_process');

const electronBinary = require('electron'); // Node'dan chaqirilganda Electron binar fayl yo‘lini qaytaradi
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ['.', ...process.argv.slice(2)], {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: 'inherit',
  windowsHide: false,
});
child.on('exit', (code) => process.exit(code ?? 0));
