/**
 * Yangi versiyani GitHub Releases'ga chiqarish — o‘rnatilgan dasturlar «Yangi versiya mavjud» deb ko‘rsatadi
 * va «Yangilash» bosilganda o‘zi yuklab, o‘rnatib, qayta ochiladi (o‘chirib qayta o‘rnatish shart emas).
 *
 *   1. desktop/package.json → "version" ni oshiring (masalan 1.0.1 → 1.0.2)
 *   2. O‘zgarishlarni commit va push qiling
 *   3. npm run release
 *
 * GitHub tokeni: GH_TOKEN muhit o‘zgaruvchisi yoki `gh auth login` qilingan GitHub CLI (`gh auth token`).
 */
const { execSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const pkg = require('../package.json');

const ROOT = path.join(__dirname, '..');
const { owner, repo } = pkg.build.publish;
const tag = `v${pkg.version}`;

function run(cmd, args, env) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true, env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

(async () => {
  let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    try {
      token = execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      /* quyida xabar */
    }
  }
  if (!token) {
    console.error('✖ GitHub tokeni topilmadi: `gh auth login` qiling yoki GH_TOKEN bering');
    process.exit(1);
  }

  // Internet vaqtincha uzilsa — 3 marta qayta urinamiz
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'samvision-release' },
        signal: AbortSignal.timeout(30000),
      });
      break;
    } catch (err) {
      console.warn(`• GitHub'ga ulanib bo‘lmadi (${attempt}/3): ${err.cause?.code || err.name}`);
      if (attempt === 3) {
        console.error('✖ GitHub (api.github.com) bilan aloqa yo‘q. Internetni tekshirib, birozdan keyin qayta ishga tushiring');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  if (res.status === 401) {
    console.error('✖ GitHub tokeni yaroqsiz: `gh auth login` ni qayta bajaring');
    process.exit(1);
  }
  if (res.status === 200) {
    console.error(`✖ ${tag} allaqachon chiqarilgan. desktop/package.json dagi "version" ni oshiring`);
    process.exit(1);
  }

  console.log(`→ ${owner}/${repo} — ${tag} yig‘ilmoqda va chiqarilmoqda…`);
  const env = { ...process.env, GH_TOKEN: token };
  delete env.ELECTRON_RUN_AS_NODE;
  run('node', ['scripts/build-ui.js'], env);
  run('npx', ['electron-builder', '--win', 'nsis', '--publish', 'always'], env);
  console.log(`\n✔ Chiqarildi: https://github.com/${owner}/${repo}/releases/tag/${tag}`);
  console.log('  O‘rnatilgan dasturlar 30 daqiqa ichida (yoki qayta ochilganda) yangilanishni ko‘rsatadi.');
})();
