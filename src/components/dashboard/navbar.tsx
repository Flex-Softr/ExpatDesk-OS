"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
}

export default function DashboardNavbar({ user }: { user: UserPayload }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 shadow-md transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-heading text-lg font-bold text-white">ExpatDesk OS</span>
            <Badge
              variant="outline"
              className="ml-2 border-blue-500/40 bg-blue-500/10 text-[10px] text-blue-400"
            >
              {user.role}
            </Badge>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-slate-800/60"
          >
            <Avatar className="h-8 w-8 border border-slate-700 bg-blue-600/20 text-blue-300">
              <AvatarFallback className="bg-blue-600/30 text-xs font-semibold text-blue-300">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
