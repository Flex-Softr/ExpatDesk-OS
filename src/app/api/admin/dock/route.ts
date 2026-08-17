import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const createDockSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().min(1, "URL is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN, Role.STAFF]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const dockLinks = await prisma.dockLink.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ dockLinks });
  } catch (error) {
    console.error("[Admin API Dock List Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const validatedData = createDockSchema.parse(body);

    const dockLink = await prisma.dockLink.create({
      data: validatedData,
    });

    return NextResponse.json({ dockLink }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Create Dock Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
