'use server';

import { db } from '@/db';
import { users, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, createSession, destroySession, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string)?.trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return { error: 'An account with this email address already exists.' };
  }

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      fullName: fullName || null,
    })
    .returning();

  await createSession(newUser.id);
  redirect('/onboarding');
}

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userList[0];

  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: 'Invalid email or password.' };
  }

  await createSession(user.id);

  // Check if organization exists
  const orgList = await db.select().from(organizations).where(eq(organizations.userId, user.id)).limit(1);
  if (!orgList[0]) {
    redirect('/onboarding');
  } else {
    redirect('/invoices');
  }
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}

export async function saveOnboardingAction(data: {
  fullName: string;
  phone: string;
  companyName: string;
  taxId?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  defaultCurrency?: string;
  invoicePrefix?: string;
  defaultTerms?: string;
  bankName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  accountNumber?: string;
  swiftBic?: string;
  paymentNotes?: string;
}) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized session.' };
  }

  // Update user's name & phone if provided
  if (data.fullName) {
    await db.update(users).set({ fullName: data.fullName }).where(eq(users.id, session.user.id));
  }

  // Check if organization already exists
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.userId, session.user.id))
    .limit(1);

  if (existingOrg[0]) {
    await db
      .update(organizations)
      .set({
        companyName: data.companyName,
        taxId: data.taxId || null,
        phone: data.phone || null,
        addressLine: data.addressLine || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || 'US',
        defaultCurrency: data.defaultCurrency || 'USD',
        invoicePrefix: data.invoicePrefix || 'INV-',
        defaultTerms: data.defaultTerms || 'NET_30',
        bankName: data.bankName || null,
        accountHolderName: data.accountHolderName || data.companyName,
        routingNumber: data.routingNumber || null,
        accountNumber: data.accountNumber || null,
        swiftBic: data.swiftBic || null,
        paymentNotes: data.paymentNotes || null,
      })
      .where(eq(organizations.id, existingOrg[0].id));
  } else {
    await db.insert(organizations).values({
      userId: session.user.id,
      companyName: data.companyName,
      taxId: data.taxId || null,
      phone: data.phone || null,
      addressLine: data.addressLine || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || 'US',
      defaultCurrency: data.defaultCurrency || 'USD',
      invoicePrefix: data.invoicePrefix || 'INV-',
      nextInvoiceNumber: 1001,
      defaultTerms: data.defaultTerms || 'NET_30',
      bankName: data.bankName || null,
      accountHolderName: data.accountHolderName || data.companyName,
      routingNumber: data.routingNumber || null,
      accountNumber: data.accountNumber || null,
      swiftBic: data.swiftBic || null,
      paymentNotes: data.paymentNotes || null,
    });
  }

  return { success: true };
}

