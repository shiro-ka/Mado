import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: {
    default: "Mado (窓) - 半匿名質問箱",
    template: "%s | Mado",
  },
  description:
    "ATProtocol基盤の半匿名質問箱。送り主はあなただけに届きます。Blueskyアカウントで質問を送ろう。",
  openGraph: {
    title: "Mado (窓) - 半匿名質問箱",
    description: "ATProtocol基盤の半匿名質問箱。送り主はあなただけに届きます。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "Mado (窓) - 半匿名質問箱",
    description: "ATProtocol基盤の半匿名質問箱。送り主はあなただけに届きます。",
  },
  applicationName: "Mado",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mado",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
