"use client";

import { useEffect } from "react";

interface IubendaEmbedProps {
  url: string;
  title: string;
  loadingText?: string;
}

export default function IubendaEmbed({ url, title, loadingText = "Inhalt wird geladen…" }: IubendaEmbedProps) {
  useEffect(() => {
    if (document.querySelector('script[src*="cdn.iubenda.com/iubenda.js"]')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._iub?.parsePolicies?.();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.iubenda.com/iubenda.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="iubenda-content">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href={url}
        className="iubenda-nostyle iubenda-noiframe iubenda-embed"
        title={title}
      >
        {loadingText}
      </a>
    </div>
  );
}
