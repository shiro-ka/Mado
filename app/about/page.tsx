import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AboutContent } from "@/components/mado/about-content";

export const metadata: Metadata = { title: "Madoについて" };

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        <AboutContent />
      </main>
      <Footer />
    </div>
  );
}
