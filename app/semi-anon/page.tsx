import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SemiAnonContent } from "@/components/mado/semi-anon-content";

export const metadata: Metadata = { title: "半匿名の仕組み" };

export default function SemiAnonPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        <SemiAnonContent />
      </main>
      <Footer />
    </div>
  );
}
