"use client";

import Link from "next/link";
import { LayoutDashboard, MessageSquare, Inbox, Send } from "lucide-react";
import { InfoNav } from "@/components/shell/info-nav";
import { UserCard } from "./user-card";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/dashboard/boxes", icon: MessageSquare, label: "質問箱" },
  { href: "/dashboard/questions", icon: Inbox, label: "受信トレイ" },
  { href: "/dashboard/sent", icon: Send, label: "送信トレイ" },
];

interface SidebarProps {
  session: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  onNavigate?: () => void;
}

export function Sidebar({ session, onNavigate }: SidebarProps) {
  return (
    <>
      {/* ロゴ */}
      <div
        className="h-16 px-5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mado-logo.svg" alt="Mado" className="w-8 h-8" />
          <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            Mado
          </span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: "var(--text-muted)" }}
            >
              <item.icon className="shrink-0" style={{ width: 17, height: 17 }} />
              {item.label}
            </Link>
          ))}
          <InfoNav onNavigate={onNavigate} />
        </div>
      </nav>

      {/* ユーザー情報 */}
      <UserCard session={session} />
    </>
  );
}
