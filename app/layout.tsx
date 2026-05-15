import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connectyfind",
  description: "Vernetze dich mit Gründern, Investoren und Freelancern im DACH-Raum",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "Connectyfind",
    description: "Vernetze dich mit Gründern, Investoren und Freelancern im DACH-Raum",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Connectyfind" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Connectyfind",
    description: "Vernetze dich mit Gründern, Investoren und Freelancern im DACH-Raum",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
