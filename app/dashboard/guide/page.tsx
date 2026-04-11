import type { Metadata } from "next";
import { GuideContent } from "@/components/mado/guide-content";

export const metadata: Metadata = { title: "使い方" };

export default function DashboardGuidePage() {
  return <GuideContent />;
}
