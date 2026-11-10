/**
 * Admin panel interfeysini (shu repo ildizidagi Vite ilovasi) yig‘ib, desktop/ui ga joylaydi.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const adminRoot = path.resolve(__dirname, '..', '..');
const out = path.join(adminRoot, 'desktop', 'ui');

if (!fs.existsSync(path.join(adminRoot, 'node_modules'))) {
  console.log('[ui] admin panel bog‘liqliklari o‘rnatilmoqda…');
  execSync('npm install --no-audit --no-fund', { cwd: adminRoot, stdio: 'inherit', shell: true });
}

console.log('[ui] admin interfeysi yig‘ilmoqda…');
execSync(`npx vite build --outDir "${out}" --emptyOutDir`, { cwd: adminRoot, stdio: 'inherit', shell: true });
console.log(`[ui] tayyor: ${out}`);
