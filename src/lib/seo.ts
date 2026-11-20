import { useEffect, useMemo } from "react";

const SITE_URL = "https://alulahome.com";
const DEFAULT_IMAGE = `${SITE_URL}/logo-icon.png`;
const DEFAULT_OG = "شقق العلا | منصة حجز الشقق والإقامات الفاخرة في العلا";

export interface SeoConfig {
  title: string;
  description?: string;
  /** مسار داخل الموقع بدون النطاق، مثل "/apartment/abc" */
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  /** يمنع تعديل الـ canonical للصفحات المقيدة من الفهرسة */
  noIndex?: boolean;
  /** بيانات JSON-LD إضافية تُضاف إلى الـ graph */
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(
  selector: string,
  attr: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(data: Record<string, unknown>) {
  const existing = document.getElementById("seo-jsonld");
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "seo-jsonld";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    ...data,
  });
  document.head.appendChild(script);
}

/**
 * إدارة عنوان الصفحة والوصف والـ canonical والوسوم الاجتماعية لكل مسار.
 *
 * كانت كل الصفحات ترث من index.html ثابتاً — أي أن جميع صفحات الشقق
 * كانت تُعلن نفسها نسخاً مكررة من الصفحة الرئيسية، وهو ما يمنع
 * فهرستها في محركات البحث.
 */
export function useSeo(config: SeoConfig) {
  const {
    title,
    description,
    path,
    image = DEFAULT_IMAGE,
    type = "website",
    noIndex = false,
    jsonLd,
  } = config;

  // تسلسل JSON-LD مرة واحدة حتى لا يُعاد تشغيل التأثير في كل رسم
  const jsonLdKey = useMemo(() => (jsonLd ? JSON.stringify(jsonLd) : ""), [jsonLd]);

  useEffect(() => {
    const url = path ? `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}` : SITE_URL;
    const fullTitle = path ? `${title} | شقق العلا` : title;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', "name", "description", description || DEFAULT_OG);
    upsertLink("canonical", url);

    upsertMeta('meta[name="robots"]', "name", "robots",
      noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description || DEFAULT_OG);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", "شقق العلا");
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", "ar_SA");

    // Twitter / X
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description || DEFAULT_OG);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

    if (jsonLdKey) {
      try {
        upsertJsonLd(JSON.parse(jsonLdKey));
      } catch {
        document.getElementById("seo-jsonld")?.remove();
      }
    } else {
      document.getElementById("seo-jsonld")?.remove();
    }
  }, [title, description, path, image, type, noIndex, jsonLdKey]);
}

export { SITE_URL };
