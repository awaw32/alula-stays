#!/bin/bash
# Build script لـ Cloudflare Pages
# يقوم بتهيئة Convex قبل البناء

set -e

echo "📦 بدء البناء على Cloudflare Pages..."

# 1. Install dependencies
echo "1️⃣ تثبيت المكتبات..."
bun install

# 2. Generate Convex types
echo "2️⃣ توليد ملفات Convex..."
bun convex codegen

# 3. Build the project
echo "3️⃣ بناء المشروع..."
bun run build

echo "✅ تم البناء بنجاح!"
