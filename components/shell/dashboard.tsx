"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./dashboard/sidebar";

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

  return (
    <div className="flex min-h-dvh">
      {/* デスクトップ: サイドバー */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-dvh bg-gray-950 border-r border-gray-800 overflow-y-auto">
        <Sidebar session={session} />
      </aside>

      {/* モバイル: トップバー */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3 bg-surface border-b border-border">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-muted"
          aria-label="メニューを開く"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mado-logo.svg" alt="Mado" className="w-7 h-7" />
          <span className="font-bold text-sm text-primary">Mado</span>
        </Link>
      </div>

      {/* モバイル: ドロワー */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="relative w-72 flex flex-col h-full bg-surface border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted"
              aria-label="メニューを閉じる"
            >
              <X size={18} />
            </button>
            <Sidebar session={session} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto md:mt-0 mt-14">
        {children}
      </main>
    </div>
  );
}
