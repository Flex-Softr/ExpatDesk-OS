import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateDockSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateDockSchema.parse(body);

    const existingDock = await prisma.dockLink.findUnique({
      where: { id },
    });

    if (!existingDock) {
      return NextResponse.json({ error: "Dock link not found" }, { status: 404 });
    }

    const updatedDock = await prisma.dockLink.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ dockLink: updatedDock });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Update Dock Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    const existingDock = await prisma.dockLink.findUnique({
      where: { id },
    });

    if (!existingDock) {
      return NextResponse.json({ error: "Dock link not found" }, { status: 404 });
    }

    await prisma.dockLink.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Dock link deleted successfully" });
  } catch (error) {
    console.error("[Admin API Delete Dock Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
