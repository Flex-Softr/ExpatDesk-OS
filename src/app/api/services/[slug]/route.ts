import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth, getCurrentUser } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateServiceSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  categoryId: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  titleIt: z.string().min(1).optional(),
  shortDescEn: z.string().min(1).optional(),
  shortDescIt: z.string().min(1).optional(),
  bodyEn: z.string().min(1).optional(),
  bodyIt: z.string().min(1).optional(),
  coverImage: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser(req);

    const whereClause: Record<string, unknown> = { slug };
    if (!user) {
      whereClause.isActive = true;
    }

    const service = await prisma.service.findFirst({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameIt: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("[Public API Service Detail Error]", error);
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
    const validatedData = updateServiceSchema.parse(body);

    const existingService = await prisma.service.findUnique({
      where: { slug },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (validatedData.slug && validatedData.slug !== slug) {
      const slugCheck = await prisma.service.findUnique({
        where: { slug: validatedData.slug },
      });
      if (slugCheck) {
        return NextResponse.json({ error: "New slug already in use" }, { status: 400 });
      }
    }

    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });
      if (!categoryExists) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    const updatedService = await prisma.service.update({
      where: { slug },
      data: validatedData,
    });

    return NextResponse.json({ service: updatedService });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Update Service Error]", error);
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

    const existingService = await prisma.service.findUnique({
      where: { slug },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await prisma.service.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("[Admin API Delete Service Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
