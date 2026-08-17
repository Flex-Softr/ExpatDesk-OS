import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth } from "@/lib";
import { Role, ModuleFileType } from "@prisma/client";
import { z } from "zod";

const createModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ModuleFileType),
  filePath: z.string().optional(),
  driveUrl: z.string().optional(),
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
    const modules = await prisma.module.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("[Admin API Module List Error]", error);
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
    const validatedData = createModuleSchema.parse(body);

    const moduleItem = await prisma.module.create({
      data: validatedData,
    });

    return NextResponse.json({ module: moduleItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Create Module Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
