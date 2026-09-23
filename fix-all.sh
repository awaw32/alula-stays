#!/bin/bash
# 🔧 سكريبت الإصلاح الشامل — شقق العلا
# يقوم بإصلاح جميع المشاكل وتجهيز البناء

set -e

echo "🚀 بدء الإصلاح الشامل..."

# 1. حذف الملفات المؤقتة
echo "1️⃣ تنظيف الملفات المؤقتة..."
rm -rf dist node_modules .convex 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

# 2. تثبيت المكتبات
echo "2️⃣ تثبيت المكتبات..."
bun install

# 3. التحقق من الملفات الأساسية
echo "3️⃣ التحقق من الملفات..."
if [ ! -f "src/main.tsx" ]; then
  echo "❌ خطأ: src/main.tsx غير موجود"
  exit 1
fi

if [ ! -f "src/index.css" ]; then
  echo "❌ خطأ: src/index.css غير موجود"
  exit 1
fi

# 4. بناء TypeScript
echo "4️⃣ بناء TypeScript..."
bun tsc -b --force

# 5. بناء Vite
echo "5️⃣ بناء مع Vite..."
bun vite build

# 6. التحقق من النتيجة
echo "6️⃣ التحقق من النتيجة..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo "✅ البناء نجح بنجاح!"
  echo ""
  echo "📊 حجم الملفات:"
  du -sh dist
  echo ""
  echo "🎉 المشروع جاهز للنشر!"
else
  echo "❌ البناء فشل - dist/index.html غير موجود"
  exit 1
fi
