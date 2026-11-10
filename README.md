# samvision-admin

Sam-Vision ro‘yxatdan o‘tish tizimining **admin paneli**: veb ilova (React 19 + Vite 7 + Tailwind CSS 4) va undan
yig‘iladigan **«Sam-Vision Admin» Windows ilovasi** (Electron, avtomatik yangilanish bilan).

| Repo | Vazifasi |
|---|---|
| samvision-backend (yopiq) | API, MySQL, Sam-Vision integratsiyasi, davomat arxivi |
| samvision-frontend (yopiq) | Xodim va talabalar ro‘yxatdan o‘tadigan sayt |
| **samvision-admin** (shu repo) | Admin panel va Windows ilovasi |

## Imkoniyatlar

- **Ro‘yxatdan o‘tish:** boshqaruv paneli va statistika; arizalar (xodim/talaba, holat, bo‘lim, Sam-Vision filtri,
  Excel). Arizani tasdiqlash avtomatik ravishda Sam-Vision’ga yuboradi; rad etish, tahrirlash, takroriylikni hal qilish.
  Bo‘limlar (kimlar uchun: xodimlar / talabalar / ikkalasi).
- **Sam-Vision:** davomat (oy yoki sana oralig‘i, xodimlar/talabalar, bo‘lim) va **to‘liq Excel** (Umumiy, Tabel,
  Kunlar, Kirish-chiqish). Har bir odam uchun alohida Excel. Xodimlar va talabalar ro‘yxati, odam sahifasi kunlik
  kelish-ketish bilan. Qurilmalar (onlayn/oflayn). Kirish-chiqish jurnali (jonli).
- **Tizim:** integratsiya holati va tekshiruvi, audit jurnali, parolni almashtirish.

Barcha ma’lumot backend orqali keladi — admin panelda hech qanday token yoki parol saqlanmaydi.

## Veb admin panel

```bash
git clone https://github.com/avalovazizbek-beep/samvision-admin.git
cd samvision-admin
npm install
npm run dev          # http://localhost:5181/admin  (/api → http://localhost:4800)
npm run build        # dist/ — serverga joylash uchun
```

Serverda `dist/` ni Nginx bilan bering. Namuna backend repo’sida: `deploy/nginx.conf.example`. `/api/` backend’ga
yo‘naltiriladi. `.env` sozlamalari:
- `VITE_BASE_PATH` — mavjud domenga yo‘l ostida joylanganda, masalan `/samvision/`; panel `…/samvision/admin` da ochiladi;
- `VITE_API_URL` — backend boshqa domenda bo‘lsa;
- `VITE_PUBLIC_SITE_URL` — ro‘yxatdan o‘tish sayti havolasi;
- `VITE_DEV_BACKEND`.

Asosiy admin — Windows ilovasi (pastda). **Veb-versiya** (telefon yoki boshqa kompyuterdan) — Netlify'da:
https://samvision-admin.netlify.app — sozlamalar [netlify.toml](netlify.toml), yangilash: `npm run deploy`.
Backend `.env` dagi `CORS_ORIGINS` da shu manzil bo‘lishi shart. Kirish ham xuddi ilovadagidek: login + parol, so‘ng shu
brauzer uchun PIN.

## Windows ilovasi — «Sam-Vision Admin» (`desktop/`)

- Server manzili dasturga qotirilgan (`desktop/package.json` → `"samvision".serverUrl`) — hech narsa so‘ralmaydi.
- **Kirish:** birinchi marta login + parol, so‘ng shu kompyuter uchun **4 xonali PIN** o‘rnatiladi. Keyingi
  safar faqat PIN. PIN serverda tekshiriladi va kompyuterga bog‘langan (kalit Windows himoyasi bilan shifrlangan):
  5 marta xato terilsa bekor bo‘ladi va yana login + parol so‘raladi. «PIN kodni unutdingizmi?» — xuddi shunday.
- **Integratsiya** bo‘limi yopiq: administrator login va parolini qayta kiritgandan keyin 10 daqiqaga ochiladi.
- **Yangilanish:** ilova ochilganda va har 30 daqiqada GitHub Releases'ni tekshiradi. Yangisi bo‘lsa
  «Yangi versiya mavjud — **Yangilash**» chiqadi. Bosilsa yuklab olinadi, o‘zi o‘rnatiladi va dastur qayta ochiladi.
  O‘chirib qayta o‘rnatish shart emas — sozlamalar va PIN saqlanadi.

**Lokal sinash (exe yig‘masdan):**
```bash
npm install                  # repo ildizida (admin panel)
cd desktop
npm install
npm start                    # admin interfeysini yig‘adi va ilovani ochadi
npm run dev                  # interfeys Vite dev serveridan (npm run dev ildizda ishlab turishi kerak)
```

**Exe yig‘ish:** `cd desktop && npm run dist` → `desktop/dist/Sam-Vision-Admin-Setup-<versiya>.exe`

**Yangi versiya chiqarish (avtomatik yangilanish):**
```bash
# 1. desktop/package.json → "version" ni oshiring (masalan 1.0.2)
git commit -am "Admin ilovasi 1.0.2" && git push
cd desktop && npm run release      # exe yig‘iladi va GitHub Releases'ga v1.0.2 bo‘lib chiqadi
```
Token `gh auth token` dan olinadi (yoki `GH_TOKEN`). Repo ochiq bo‘lgani uchun o‘rnatilgan ilovalar relizni tokensiz
topadi va «Yangilash» ni ko‘rsatadi. GitHub Actions orqali chiqarish uchun: [desktop/ci/desktop-release.yml](desktop/ci/desktop-release.yml).

Exe yangilash faqat admin interfeysi yoki ilovaning o‘zi o‘zgarganda kerak. Backend o‘zgarishlari uchun serverda
backend’ni yangilash yetarli.

## Tuzilma

```
src/
  pages/admin/           Dashboard, Arizalar, Ariza, Bo‘limlar, Davomat, Xodimlar va talabalar, Odam,
                         Qurilmalar, Kirish-chiqish jurnali, Integratsiya, Audit, Login
  components/admin/      davr/tur filtrlari, arxiv holati, yangilanish banneri, PIN klaviatura, himoyalangan bo‘lim
  components/ui/         Button, Field, Modal, Badge, Pagination, Feedback
  lib/                   api, useApi, desktop, format, image, statuses
desktop/
  src/main.js            oyna, menyu, PIN qurilma kaliti (shifrlangan), yuklab olish
  src/localServer.js     ilova ichidagi interfeys + /api proksi (127.0.0.1)
  src/updater.js         GitHub Releases orqali yangilanish
  scripts/               build-ui.js, run.js, release.js
  ci/desktop-release.yml GitHub Actions namunasi (workflow ruxsati bo‘lsa .github/workflows/ ga ko‘chiring)
```
