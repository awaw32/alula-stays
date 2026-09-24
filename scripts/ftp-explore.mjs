/* eslint-disable */
/** فحص سريع للاتصال واستكشاف مجلدات السيرفر */
import ftp from "basic-ftp";

const client = new ftp.Client(30_000);
try {
  await client.access({
    host: "ftp.alulastay.com",
    user: "soqaqalaula@soqaqalaula.world",
    password: "soqaqalaulasoqaqalaula",
    port: 21,
    secure: false,
  });
  console.log("✅ تم الاتصال");
  const root = await client.list("/");
  console.log("الجذر:", root.map((e) => `${e.isDirectory ? "📁" : "📄"} ${e.name}`).join(" | "));
  for (const dir of root.filter((e) => e.isDirectory).map((e) => e.name)) {
    try {
      const sub = await client.list("/" + dir);
      const summary = sub
        .slice(0, 12)
        .map((e) => e.name)
        .join(", ");
      console.log(`  ${dir}/ (${sub.length} عنصر): ${summary}${sub.length > 12 ? " ..." : ""}`);
    } catch (e) {
      console.log(`  ${dir}/: غير متاح (${e.message})`);
    }
  }
} catch (err) {
  console.error("❌", err.message);
  process.exitCode = 1;
} finally {
  client.close();
}
