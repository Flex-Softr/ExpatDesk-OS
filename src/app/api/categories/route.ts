import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const createCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  nameEn: z.string().min(1, "English name is required"),
  nameIt: z.string().min(1, "Italian name is required"),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      include: {
        _count: {
          select: { services: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[Public API Categories Error]", error);
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
    const validatedData = createCategorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: validatedData,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Create Category Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
