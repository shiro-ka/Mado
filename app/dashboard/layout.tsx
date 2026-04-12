import { redirect } from "next/navigation";
import { getSession, updateSessionProfile } from "@/lib/auth";
import { getProfile } from "@/lib/atproto";
import { DashboardShell } from "@/components/shell/dashboard";

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
    <DashboardShell session={session}>
      {children}
    </DashboardShell>
  );
}
