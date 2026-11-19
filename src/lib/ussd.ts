import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from '@/db';
import { STATUS } from './format';
import { currentStage } from './instances';
import { chatStatus } from './hours';

/**
 * A USSD menu for people without mobile data. `text` is everything the caller has
 * typed so far, joined by `*`, which is how USSD gateways (such as Africa's Talking)
 * pass a session. Replies start with CON (keep the session open) or END.
 */
export async function ussdReply(text: string): Promise<string> {
  const parts = text.split('*').map((s) => s.trim()).filter((s, i) => s !== '' || i > 0);
  const [choice, arg] = parts;
  if (!choice) return 'CON CEDA Innovation Portal\n1. Track my application\n2. Open competitions\n3. Talk to CEDA\n0. Exit';
  if (choice === '0') return 'END Thank you. Dial *161# any time.';
  if (choice === '1') {
    if (!arg) return 'CON Enter your reference number.\nFor CEDA-26-0101, type 0101';
    const ref = /^\d{1,4}$/.test(arg) ? `CEDA-26-${arg.padStart(4, '0')}` : arg.toUpperCase();
    const [row] = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries)
      .innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId))
      .where(and(eq(schema.entries.ref, ref), ne(schema.entries.status, 'draft'))).limit(1);
    if (!row) return `END No application found for ${ref}. Check the code on your receipt.`;
    const stage = currentStage(row.i.definition).stage;
    return `END ${row.e.ref}: ${STATUS[row.e.status]?.label ?? row.e.status}.\n${STATUS[row.e.status]?.plain ?? ''}${stage ? `\nCompetition stage: ${stage.label}.` : ''}`;
  }
  if (choice === '2') {
    const live = await db.select({ name: schema.instances.name, closes: schema.instances.closesAt, def: schema.instances.definition }).from(schema.instances).where(eq(schema.instances.status, 'live')).limit(8);
    const open = live.filter((x) => x.def.audience !== 'staff').slice(0, 4);
    if (!open.length) return 'END No competitions are open right now.';
    return `END Open now:\n${open.map((x, n) => `${n + 1}. ${x.name.slice(0, 40)}${x.closes ? `, closes ${x.closes.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Gaborone' })}` : ''}`).join('\n')}\nApply at the portal or any CEDA office.`;
  }
  if (choice === '3') {
    const h = chatStatus();
    return `END Live chat: Mon to Fri, 09:00 to 16:00. ${h.open ? 'Consultants are online now.' : `${h.reason}.`}\nOr visit any CEDA office.`;
  }
  return 'END Sorry, that is not an option. Dial *161# to start again.';
}
