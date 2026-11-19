import { asc, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { canonical, sha256 } from './crypto';

export const GENESIS = '0'.repeat(64);

type AuditInput = {
  actorId?: string | null; actorName: string; action: string;
  instanceId?: string | null; entryId?: string | null; detail?: Record<string, unknown>; ip?: string | null;
};

export function rowHash(prevHash: string, r: { at: Date; actorName: string; action: string; instanceId?: string | null; entryId?: string | null; detail: unknown }) {
  return sha256(prevHash + canonical({ at: r.at.toISOString(), actor: r.actorName, action: r.action, instance: r.instanceId ?? null, entry: r.entryId ?? null, detail: r.detail }));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Append to the hash chain. A transaction-scoped advisory lock keeps the chain strictly ordered. */
export async function appendAudit(input: AuditInput, tx?: Tx) {
  const run = async (t: Tx) => {
    await t.execute(sql`select pg_advisory_xact_lock(7231)`);
    const [last] = await t.select({ hash: schema.audit.hash }).from(schema.audit).orderBy(sql`seq desc`).limit(1);
    const prevHash = last?.hash ?? GENESIS;
    const at = new Date(Math.floor(Date.now()));
    const detail = input.detail ?? {};
    const hash = rowHash(prevHash, { at, ...input, detail });
    await t.insert(schema.audit).values({ at, actorId: input.actorId ?? null, actorName: input.actorName, action: input.action, instanceId: input.instanceId ?? null, entryId: input.entryId ?? null, detail, ip: input.ip ?? null, prevHash, hash });
    return hash;
  };
  return tx ? run(tx) : db.transaction(run);
}

export async function verifyChain() {
  const rows = await db.select().from(schema.audit).orderBy(asc(schema.audit.seq));
  let prev = GENESIS;
  for (const r of rows) {
    const expect = rowHash(prev, { at: r.at, actorName: r.actorName, action: r.action, instanceId: r.instanceId, entryId: r.entryId, detail: r.detail });
    if (r.prevHash !== prev || r.hash !== expect) return { ok: false as const, count: rows.length, brokenAt: r.seq, head: prev };
    prev = r.hash;
  }
  return { ok: true as const, count: rows.length, brokenAt: null, head: prev };
}
