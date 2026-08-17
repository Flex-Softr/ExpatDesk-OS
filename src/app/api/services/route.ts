import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth, getCurrentUser } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const createServiceSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  categoryId: z.string().min(1, "Category ID is required"),
  titleEn: z.string().min(1, "English title is required"),
  titleIt: z.string().min(1, "Italian title is required"),
  shortDescEn: z.string().min(1, "English short description is required"),
  shortDescIt: z.string().min(1, "Italian short description is required"),
  bodyEn: z.string().min(1, "English body is required"),
  bodyIt: z.string().min(1, "Italian body is required"),
  coverImage: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const user = await getCurrentUser(req);
    const whereClause: Record<string, unknown> = {};

    if (!user || !includeInactive) {
      whereClause.isActive = true;
    }

    if (categorySlug) {
      whereClause.category = { slug: categorySlug };
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
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

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[Public API Services List Error]", error);
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
    const validatedData = createServiceSchema.parse(body);

    const existingService = await prisma.service.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingService) {
      return NextResponse.json({ error: "Service with this slug already exists" }, { status: 400 });
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const service = await prisma.service.create({
      data: validatedData,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Create Service Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
