"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Inbox,
  Send,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { InfoNav } from "@/components/layout/info-nav";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/dashboard/boxes", icon: MessageSquare, label: "質問箱" },
  { href: "/dashboard/questions", icon: Inbox, label: "受信トレイ" },
  { href: "/dashboard/sent", icon: Send, label: "送信トレイ" },
];

interface Props {
  children: React.ReactNode;
  session: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
}

export function DashboardShell({ children, session }: Props) {
  const [open, setOpen] = React.useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="h-16 px-5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mado-logo.svg" alt="Mado" className="w-8 h-8" />
          <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            Mado
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: "var(--text-muted)" }}
            >
              <item.icon className="shrink-0" style={{ width: 17, height: 17 }} />
              {item.label}
            </Link>
          ))}
          <InfoNav onNavigate={() => setOpen(false)} />
        </div>
      </nav>

      {/* User info */}
      <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          {session.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.avatar}
              alt={session.handle}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {session.handle[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session.displayName ?? session.handle}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              @{session.handle}
            </p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer"
            style={{ color: "var(--text-subtle)" }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
            ログアウト
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-dvh overflow-y-auto"
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile: top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: "var(--text-muted)" }}
          aria-label="メニューを開く"
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mado-logo.svg" alt="Mado" className="w-7 h-7" />
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Mado
          </span>
        </Link>
      </div>

      {/* Mobile: drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          {/* backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          {/* drawer */}
          <aside
            className="relative w-72 flex flex-col h-full"
            style={{
              background: "var(--bg-surface)",
              borderRight: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg"
              style={{ color: "var(--text-muted)" }}
              aria-label="メニューを閉じる"
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:mt-0 mt-14">
        {children}
      </main>
    </div>
  );
}
