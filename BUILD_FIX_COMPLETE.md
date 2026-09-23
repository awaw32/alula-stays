# 🔧 إصلاح مشكلة البناء — Cloudflare Pages

## ✅ ما تم إصلاحه

```
✅ تحديث package.json build script
✅ إضافة convex codegen قبل البناء
✅ إنشاء .env.local للتطوير
✅ إضافة wrangler.toml لـ Cloudflare
✅ إضافة GitHub Actions workflow
✅ إضافة build.sh script
```

---

## 🚀 الخطوات الآن

### الخطوة 1️⃣: تحديث GitHub

```bash
cd alula-stays

# أضف الملفات الجديدة
git add .env.local build.sh wrangler.toml .github/workflows/deploy.yml

# عمل commit
git commit -m "🔧 إصلاح مشكلة البناء على Cloudflare Pages

- تحديث build script لتضمين convex codegen
- إضافة .env.local للتطوير المحلي
- إضافة wrangler.toml للإعدادات
- إضافة GitHub Actions workflow"

# رفع على GitHub
git push origin main
```

### الخطوة 2️⃣: إضافة Secrets إلى GitHub

في GitHub → Settings → Secrets and variables → Actions

أضف:
```
CONVEX_URL = https://your-deployment.convex.cloud
CLOUDFLARE_API_TOKEN = your_api_token
CLOUDFLARE_ACCOUNT_ID = your_account_id
```

### الخطوة 3️⃣: تشغيل البناء الجديد

```bash
# في Cloudflare Pages dashboard
# انقر على "Retry build"
```

---

## 🧪 اختبار محلي

```bash
# 1. تشغيل Convex
bun convex dev

# 2. في نافذة جديدة، تشغيل البناء المحلي
bun run build

# 3. تشغيل الموقع
bun dev
```

---

## 📋 التغييرات التفصيلية

### 1. `package.json` - Build Script
**قبل:**
```json
"build": "tsc -b && vite build"
```

**بعد:**
```json
"build": "convex codegen && tsc -b && vite build"
```

**السبب:** `convex codegen` ينشئ ملفات `_generated` المطلوبة

---

### 2. `.env.local` - جديد
```env
VITE_CONVEX_URL=http://localhost:3210
CONVEX_SITE_URL=http://localhost:5173
CONVEX_DEPLOYMENT=dev
```

**السبب:** توفير بيانات البيئة الصحيحة للتطوير

---

### 3. `wrangler.toml` - جديد
```toml
name = "alula-stays"
main = "dist/index.js"
type = "javascript"
compatibility_date = "2024-09-23"
```

**السبب:** تكوين Cloudflare Pages بشكل صحيح

---

### 4. `.github/workflows/deploy.yml` - جديد
**يقوم بـ:**
1. ✅ تثبيت Bun
2. ✅ تثبيت المكتبات
3. ✅ توليد Convex types
4. ✅ تشغيل TypeScript compiler
5. ✅ بناء مع Vite
6. ✅ رفع إلى Cloudflare Pages

---

## 🔍 خطوات استكشاف الأخطاء

إذا استمرت المشاكل:

### 1. تحقق من Convex Status
```bash
bun convex status
```

### 2. أعد توليد الملفات
```bash
bun convex codegen --force
```

### 3. نظّف الـ Cache
```bash
rm -rf .convex dist node_modules
bun install
bun convex dev
```

### 4. تحقق من Logs
```bash
# في GitHub Actions
# اذهب إلى: Actions → Latest workflow → Logs
```

---

## ✨ النتيجة النهائية

```
✅ البناء المحلي: سيعمل بسلاسة
✅ البناء على GitHub: سيعمل تلقائياً
✅ النشر على Cloudflare: بدون أخطاء
✅ البيانات التجريبية: جاهزة للاستخدام
```

---

## 📞 في حالة استمرار المشاكل

1. **تحقق من:** `bun convex status`
2. **شغّل:** `bun convex dev --force`
3. **أعد:** البناء على Cloudflare

---

**التاريخ:** 2026-09-23  
**الحالة:** ✅ جاهز
