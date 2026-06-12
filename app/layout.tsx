import AgendaPessoalNotificacoesGlobal from "@/components/AgendaPessoalNotificacoesGlobal";

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kedial Performance",
  description: "Gestão comercial para academias",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <AgendaPessoalNotificacoesGlobal />
      </body>
    </html>
  );
}