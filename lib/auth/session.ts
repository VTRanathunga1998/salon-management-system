import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session-id";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });

  (await cookies()).set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionUser() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { id: true, username: true, role: true, isActive: true },
      },
    },
  });

  const isInvalid =
    !session ||
    session.expiresAt < new Date() ||
    !session.user ||
    !session.user.isActive;

  if (isInvalid) {
    if (session) {
      await prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => {});
    }
    // Do NOT touch cookies here — this runs inside Server Components too.
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  (await cookies()).delete(SESSION_COOKIE);
}
