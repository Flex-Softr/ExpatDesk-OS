import { type NextRequest, NextResponse } from "next/server";
import { prisma, requireAuth, getCurrentUser } from "@/lib";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateBlogSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  titleEn: z.string().min(1).optional(),
  titleIt: z.string().min(1).optional(),
  excerptEn: z.string().min(1).optional(),
  excerptIt: z.string().min(1).optional(),
  bodyEn: z.string().min(1).optional(),
  bodyIt: z.string().min(1).optional(),
  coverImage: z.string().nullable().optional(),
  authorName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser(req);

    const whereClause: Record<string, unknown> = { slug };
    if (!user) {
      whereClause.isPublished = true;
    }

    const post = await prisma.blogPost.findFirst({
      where: whereClause,
    });

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[Public API Blog Detail Error]", error);
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
    const validatedData = updateBlogSchema.parse(body);

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (validatedData.slug && validatedData.slug !== slug) {
      const slugCheck = await prisma.blogPost.findUnique({
        where: { slug: validatedData.slug },
      });
      if (slugCheck) {
        return NextResponse.json({ error: "New slug already in use" }, { status: 400 });
      }
    }

    const updatedPost = await prisma.blogPost.update({
      where: { slug },
      data: validatedData,
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Admin API Update Blog Error]", error);
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

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("[Admin API Delete Blog Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
