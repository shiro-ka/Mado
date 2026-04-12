import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-gray-950 border-b border-gray-800">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mado-logo.svg" alt="Mado" className="w-8 h-8" />
          <span className="font-bold text-lg text-primary">Mado</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-accent-light text-violet-400 border border-violet-600/30">
            beta
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/about">
            <Button variant="ghost" size="sm">Madoについて</Button>
          </Link>
          <Link href="/guide">
            <Button variant="ghost" size="sm">使い方</Button>
          </Link>
          <Link href="/semi-anon">
            <Button variant="ghost" size="sm">半匿名の仕組み</Button>
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-2">
          {session ? (
            <Link href="/dashboard">
              <Button variant="default" size="sm">ダッシュボード</Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="default" size="sm">ログイン</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
