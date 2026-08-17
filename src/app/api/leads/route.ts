import { type NextRequest, NextResponse } from "next/server";
import {
  prisma,
  requireAuth,
  sendLeadEmailNotification,
  sendLeadWhatsAppNotification,
} from "@/lib";
import { Role, LeadStatus } from "@prisma/client";
import { z } from "zod";

const createLeadSchema = z.object({
  serviceSlug: z.string().nullable().optional(),
  serviceName: z.string().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullable().optional(),
  preferredLang: z.enum(["en", "it"]).optional().default("en"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createLeadSchema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        serviceSlug: validatedData.serviceSlug || null,
        serviceName: validatedData.serviceName || null,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        preferredLang: validatedData.preferredLang,
        message: validatedData.message,
        status: LeadStatus.NEW,
      },
    });

    // Send notifications asynchronously and update status booleans
    Promise.all([
      sendLeadEmailNotification({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        serviceName: lead.serviceName,
        preferredLang: lead.preferredLang,
        message: lead.message,
      }),
      sendLeadWhatsAppNotification({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        serviceName: lead.serviceName,
        preferredLang: lead.preferredLang,
        message: lead.message,
      }),
    ]).then(async ([emailSent, whatsappSent]) => {
      await prisma.lead
        .update({
          where: { id: lead.id },
          data: {
            emailNotified: emailSent,
            whatsappNotified: whatsappSent,
          },
        })
        .catch((err) => {
          console.error("[Leads API Notification Status Update Error]", err);
        });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Request submitted successfully",
        leadId: lead.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[Public API Create Lead Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, [Role.ADMIN]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const serviceSlug = searchParams.get("serviceSlug");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (statusParam && Object.values(LeadStatus).includes(statusParam as LeadStatus)) {
      whereClause.status = statusParam as LeadStatus;
    }

    if (serviceSlug) {
      whereClause.serviceSlug = serviceSlug;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Admin API Leads List Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
