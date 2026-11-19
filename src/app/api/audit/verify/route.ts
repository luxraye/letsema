import { NextResponse } from 'next/server';
import { verifyChain } from '@/lib/audit';
export const dynamic = 'force-dynamic';
/** Public: anyone can confirm the audit chain is unbroken. Returns no personal data. */
export async function GET() { const v = await verifyChain(); return NextResponse.json({ ...v, checkedAt: new Date().toISOString() }); }
