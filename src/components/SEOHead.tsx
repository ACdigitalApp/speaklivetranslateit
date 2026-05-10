import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  /** Override robots; if omitted, auto-detect preview/dev → noindex */
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: JsonLd[];
  /** Force noindex regardless of host (e.g. private pages) */
  noindex?: boolean;
}

const DEFAULTS = {
  title: "Speak & Translate Live — Traduttore vocale AI in tempo reale",
  description:
    "Speak & Translate Live è l'app AC Digital App per tradurre voce e testo in tempo reale, utile per viaggi, lavoro, studio e conversazioni multilingua.",
  canonical: "https://speaklivetranslate.it/",
  ogTitle: "Speak & Translate Live — Traduttore vocale AI",
  ogDescription:
    "Traduci voce e testo in tempo reale con Speak & Translate Live, app AC Digital App per conversazioni multilingua.",
  ogUrl: "https://speaklivetranslate.it/",
  ogImage: "https://speaklivetranslate.it/og-image.png",
  twitterTitle: "Speak & Translate Live — Traduttore vocale AI",
  twitterDescription: "App AC Digital App per traduzione vocale e testuale in tempo reale.",
  twitterImage: "https://speaklivetranslate.it/og-image.png",
};

const PREVIEW_HOST_PATTERNS = ["lovable.app", "lovableproject.com", "localhost", "preview"];

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname.toLowerCase();
  return PREVIEW_HOST_PATTERNS.some((p) => h.includes(p));
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSONLD_ID_PREFIX = "seo-jsonld-";

export default function SEOHead(props: SEOHeadProps) {
  useEffect(() => {
    const v = { ...DEFAULTS, ...props } as Required<SEOHeadProps> & SEOHeadProps;
    document.title = props.title ?? DEFAULTS.title;

    const robots = props.robots
      ? props.robots
      : props.noindex || isPreviewHost()
      ? "noindex,nofollow"
      : "index,follow";

    setMeta("name", "description", v.description);
    setMeta("name", "robots", robots);
    setLink("canonical", v.canonical);

    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "Speak & Translate Live");
    setMeta("property", "og:title", v.ogTitle);
    setMeta("property", "og:description", v.ogDescription);
    setMeta("property", "og:url", v.ogUrl);
    setMeta("property", "og:image", v.ogImage);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", v.twitterTitle);
    setMeta("name", "twitter:description", v.twitterDescription);
    setMeta("name", "twitter:image", v.twitterImage);

    // JSON-LD
    document
      .querySelectorAll(`script[id^="${JSONLD_ID_PREFIX}"]`)
      .forEach((s) => s.remove());
    (props.jsonLd ?? []).forEach((data, i) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = `${JSONLD_ID_PREFIX}${i}`;
      s.text = JSON.stringify(data);
      document.head.appendChild(s);
    });
  }, [props]);

  return null;
}
