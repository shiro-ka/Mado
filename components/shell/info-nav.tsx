"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Info, BookOpen, Eye } from "lucide-react";

const items = [
  { href: "/dashboard/about", icon: Info, label: "Madoについて" },
  { href: "/dashboard/guide", icon: BookOpen, label: "使い方" },
  { href: "/dashboard/semi-anon", icon: Eye, label: "半匿名の仕組み" },
];

interface InfoNavProps {
  onNavigate?: () => void;
}

export function InfoNav({ onNavigate }: InfoNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted"
      >
        <Info size={17} className="shrink-0" />
        <span className="flex-1 text-left">Madoについて</span>
        <ChevronDown
          size={14}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 text-subtle"
            >
              <item.icon size={15} className="shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
