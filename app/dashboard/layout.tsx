import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Inbox,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { getSession, updateSessionProfile } from "@/lib/auth";
import { getProfile } from "@/lib/atproto";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "ダッシュボード",
  },
  {
    href: "/dashboard/boxes",
    icon: MessageSquare,
    label: "質問箱",
  },
  {
    href: "/dashboard/questions",
    icon: Inbox,
    label: "受信トレイ",
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  // セッションにアバターや表示名が欠けていたら補完して保存
  if (!session.avatar || !session.displayName || session.handle.startsWith("did:")) {
    const profile = await getProfile(session.did);
    if (profile) {
      await updateSessionProfile(session.did, {
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
      });
      session.handle = profile.handle;
      session.displayName = profile.displayName;
      session.avatar = profile.avatar;
    }
  }

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 flex flex-col sticky top-0 h-dvh overflow-y-auto"
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="h-16 px-5 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <MessageCircle className="text-white" style={{ width: 16, height: 16 }} />
            </div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Mado
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3">
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
                style={{ color: "var(--text-muted)" }}
              >
                <item.icon
                  className="shrink-0 group-hover:opacity-80"
                  style={{ width: 17, height: 17 }}
                />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
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
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {session.displayName ?? session.handle}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
