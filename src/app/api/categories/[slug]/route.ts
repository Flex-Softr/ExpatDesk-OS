import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  nameEn: z.string().min(1).optional(),
  nameIt: z.string().min(1).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[Public API Category Detail Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { slug } = await params;
    const body = await req.json();
    const validatedData = updateCategorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (validatedData.slug && validatedData.slug !== slug) {
      const slugCheck = await prisma.category.findUnique({
        where: { slug: validatedData.slug },
      });
      if (slugCheck) {
        return NextResponse.json({ error: "New slug already in use" }, { status: 400 });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { slug },
      data: validatedData,
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Update Category Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { slug } = await params;

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { services: true } } },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existingCategory._count.services > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that contains services. Move or delete services first." },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("[Admin API Delete Category Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
