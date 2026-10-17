import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { useLang } from "@/i18n";

let siteUrlCache = null;

export default function Seo({ title, description, path, jsonLd = null }) {
  const [siteUrl, setSiteUrl] = useState(siteUrlCache);
  const { lang } = useLang();

  useEffect(() => {
    if (siteUrlCache !== null) return;
    api
      .get("/settings")
      .then((r) => {
        siteUrlCache = r.data.site_url || "";
        setSiteUrl(siteUrlCache);
      })
      .catch(() => {
        siteUrlCache = "";
      });
  }, []);

  const canon = siteUrl ? `${siteUrl}${path}` : null;

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canon && <link rel="canonical" href={canon} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canon && <meta property="og:url" content={canon} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}