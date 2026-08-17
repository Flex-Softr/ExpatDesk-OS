import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/dashboard/profile-form";
import { UserCheck, Clock, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const authUser = await getCurrentUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch full details from DB
  const user = await prisma.adminUser.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Title */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white">User Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your account information and password settings.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Badge Card */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Overview Card */}
          <Card className="border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto mb-3">
                <Avatar className="h-20 w-20 border-2 border-blue-500/40 bg-blue-600/20 shadow-lg">
                  <AvatarFallback className="bg-blue-600/30 text-xl font-bold text-blue-300">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="font-heading text-xl text-white">{user.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1 text-xs text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Account Role</span>
                <Badge
                  variant="outline"
                  className="border-blue-500/40 bg-blue-500/10 font-semibold text-blue-300"
                >
                  {user.role}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 font-semibold text-emerald-300"
                >
                  <UserCheck className="mr-1 h-3 w-3" /> Active
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Member Since</span>
                <span className="flex items-center gap-1 font-medium text-slate-200">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {formattedDate}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editable Profile & Password Form */}
        <div className="lg:col-span-2">
          <ProfileForm initialUser={user} />
        </div>
      </div>
    </div>
  );
}
