import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Inbox, Briefcase, FileText, Users, ArrowUpRight, User, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Aggregate stats from DB safely
  const [leadsCount, servicesCount, categoriesCount, blogCount, usersCount] = await Promise.all([
    prisma.lead.count().catch(() => 0),
    prisma.service.count().catch(() => 0),
    prisma.category.count().catch(() => 0),
    prisma.blogPost.count().catch(() => 0),
    prisma.adminUser.count().catch(() => 0),
  ]);

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl lg:p-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-500/40 bg-blue-500/10 text-xs text-blue-300"
            >
              Welcome Back
            </Badge>
            <span className="font-mono text-xs text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Hello, {user?.name || "Administrator"}!
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            Welcome to ExpatDesk OS control panel. Monitor relocation leads, manage service
            offerings, and configure platform settings.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard/profile"
              className={buttonVariants({
                size: "sm",
                className:
                  "gap-1.5 bg-blue-600 font-medium text-white shadow-md shadow-blue-600/20 hover:bg-blue-500",
              })}
            >
              <User className="h-4 w-4" /> View My Profile
            </Link>
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "gap-1.5 border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800",
              })}
            >
              <ExternalLink className="h-4 w-4" /> Open Main Website
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Leads */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-lg transition-colors hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Total Inquiries
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Inbox className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-white">{leadsCount}</div>
            <p className="mt-1 text-[11px] text-slate-400">Submitted relocation leads</p>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-lg transition-colors hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Active Services
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-white">{servicesCount}</div>
            <p className="mt-1 text-[11px] text-slate-400">Across {categoriesCount} categories</p>
          </CardContent>
        </Card>

        {/* Blog Posts */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-lg transition-colors hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Blog & Guides
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-white">{blogCount}</div>
            <p className="mt-1 text-[11px] text-slate-400">Expat guidance articles</p>
          </CardContent>
        </Card>

        {/* Admin Users */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-lg transition-colors hover:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              System Accounts
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-white">{usersCount}</div>
            <p className="mt-1 text-[11px] text-slate-400">Admins & Staff members</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/80 shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-white">User Profile</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              View and update your account details, name, and password settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/profile"
              className={buttonVariants({
                variant: "outline",
                className:
                  "w-full justify-between border-slate-800 bg-slate-950/60 text-xs text-slate-200 hover:bg-slate-800",
              })}
            >
              <span>Go to User Profile</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-white">System Settings</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Manage your ExpatDesk OS platform categories, services, and content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                className:
                  "w-full justify-between border-slate-800 bg-slate-950/60 text-xs text-slate-200 hover:bg-slate-800",
              })}
            >
              <span>View Main Site</span>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
