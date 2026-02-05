import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import type React from "react";
import { Toaster } from "sonner";
import { DesktopNavigation, MobileNavigation } from "@/components/navigation";
import "./globals.css";

import {
  IBM_Plex_Mono as V0_Font_IBM_Plex_Mono,
  Lora as V0_Font_Lora,
  Plus_Jakarta_Sans as V0_Font_Plus_Jakarta_Sans,
} from "next/font/google";

// Initialize fonts
const _plusJakartaSans = V0_Font_Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});
const _ibmPlexMono = V0_Font_IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});
const _lora = V0_Font_Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "記事コレクション - 技術記事管理アプリ",
  description:
    "お気に入りの技術記事を収集・整理して、効率的に学習を進めましょう",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`font-sans antialiased`}>
        <DesktopNavigation />
        <MobileNavigation />
        <main className="md:ml-64 min-h-screen pb-16 md:pb-0 pt-16 md:pt-0">
          {children}
        </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
