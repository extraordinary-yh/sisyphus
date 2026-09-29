import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SISYPHUS · 自律排位",
  description: "以学习赢取星光，把每一天打成一场胜仗。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
