import type { Metadata } from "next";
import { SemiAnonContent } from "@/components/mado/semi-anon-content";

export const metadata: Metadata = { title: "半匿名の仕組み" };

export default function DashboardSemiAnonPage() {
  return <SemiAnonContent />;
}
