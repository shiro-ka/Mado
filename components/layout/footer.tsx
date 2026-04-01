import Link from "next/link";
import { MessageCircle, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="w-full mt-auto"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-surface)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--accent)" }}
              >
                <MessageCircle
                  className="text-white"
                  style={{ width: 16, height: 16 }}
                />
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                Mado
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              ATProtocol基盤の半匿名質問箱。
              <br />
              窓越しに、想いを届けよう。
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              リンク
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { href: "/", label: "ホーム" },
                { href: "/auth/login", label: "ログイン" },
                { href: "/dashboard", label: "ダッシュボード" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors duration-200 hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal / Info */}
          <div className="flex flex-col gap-3">
            <h4
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              情報
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { href: "/privacy", label: "プライバシーポリシー" },
                { href: "/terms", label: "利用規約" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors duration-200 hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://atproto.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                <Globe style={{ width: 12, height: 12 }} />
                ATProtocol
              </a>
            </div>
          </div>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
            &copy; {new Date().getFullYear()} Mado. All rights reserved.
          </p>
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-subtle)" }}
          >
            <Globe style={{ width: 12, height: 12, opacity: 0.6 }} />
            <span>Powered by ATProtocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
