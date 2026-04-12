import type { Metadata } from "next";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { GuideContent } from "@/components/mado/guide-content";

export const metadata: Metadata = { title: "使い方" };

export default function GuidePage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        <GuideContent />
      </main>
      <Footer />
    </div>
  );
}
