import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: "500",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-maru",
});

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: {
    default: "Mado - 半匿名メッセージ",
    template: "%s | Mado",
  },
  description:
    "ATProtocol基盤の半匿名メッセージサービス。Blueskyアカウントで声を送ろう。",
  openGraph: {
    title: "Mado - 半匿名メッセージ",
    description: "ATProtocol基盤の半匿名メッセージサービス。Blueskyアカウントで声を送ろう。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "Mado - 半匿名メッセージ",
    description: "ATProtocol基盤の半匿名メッセージサービス。Blueskyアカウントで声を送ろう。",
  },
  applicationName: "Mado",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={zenMaruGothic.variable}>
      <body className="bg-slate-950">
        {children}
      </body>
    </html>
  );
}
