import { LogOut } from "lucide-react";

interface UserCardProps {
  session: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
}

export function UserCard({ session }: UserCardProps) {
  return (
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
  );
}
