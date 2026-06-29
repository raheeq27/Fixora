# Fixora — منصة ربط العملاء بالحرفيين

Fixora منصة أردنية تجمع **العملاء** الذين يحتاجون خدمات منزلية مع **الحرفيين** الموثوقين في مكان واحد: بحث، حجز، متابعة الطلبات، وتقييم.

## التشغيل

```bash
npm install
# أنشئ قاعدة البيانات وشغّل:
# psql -U postgres -d fixora_db -f fixora_db.sql
# psql -U postgres -d fixora_db -f fixora_seed.sql
cp .env.example .env   # ثم عدّل القيم
node app.js
```

افتح الواجهة من:

**http://localhost:3000**

| الصفحة | الرابط |
|--------|--------|
| الرئيسية | `/index.html` |
| البحث | `/search.html` |
| التسجيل | `/register.html` |
| الدخول | `/login.html` |
| بروفايل فني | `/privider.html?id=<uuid>` |
| حجز | `/booking.html?id=<provider_uuid>` |

## الأدوار

- **client** — يبحث عن فني، يحجز، يقيّم → `/client/dashboard` (=`user-dashboard.html`)
- **provider** — يستقبل الطلبات من لوحة الفني → `/provider/dashboard`
- **admin** — إدارة → `/admin/panel`

فصل الصلاحيات: كل صفحة وواجهة API محمية حسب الدور. التفاصيل في [`docs/ROLE_ACCESS.md`](docs/ROLE_ACCESS.md).

## API رئيسية

| Method | Path | الوصف |
|--------|------|--------|
| POST | `/api/auth/register` | تسجيل |
| POST | `/api/auth/login` | دخول (بريد أو هاتف) |
| GET | `/api/providers` | بحث الفنيين |
| GET | `/api/providers/:id` | بروفايل فني + تقييمات |
| GET | `/api/categories` | أنواع الخدمات |
| POST | `/api/bookings` | إنشاء حجز (يتطلب token) |
| GET | `/api/bookings/my-bookings` | حجوزاتي |
| PATCH | `/api/bookings/:id/status` | قبول/رفض (فني) |

## هيكل المشروع

- `app.js` — السيرفر + الواجهة الثابتة + Socket.io
- `controllers/` — منطق الأعمال
- `routes/` — مسارات API
- `files (2)/` — HTML/CSS/JS (بدون بيانات وهمية — كلها من API عبر `js/fxr-api.js`)

## ملاحظات

- لا تفتح الملفات بـ `file://` — استخدم `http://localhost:3000`
- JWT_SECRET في `.env` إلزامي للإنتاج
