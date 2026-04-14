import {
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types/domain";

interface AppShellProps {
  role: AppRole;
  fullName: string;
  children: React.ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: AppRole[];
}

const navigation: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["student", "teacher", "admin", "staff"],
  },
  {
    href: "/courses",
    label: "Courses",
    icon: BookOpen,
    roles: ["student", "teacher", "admin", "staff"],
  },
  {
    href: "/assignments",
    label: "Assignments",
    icon: ClipboardCheck,
    roles: ["student", "teacher", "admin", "staff"],
  },
  {
    href: "/quizzes",
    label: "Quizzes",
    icon: ClipboardCheck,
    roles: ["student", "teacher", "admin", "staff"],
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    roles: ["student", "teacher", "admin", "staff"],
  },
  {
    href: "/assistant",
    label: "AI Tutor",
    icon: Bot,
    roles: ["student", "teacher", "admin", "staff"],
  },
  {
    href: "/teacher/workspace",
    label: "Teacher Workspace",
    icon: Users,
    roles: ["teacher", "admin"],
  },
  {
    href: "/admin/users",
    label: "Admin Users",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    href: "/admin/courses",
    label: "Admin Courses",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    href: "/staff/schedule",
    label: "Staff Schedule",
    icon: CalendarDays,
    roles: ["staff", "admin"],
  },
];

export function AppShell({ role, fullName, children }: AppShellProps) {
  const navItems = navigation.filter((item) => item.roles.includes(role));

  return (
    <div className="relative min-h-screen bg-[var(--surface-0)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-[-12rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(230,179,30,0.2),_transparent_62%)]" />
        <div className="absolute right-[-14rem] top-[20%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.08),_transparent_68%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <div className="mb-8">
            <p className="font-display text-2xl tracking-tight">Digital Learning</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Support System</p>
          </div>

          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Signed in as</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{fullName}</p>
            <Badge className="w-fit" tone="warning">
              {role}
            </Badge>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition",
                    "hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={signOutAction} className="mt-8">
            <Button className="w-full" variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
