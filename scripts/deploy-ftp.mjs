/* eslint-disable */
/**
 * نشر الموقع على استضافة Namecheap عبر FTP
 * يستخدم: basic-ftp
 * التشغيل: node scripts/deploy-ftp.mjs
 */
import ftp from "basic-ftp";
import fs from "fs";
import path from "path";

// قراءة بيانات FTP من .env.ftp (غير مرفوع لـ git) مع قيم احتياطية
function loadEnvFtp() {
  const envPath = path.resolve(process.cwd(), ".env.ftp");
  const vars = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) vars[m[1]] = m[2];
    }
  }
  return vars;
}

const env = loadEnvFtp();
const FTP_HOST = env.FTP_HOST || "soqaqalaula.world";
const FTP_USER = env.FTP_USER || "soqaqalaula@soqaqalaula.world";
const FTP_PASS = env.FTP_PASS || "";
const FTP_PORT = Number(env.FTP_PORT || 21);

if (!FTP_PASS) {
  console.error("❌ لا توجد كلمة مرور FTP. أنشئ ملف .env.ftp (انظر .env.example)");
  process.exit(1);
}

const LOCAL_DIR = path.resolve(process.cwd(), "dist");

// SPA fallback + ضغط + تخزين مؤقت للأصول
const HTACCESS = `# React Router SPA fallback
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# ضغط الملفات
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

# تخزين مؤقت للأصول (hashed filenames)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
`;

async function main() {
  if (!fs.existsSync(path.join(LOCAL_DIR, "index.html"))) {
    console.error("❌ مجلد dist غير موجود أو فارغ. شغّل: npm run build");
    process.exit(1);
  }

  const client = new ftp.Client(60_000);
  try {
    console.log(`🔌 الاتصال بـ ${FTP_HOST}:${FTP_PORT} ...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: FTP_PORT,
      secure: false, // FTP عادي على المنفذ 21 (FTPS الصريح متاح عند الحاجة)
    });
    console.log("✅ تم الاتصال");

    // جذر FTP هو جذر الموقع مباشرة (cgi-bin + index.html الافتراضي)
    const dest = "/";
    console.log("📤 الرفع إلى الجذر ...");

    // تأكد من وجود .htaccess محلياً قبل الرفع
    const htPath = path.join(LOCAL_DIR, ".htaccess");
    if (!fs.existsSync(htPath)) fs.writeFileSync(htPath, HTACCESS);

    await client.uploadFromDir(LOCAL_DIR, dest);
    // بعض الإعدادات تتجاهل ملفات النقطة — ارفعه صراحة
    await client.uploadFrom(htPath, `${dest}.htaccess`);

    console.log(
      "✅ تم النشر بنجاح: https://soqaqalaula.world (ولجعله على alulastay.com وجّه الـ DNS إلى 67.223.118.59)"
    );
  } catch (err) {
    console.error("❌ فشل النشر:", err.message);
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

main();
