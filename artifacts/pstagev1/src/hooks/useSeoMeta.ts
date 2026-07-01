import { useEffect } from "react";

interface SeoMeta {
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = "PSTAGEV1 — Réservation beauté au Maroc";
const DEFAULT_DESC  = "Trouvez et réservez en ligne les meilleurs salons de coiffure, barbiers et instituts de beauté au Maroc.";

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOgTag(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeoMeta({ title, description }: SeoMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} — PSTAGEV1` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESC;

    document.title = fullTitle;
    setMetaTag("description", desc);
    setOgTag("og:title", fullTitle);
    setOgTag("og:description", desc);
    setOgTag("og:type", "website");

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag("description", DEFAULT_DESC);
    };
  }, [title, description]);
}
