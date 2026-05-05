import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Platform",
  description: "Vernetze dich mit Gründern, Investoren und Freelancern im DACH-Raum",
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
