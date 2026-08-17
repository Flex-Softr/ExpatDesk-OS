"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Users,
  Inbox,
  Briefcase,
  FileText,
  Newspaper,
  FolderTree,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardSidebar({ user }: { user: UserPayload }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/dashboard/profile", icon: User },
    { label: "Leads Inbox", href: "/dashboard/leads", icon: Inbox },
    { label: "Service Categories", href: "/dashboard/categories", icon: FolderTree },
    { label: "Services", href: "/dashboard/services", icon: Briefcase },
    { label: "Blog Posts", href: "/dashboard/blog", icon: FileText },
    { label: "News & Alerts", href: "/dashboard/news", icon: Newspaper },
  ];

  if (user.role === "ADMIN") {
    navItems.push({ label: "User Management", href: "/dashboard/users", icon: Users });
  }

  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-950/60 p-4 md:block">
      <div className="space-y-6">
        <div>
          <h2 className="px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </h2>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-l-2 border-blue-500 bg-blue-600/15 font-semibold text-blue-400"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "text-slate-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
