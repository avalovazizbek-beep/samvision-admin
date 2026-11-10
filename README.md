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

Ro‘yxatdan o‘tish sayti bilan bitta yo‘l ostida joylash uchun backend repo’sidagi `deploy/publish-web.sh`
skriptidan foydalaning. Admin fayllari `admin-assets/` papkasiga yig‘iladi, shuning uchun saytlar bir-biriga
to‘qnashmaydi.

## Windows ilovasi — «Sam-Vision Admin» (`desktop/`)

- Birinchi ochilishda **server manzili** so‘raladi va tekshiriladi. Masalan `https://tyutorkpi.sies.uz/samvision`
  (yo‘l ostida joylanganda), `https://admin.example.uz` yoki `http://192.168.1.10:4800` (backend’ning o‘zi).
  Ilova `<manzil>/api/...` ga murojaat qiladi.
- Ilova ochilganda va har 30 daqiqada yangi versiyani tekshiradi. Yangisi bo‘lsa, «**Yangilash**» →
  «**Qayta ishga tushirish**» chiqadi. Qayta o‘rnatish shart emas, sozlamalar saqlanadi.

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
# desktop/package.json → "version": "1.0.1"
git commit -am "Admin ilovasi 1.0.1"
git tag v1.0.1
git push && git push --tags
```
GitHub Actions ([.github/workflows/desktop-release.yml](.github/workflows/desktop-release.yml)) exe’ni yig‘adi va
**Releases** bo‘limiga qo‘yadi. O‘rnatilgan ilovalarda «Yangilash» chiqadi. Repo ochiq bo‘lgani uchun ilovalar
relizni tokensiz topadi.

Exe yangilash faqat admin interfeysi yoki ilovaning o‘zi o‘zgarganda kerak. Backend o‘zgarishlari uchun serverda
backend’ni yangilash yetarli.

## Tuzilma

```
src/
  pages/admin/           Dashboard, Arizalar, Ariza, Bo‘limlar, Davomat, Xodimlar va talabalar, Odam,
                         Qurilmalar, Kirish-chiqish jurnali, Integratsiya, Audit, Login
  components/admin/      davr/tur filtrlari, arxiv holati, yangilanish banneri
  components/ui/         Button, Field, Modal, Badge, Pagination, Feedback
  lib/                   api, useApi, desktop, format, image, statuses
desktop/
  src/main.js            oyna, menyu, sozlash, yuklab olish
  src/localServer.js     ilova ichidagi interfeys + /api proksi (127.0.0.1)
  src/updater.js         GitHub Releases orqali yangilanish
  src/setup/             server manzili oynasi
  scripts/               build-ui.js, run.js
.github/workflows/desktop-release.yml
```
