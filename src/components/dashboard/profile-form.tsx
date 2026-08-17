"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, KeyRound, Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserProfileProps {
  initialUser: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function ProfileForm({ initialUser }: UserProfileProps) {
  const router = useRouter();

  // Profile details state
  const [name, setName] = useState(initialUser.name);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsSuccess(null);
    setDetailsError(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile details.");
      }

      setDetailsSuccess("Profile details updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDetailsError(err.message);
      } else {
        setDetailsError("An unexpected error occurred.");
      }
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setSavingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      setSavingPassword(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password.");
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError("An unexpected error occurred.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Details Form */}
      <Card className="border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            <CardTitle className="font-heading text-lg text-white">Account Information</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Update your public display name and account information.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleUpdateDetails}>
          <CardContent className="space-y-4 pb-6">
            {detailsSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{detailsSuccess}</span>
              </div>
            )}

            {detailsError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                  Email Address (Read-only)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={initialUser.email}
                  disabled
                  className="cursor-not-allowed border-slate-800 bg-slate-950/30 text-slate-400"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-slate-800/80 pt-5">
            <Button
              type="submit"
              disabled={savingDetails}
              className="gap-1.5 bg-blue-600 text-xs text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"
            >
              {savingDetails ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Save Profile Details
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password Form */}
      <Card className="border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-400" />
            <CardTitle className="font-heading text-lg text-white">Security & Password</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Change your account password. Use a strong password to ensure security.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4 pb-6">
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs font-medium text-slate-300">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-medium text-slate-300">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-slate-800/80 pt-5">
            <Button
              type="submit"
              disabled={savingPassword}
              className="gap-1.5 bg-indigo-600 text-xs text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating Password...
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" /> Change Password
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
