import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser, prisma, hashPassword, verifyPassword } from "@/lib";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user details for profile
    const fullUser = await prisma.adminUser.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: fullUser });
  } catch (error) {
    console.error("[Auth API Me Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { name, currentPassword, newPassword } = validation.data;
    const updateData: Record<string, unknown> = {};

    if (name) {
      updateData.name = name;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 },
        );
      }

      const dbUser = await prisma.adminUser.findUnique({
        where: { id: currentUser.id },
      });

      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isPasswordValid = await verifyPassword(dbUser.passwordHash, currentPassword);

      if (!isPasswordValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes provided" });
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[Auth API Update Profile Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
