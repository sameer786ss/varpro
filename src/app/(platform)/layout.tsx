import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSession();

  return (
    <AppShell
      role={profile.role}
      fullName={profile.full_name ?? profile.email ?? "Learning User"}
    >
      {children}
    </AppShell>
  );
}
