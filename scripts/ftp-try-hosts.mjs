/* eslint-disable */
/** تجربة الاتصال FTP بعدة مضيفين مرشحين لمعرفة السيرفر الصحيح */
import ftp from "basic-ftp";

const candidates = [
  "soqaqalaula.world",
  "67.223.118.59",
  "www.alulastay.com",
  "alulastay.com",
];

for (const host of candidates) {
  const client = new ftp.Client(20_000);
  try {
    await client.access({
      host,
      user: "soqaqalaula@soqaqalaula.world",
      password: "soqaqalaulasoqaqalaula",
      port: 21,
      secure: false,
    });
    console.log(`✅ ${host}: نجح تسجيل الدخول!`);
    const root = await client.list("/");
    console.log(
      `   الجذر (${root.length}): ` +
        root
          .slice(0, 15)
          .map((e) => `${e.isDirectory ? "📁" : "📄"}${e.name}`)
          .join(" | ")
    );
    // البحث عن public_html في الجذر وفي مجلدات المستخدم المحتملة
    const lookIn = ["/", "/soqaqalaula.world", "/soqaqalaula.world/public_html", "/public_html", "/www.alulastay.com", "/alulastay.com"];
    for (const dir of lookIn) {
      try {
        const sub = await client.list(dir);
        console.log(`   ${dir} (${sub.length}): ${sub.slice(0, 10).map((e) => e.name).join(", ")}`);
      } catch {
        /* غير موجود */
      }
    }
  } catch (err) {
    console.log(`❌ ${host}: ${err.message}`);
  } finally {
    client.close();
  }
}
