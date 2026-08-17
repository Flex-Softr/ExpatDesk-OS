import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import * as argon2 from "argon2";
import { prisma } from "./prisma";
import { type Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "expatdesk_session";
const SESSION_EXPIRY_DAYS = 7;

/**
 * Hash password using Argon2id algorithm
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/**
 * Verify password against Argon2id hash
 */
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Create session for a user and return cookie options
 */
export async function createSession(userId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  return {
    sessionId: session.id,
    expiresAt,
  };
}

/**
 * Delete session by session ID
 */
export async function deleteSession(sessionId: string) {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  } catch {
    // Ignore if session does not exist
  }
}

/**
 * Get current authenticated admin/staff user from session cookie
 */
export async function getCurrentUser(req?: NextRequest) {
  let sessionId: string | undefined;

  if (req) {
    sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (new Date() > session.expiresAt || !session.user.isActive) {
    await deleteSession(session.id);
    return null;
  }

  return session.user;
}

/**
 * Verify authorization for route handlers based on allowed roles
 */
export async function requireAuth(req: NextRequest, allowedRoles?: Role[]) {
  const user = await getCurrentUser(req);

  if (!user) {
    return {
      error: "Unauthorized",
      status: 401,
      user: null,
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: "Forbidden: Insufficient permissions",
      status: 403,
      user: null,
    };
  }

  return {
    error: null,
    status: 200,
    user,
  };
}
