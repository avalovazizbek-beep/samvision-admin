/**
 * Yangi versiyani GitHub Releases'ga chiqarish — o‘rnatilgan dasturlar «Yangi versiya mavjud» deb ko‘rsatadi
 * va «Yangilash» bosilganda o‘zi yuklab, o‘rnatib, qayta ochiladi (o‘chirib qayta o‘rnatish shart emas).
 *
 *   1. desktop/package.json → "version" ni oshiring (masalan 1.0.2 → 1.0.3)
 *   2. O‘zgarishlarni commit va push qiling
 *   3. npm run release  [-- --notes "Nima o‘zgardi"]
 *
 * Kerak: GitHub CLI (`gh auth login` qilingan). Tartib: exe yig‘iladi → tekshiriladi →
 * reliz uchala fayl (exe, blockmap, latest.yml) bilan BIR yo‘la yaratiladi — chala reliz qolmaydi.
 */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const { owner, repo } = pkg.build.publish;
const REPO = `${owner}/${repo}`;
const version = pkg.version;
const tag = `v${version}`;
const notesArg = process.argv.indexOf('--notes');
const notes = notesArg > -1 ? process.argv[notesArg + 1] : `Sam-Vision Admin ${version}`;

const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};
const gh = (args, opts = {}) => execFileSync('gh', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function run(cmd, args) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true, env });
  if (r.status !== 0) fail(`${cmd} ${args.join(' ')} — xato bilan tugadi`);
}

// 1. GitHub CLI va ruxsat
// (`gh auth status` boshqa, eskirgan akkaunt bo‘lsa ham xato qaytaradi — faol akkaunt tokenini tekshiramiz)
try {
  if (!gh(['auth', 'token'])) throw new Error('token yo‘q');
} catch {
  fail('GitHub CLI kirmagan: `gh auth login` ni bajaring');
}

// 2. Shu versiya allaqachon chiqarilganmi (internet uzilsa — 3 marta urinamiz)
for (let attempt = 1; ; attempt++) {
  try {
    gh(['release', 'view', tag, '--repo', REPO, '--json', 'tagName']);
    fail(`${tag} allaqachon chiqarilgan. desktop/package.json dagi "version" ni oshiring`);
  } catch (err) {
    const msg = String(err.stderr ?? err.message);
    if (/release not found/i.test(msg)) break;
    if (attempt >= 3) fail(`GitHub bilan aloqa yo‘q: ${msg.split('\n')[0]}`);
    console.warn(`• GitHub'ga ulanib bo‘lmadi (${attempt}/3), qayta urinilmoqda…`);
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},5000)']);
  }
}

// 3. Kod GitHub'ga push qilinganmi (reliz tegi shu commit'ga qo‘yiladi)
const head = git(['rev-parse', 'HEAD']);
try {
  git(['fetch', '--quiet', 'origin']);
} catch {
  /* tekshiruv quyida */
}
const remoteHead = git(['rev-parse', 'origin/main']);
if (head !== remoteHead) fail('Avval o‘zgarishlarni commit va push qiling (git push)');

// 4. Yig‘ish (GitHub'ga hali hech narsa yuklanmaydi)
console.log(`→ ${REPO} — ${tag} yig‘ilmoqda…`);
run('node', ['scripts/build-ui.js']);
run('npx', ['electron-builder', '--win', 'nsis', '--publish', 'never']);

const exe = `Sam-Vision-Admin-Setup-${version}.exe`;
const files = [exe, `${exe}.blockmap`, 'latest.yml'].map((f) => path.join(DIST, f));
for (const f of files) if (!fs.existsSync(f)) fail(`Topilmadi: ${f}`);
if (!fs.readFileSync(path.join(DIST, 'latest.yml'), 'utf8').includes(`version: ${version}`)) fail('latest.yml boshqa versiyaga tegishli');

// 5. Reliz — uchala fayl bilan birga
console.log(`→ GitHub'ga yuklanmoqda (${tag})…`);
const r = spawnSync('gh', ['release', 'create', tag, ...files, '--repo', REPO, '--target', head, '--title', `Sam-Vision Admin ${version}`, '--notes', notes], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (r.status !== 0) fail('Relizni yaratib bo‘lmadi');

console.log(`\n✔ Chiqarildi: https://github.com/${REPO}/releases/tag/${tag}`);
console.log('  O‘rnatilgan dasturlar ochilganda (yoki 30 daqiqa ichida) «Yangi versiya mavjud — Yangilash» ni ko‘rsatadi.');
