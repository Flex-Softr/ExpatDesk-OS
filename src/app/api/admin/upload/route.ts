import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib";
import { Role } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN, Role.STAFF]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create year/month folder structure
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const relativeUploadDir = `/uploads/${year}/${month}`;
    const uploadDir = path.join(process.cwd(), "public", relativeUploadDir);

    await mkdir(uploadDir, { recursive: true });

    // Generate safe unique filename
    const ext = path.extname(file.name) || ".bin";
    const sanitizedBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const filename = `${sanitizedBase}-${uniqueSuffix}${ext}`;

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `${relativeUploadDir}/${filename}`;

    return NextResponse.json(
      {
        url: publicUrl,
        filename,
        size: file.size,
        type: file.type,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Admin API Upload Error]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
