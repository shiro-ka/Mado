import type { Metadata } from "next";
import { AboutContent } from "@/components/mado/about-content";

export const metadata: Metadata = { title: "Madoについて" };

export default function DashboardAboutPage() {
  return <AboutContent />;
}
