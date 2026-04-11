import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-gray-950 border-b border-gray-800">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
            style={{ background: "var(--accent)" }}
          >
            <MessageCircle
              className="text-white"
              style={{ width: 16, height: 16 }}
            />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Mado
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: "var(--accent-light)",
              color: "#a78bfa",
              border: "1px solid rgba(124, 58, 237, 0.3)",
            }}
          >
            beta
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/about">
            <Button variant="ghost" size="sm">
              Madoについて
            </Button>
          </Link>
          <Link href="/guide">
            <Button variant="ghost" size="sm">
              使い方
            </Button>
          </Link>
          <Link href="/semi-anon">
            <Button variant="ghost" size="sm">
              半匿名の仕組み
            </Button>
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-2">
          {session ? (
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                ダッシュボード
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="default" size="sm">
                ログイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
