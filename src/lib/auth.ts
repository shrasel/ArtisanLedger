import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users, organizations, type User, type Organization } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'the-architects-ledger-super-secret-key-archival-2026'
);
const SESSION_COOKIE_NAME = 'arch_session';
const SESSION_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export interface SessionData {
  user: User;
  organization: Organization | null;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SESSION_SECRET);
    const userId = payload.userId as string;
    if (!userId) return null;

    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userList[0];
    if (!user) return null;

    const orgList = await db.select().from(organizations).where(eq(organizations.userId, user.id)).limit(1);
    const organization = orgList[0] || null;

    return { user, organization };
  } catch (err) {
    return null;
  }
}

/**
 * Access gate cookie handling for invoice recipient portal
 */
export async function grantInvoiceViewAccess(accessToken: string) {
  const jwt = await new SignJWT({ accessToken, verified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(`arch_view_${accessToken}`, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/view/${accessToken}`,
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function hasInvoiceViewAccess(accessToken: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(`arch_view_${accessToken}`)?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload.accessToken === accessToken && payload.verified === true;
  } catch {
    return false;
  }
}

