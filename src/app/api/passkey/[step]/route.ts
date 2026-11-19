import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { db, schema } from '@/db';
import { appendAudit } from '@/lib/audit';
import { currentUser, startSession, clientIp } from '@/lib/session';

const CH = 'ceda_webauthn';
async function rp() {
  const h = await headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost').split(',')[0].trim();
  const proto = h.get('x-forwarded-proto')?.split(',')[0] ?? (host.startsWith('localhost') ? 'http' : 'https');
  return { rpID: host.split(':')[0], origin: `${proto}://${host}` };
}
async function setChallenge(c: string) { (await cookies()).set(CH, c, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 300 }); }
async function takeChallenge() { const jar = await cookies(); const c = jar.get(CH)?.value; jar.delete(CH); return c; }

export async function POST(req: Request, { params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const { rpID, origin } = await rp();
  const body = await req.json().catch(() => ({}));

  if (step === 'register-options') {
    const me = await currentUser(); if (!me) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
    const existing = await db.select().from(schema.passkeys).where(eq(schema.passkeys.userId, me.id));
    const opts = await generateRegistrationOptions({ rpName: 'CEDA Innovation Portal', rpID, userName: me.email, userDisplayName: me.name, userID: new TextEncoder().encode(me.id), attestationType: 'none', excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports })), authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' } });
    await setChallenge(opts.challenge);
    return NextResponse.json(opts);
  }
  if (step === 'register-verify') {
    const me = await currentUser(); if (!me) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
    const expectedChallenge = await takeChallenge(); if (!expectedChallenge) return NextResponse.json({ error: 'Took too long. Try again.' }, { status: 400 });
    try {
      const v = await verifyRegistrationResponse({ response: body.response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID });
      if (!v.verified) return NextResponse.json({ error: 'Could not verify the passkey' }, { status: 400 });
      const c = v.registrationInfo.credential;
      await db.insert(schema.passkeys).values({ id: c.id, userId: me.id, publicKey: Buffer.from(c.publicKey).toString('base64url'), counter: c.counter, transports: (c.transports ?? []) as string[], label: String(body.label || 'This device').slice(0, 40) });
      await appendAudit({ actorId: me.id, actorName: me.name, action: 'auth.passkey_added' });
      return NextResponse.json({ ok: true });
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
  }
  if (step === 'login-options') {
    const opts = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
    await setChallenge(opts.challenge);
    return NextResponse.json(opts);
  }
  if (step === 'login-verify') {
    const expectedChallenge = await takeChallenge(); if (!expectedChallenge) return NextResponse.json({ error: 'Took too long. Try again.' }, { status: 400 });
    const [pk] = await db.select().from(schema.passkeys).where(eq(schema.passkeys.id, body.response?.id ?? '')).limit(1);
    if (!pk) return NextResponse.json({ error: 'This passkey is not registered here. Sign in another way and add it in your profile.' }, { status: 400 });
    try {
      const v = await verifyAuthenticationResponse({ response: body.response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, credential: { id: pk.id, publicKey: Buffer.from(pk.publicKey, 'base64url'), counter: pk.counter, transports: pk.transports as never } });
      if (!v.verified) return NextResponse.json({ error: 'Passkey not accepted' }, { status: 400 });
      await db.update(schema.passkeys).set({ counter: v.authenticationInfo.newCounter }).where(eq(schema.passkeys.id, pk.id));
      const [u] = await db.select().from(schema.users).where(eq(schema.users.id, pk.userId));
      await startSession(u.id, 'passkey');
      await appendAudit({ actorId: u.id, actorName: u.name, action: 'auth.signin', detail: { method: 'passkey' }, ip: await clientIp() });
      return NextResponse.json({ ok: true });
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
  }
  return NextResponse.json({ error: 'Unknown step' }, { status: 404 });
}
