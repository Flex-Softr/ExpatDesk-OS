import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth, getCurrentUser } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const createNewsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  titleEn: z.string().min(1, "English title is required"),
  titleIt: z.string().min(1, "Italian title is required"),
  bodyEn: z.string().min(1, "English body is required"),
  bodyIt: z.string().min(1, "Italian body is required"),
  coverImage: z.string().nullable().optional(),
  publishedAt: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  isPublished: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const user = await getCurrentUser(req);
    const whereClause: Record<string, unknown> = {};

    if (!user) {
      whereClause.isPublished = true;
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where: whereClause,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.news.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      news,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Public API News List Error]", error);
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
    const validatedData = createNewsSchema.parse(body);

    const existingNews = await prisma.news.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingNews) {
      return NextResponse.json(
        { error: "News article with this slug already exists" },
        { status: 400 },
      );
    }

    const news = await prisma.news.create({
      data: validatedData,
    });

    return NextResponse.json({ news }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Create News Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
