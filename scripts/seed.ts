/* Demo data for the judging preview. Run: npm run db:seed (wipes and refills the database). */
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { DEFAULT_THEME } from '@/lib/settings';
import type { EntryStatus, InstanceDefinition, Role } from '@/db/schema';
import { appendAudit } from '@/lib/audit';
import { HACKATHON_RUBRIC, SECTORS, DISTRICTS, standardDefinition, REGULATORS } from '@/lib/catalogue';
import { canonical, sha256, shortCode } from '@/lib/crypto';
import { rulesHash } from '@/lib/instances';
import { weightedTotal } from '@/lib/scoring';
import { slaTargets } from '@/lib/sla';

export const DEMO_PASSWORD = 'CedaDemo2026!';
const DAY = 86400_000;
const NOW = Date.now();
const at = (days: number, hours = 0) => new Date(NOW + days * DAY + hours * 3600_000);

let s = 20261113;
const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));

async function wipe() {
  const tables = ['chat_messages', 'chats', 'tickets', 'replies', 'threads', 'content', 'subscriptions', 'outbox', 'notifications', 'audit', 'messages', 'votes', 'evaluations', 'checks', 'entry_files', 'entry_versions', 'entries', 'instance_roles', 'instance_versions', 'instances', 'api_keys', 'privacy_requests', 'passkeys', 'codes', 'sessions', 'users', 'spaces', 'settings'];
  await db.execute(sql.raw(`truncate ${tables.map((t) => `"${t}"`).join(', ')} restart identity cascade`));
}

/** Each demo competition sets its own entry rules, the way real calls differ. */
type Rules = InstanceDefinition['eligibility'];
const DEMO_RULES: Record<string, Rules> = {
  'ceda-portal-hackathon-2026': { minAge: 18, maxAge: 35, citizenOnly: true, minYouthShare: 50, cipaRequired: true },
  'youth-innovation-ideas-2026': { minAge: 18, maxAge: 35, citizenOnly: true, businessStages: ['idea'] },
  'green-economy-call-2026': { citizenOnly: true, cipaRequired: true, sectorRequired: true, businessStages: ['startup', 'growth'] },
  'staff-intrapreneurship-2026': {},
  'ceda-women-enterprise-2026': { minAge: 18, citizenOnly: true, cipaRequired: true, womenLed: true, businessStages: ['startup', 'growth'] },
  'bdih-digital-leap-2026': { minAge: 18, cipaRequired: true, sectorRequired: true, businessStages: ['startup', 'growth'] },
  'btc-5g-iot-2026': { minAge: 18, sectorRequired: true, businessStages: ['idea', 'startup'] },
  'tourism-creative-2027': { citizenOnly: true, sectorRequired: true },
};
const WOMEN = {
  slug: 'ceda-women-enterprise-2026', name: 'CEDA Women in Enterprise Fund 2026', tagline: 'Growth funding for businesses owned by women.',
  description: 'Loans with a grant top-up and mentoring for registered businesses that are at least 51% owned by women citizens. Part of CEDA’s push to close the gender gap among the innovators it funds.',
  photo: '/photos/tailor.webp',
  def: () => standardDefinition({
    stages: [
      { key: 'apply', label: 'Applications open', starts: '2026-11-02', ends: '2026-12-18' },
      { key: 'screen', label: 'Screening', starts: '2027-01-04', ends: '2027-01-08' },
      { key: 'score', label: 'Independent scoring', starts: '2027-01-11', ends: '2027-01-22' },
      { key: 'panel', label: 'Panel decision', starts: '2027-01-25', ends: '2027-01-29' },
      { key: 'award', label: 'Awards and onboarding', starts: '2027-02-01', ends: '2027-02-12' },
    ],
    eligibility: DEMO_RULES['ceda-women-enterprise-2026'],
    prizes: [{ place: 'Up to 15 businesses', amount: 750000 }],
  }),
};

/** Live data: set each competition's own entry rules, add the women's fund, and record it all as a new rules version. */
async function perCompetitionRules() {
  const [admin] = await db.select().from(schema.users).where(sql`email = 'admin@demo.ceda.bw'`);
  const all = await db.select().from(schema.instances);
  const reason = 'Entry rules set for this competition';
  for (const i of all) {
    const rules = DEMO_RULES[i.slug];
    if (!rules || canonical(rules) === canonical(i.definition.eligibility)) continue;
    const def = { ...i.definition, eligibility: rules };
    const hash = rulesHash(def);
    const version = i.status === 'draft' ? i.version : i.version + 1;
    await db.update(schema.instances).set({ definition: def, rulesHash: hash, version, updatedAt: new Date() }).where(sql`id = ${i.id}`);
    if (i.status !== 'draft') {
      await db.insert(schema.instanceVersions).values({ instanceId: i.id, version, reason, definition: def, rulesHash: hash, changes: ['Changed eligibility rules'], byId: admin?.id ?? null });
      await appendAudit({ actorId: admin?.id, actorName: admin?.name ?? 'System', action: 'instance.rules_changed', instanceId: i.id, detail: { version, from: i.rulesHash, to: hash, reason, changes: ['Changed eligibility rules'] } });
    }
  }
  if (!all.some((i) => i.slug === WOMEN.slug)) {
    const [ceda] = await db.select().from(schema.spaces).where(sql`slug = 'ceda'`);
    const def = WOMEN.def();
    const [x] = await db.insert(schema.instances).values({ spaceId: ceda.id, slug: WOMEN.slug, name: WOMEN.name, tagline: WOMEN.tagline, description: WOMEN.description, definition: def, rulesHash: rulesHash(def), photo: WOMEN.photo, status: 'live', opensAt: new Date(def.stages[0].starts), closesAt: new Date(def.stages.at(-1)!.ends), createdById: admin?.id ?? null }).returning();
    await db.insert(schema.instanceVersions).values({ instanceId: x.id, version: 1, reason: 'First published', definition: def, rulesHash: x.rulesHash, byId: admin?.id ?? null });
    const team = await db.select().from(schema.users).where(sql`role in ('evaluator', 'panel')`);
    await db.insert(schema.instanceRoles).values([
      ...(admin ? [{ userId: admin.id, instanceId: x.id, role: 'organiser' as const }] : []),
      ...team.map((u) => ({ userId: u.id, instanceId: x.id, role: u.role === 'panel' ? 'panel' as const : 'evaluator' as const })),
    ]).onConflictDoNothing();
    await appendAudit({ actorId: admin?.id, actorName: admin?.name ?? 'System', action: 'instance.published', instanceId: x.id, detail: { name: x.name, rulesHash: x.rulesHash, version: 1 } });
  }
  await db.insert(schema.settings).values({ key: 'eligibility_v2', value: true }).onConflictDoNothing();
  console.log('Set each competition’s own entry rules.');
}

async function main() {
  if (process.argv.includes('--if-empty') && (await db.$count(schema.users)) > 0) {
    // Keep data, but move a theme still on the first CEDA defaults to the current ones.
    const [t] = await db.select().from(schema.settings).where(sql`key = 'theme'`);
    const v = t?.value as { preset?: string; accent?: string } | undefined;
    if (v?.preset === 'ceda' && v.accent === '#f4a62a') await db.update(schema.settings).set({ value: DEFAULT_THEME }).where(sql`key = 'theme'`);
    // Once only: move a theme still on the CEDA preset to the new built-in Burgundy/Azure look.
    const [moved] = await db.select().from(schema.settings).where(sql`key = 'look_v2'`);
    if (!moved) {
      if (!v || v.preset === 'ceda') await db.insert(schema.settings).values({ key: 'theme', value: DEFAULT_THEME }).onConflictDoUpdate({ target: schema.settings.key, set: { value: DEFAULT_THEME } });
      await db.insert(schema.settings).values({ key: 'look_v2', value: true });
    }
    // Once only: give each competition its own entry rules (they all shared one set before).
    const [ruled] = await db.select().from(schema.settings).where(sql`key = 'eligibility_v2'`);
    if (!ruled) await perCompetitionRules();
    console.log('Database already has data; leaving it alone.'); process.exit(0);
  }
  console.log('Seeding…');
  await wipe();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [ceda, bdih, btc] = await db.insert(schema.spaces).values([
    { slug: 'ceda', name: 'Citizen Entrepreneurial Development Agency', short: 'CEDA', about: 'Botswana’s development finance agency for citizen-owned businesses.', primary: '#d94914', accent: '#f4a62a' },
    { slug: 'bdih', name: 'Botswana Digital & Innovation Hub', short: 'BDIH', about: 'Demo partner space: digital innovation, incubation and the Science and Technology Park.', primary: '#0f6e8c', accent: '#35c2c1' },
    { slug: 'btc', name: 'BTC Innovation', short: 'BTC', about: 'Demo partner space: connectivity, 5G and IoT challenges.', primary: '#1d4fa3', accent: '#7cc4ff' },
  ]).returning();

  type U = { email: string; name: string; role: Role; title?: string; phone?: string; space?: string; extra?: Partial<typeof schema.users.$inferInsert> };
  const people: U[] = [
    { email: 'innovator@demo.ceda.bw', name: 'Kagiso Molefe', role: 'innovator', phone: '+26771000001', extra: { omang: '123456789', dateOfBirth: '1997-03-14', gender: 'Male', district: 'Gaborone', organisation: 'Molefe Agri Labs (Pty) Ltd', cipaNumber: 'BW00001234567', youthShare: 100 } },
    { email: 'evaluator@demo.ceda.bw', name: 'Dr Lesego Ntsima', role: 'evaluator', title: 'Agri-economist, independent evaluator', extra: { expertise: 'Agriculture, agro-processing' } },
    { email: 'panel@demo.ceda.bw', name: 'Onalenna Dube', role: 'panel', title: 'Chair, Innovation Adjudication Panel' },
    { email: 'observer@demo.ceda.bw', name: 'Masego Phiri', role: 'observer', title: 'External committee observer' },
    { email: 'consultant@demo.ceda.bw', name: 'Thato Keabetswe', role: 'consultant', title: 'Client service consultant' },
    { email: 'partner@demo.ceda.bw', name: 'Boitumelo Sebele', role: 'partner_admin', title: 'Programme lead, BDIH', space: bdih.id },
    { email: 'admin@demo.ceda.bw', name: 'Neo Mothibi', role: 'admin', title: 'Innovation programme manager' },
    { email: 'super@demo.ceda.bw', name: 'Tebogo Kgosi', role: 'superadmin', title: 'Platform owner, ICT' },
    { email: 'staff@demo.ceda.bw', name: 'Ame Lebotse', role: 'innovator', title: 'Credit analyst (CEDA staff)', extra: { organisation: 'CEDA' } },
  ];
  const evaluatorNames = ['Prof. Kabo Seretse', 'Mpho Gaolathe', 'Dr Naledi Tau', 'Refilwe Motsumi', 'Oratile Kebonang'];
  const panelNames = ['Lorato Masire', 'Gofaone Ramotswa', 'Kelebogile Sithole'];
  evaluatorNames.forEach((n, i) => people.push({ email: `evaluator${i + 2}@demo.ceda.bw`, name: n, role: 'evaluator', title: 'Independent evaluator', extra: { expertise: pick(SECTORS) } }));
  panelNames.forEach((n, i) => people.push({ email: `panel${i + 2}@demo.ceda.bw`, name: n, role: 'panel', title: 'Panel member' }));
  people.push({ email: 'consultant2@demo.ceda.bw', name: 'Kefilwe Mogapi', role: 'consultant', title: 'Client service consultant' });
  const first = ['Boitshepo', 'Tumelo', 'Onkemetse', 'Lebogang', 'Kitso', 'Bontle', 'Tshepo', 'Neo', 'Kago', 'Amantle', 'Masego', 'Tlotlo', 'Goitse', 'Keneilwe', 'Tebatso', 'Phenyo', 'Wame', 'Karabo', 'Oarabile', 'Lesedi', 'Thabo', 'Mpho', 'Dineo', 'Kabelo', 'Naledi', 'Atlang', 'Boipelo', 'Gaone', 'Reneilwe', 'Itumeleng', 'Kgomotso', 'Larona', 'Mothusi', 'Omphile'];
  const last = ['Kgosi', 'Mosweu', 'Ramotswa', 'Seretse', 'Mokgweetsi', 'Tlhako', 'Motlhabane', 'Pheko', 'Modise', 'Sebina', 'Gabaake', 'Mmusi', 'Ntwaagae', 'Letsholo'];
  first.forEach((f, i) => people.push({ email: `${f.toLowerCase()}.${i}@demo.ceda.bw`, name: `${f} ${last[i % last.length]}`, role: 'innovator', phone: `+2677200${String(i).padStart(4, '0')}`, extra: { district: pick(DISTRICTS), dateOfBirth: `${between(1991, 2005)}-0${between(1, 9)}-1${between(0, 9)}`, gender: i % 2 ? 'Female' : 'Male', youthShare: between(51, 100), cipaNumber: `BW0000${between(1000000, 9999999)}`, organisation: `${last[i % last.length]} Ventures (Pty) Ltd` } }));

  const users = await db.insert(schema.users).values(people.map((p) => ({
    email: p.email, name: p.name, role: p.role, title: p.title, phone: p.phone, passwordHash: hash, spaceId: p.space ?? null,
    emailVerifiedAt: at(-200), phoneVerifiedAt: p.phone ? at(-200) : null, consentAt: at(-200), createdAt: at(-between(20, 300)),
    alerts: { email: true, sms: !!p.phone, inapp: true }, ...p.extra,
  }))).returning();
  const U = (email: string) => users.find((u) => u.email === email)!;
  const admin = U('admin@demo.ceda.bw');
  const evaluators = users.filter((u) => u.role === 'evaluator');
  const panel = users.filter((u) => u.role === 'panel');
  const innovators = users.filter((u) => u.role === 'innovator' && u.email !== 'staff@demo.ceda.bw');

  // ── Instances ───────────────────────────────────────────────────────────
  const hackathon: InstanceDefinition = standardDefinition({
    kind: 'hackathon',
    stages: [
      { key: 'register', label: 'Registration and teams', starts: '2026-11-09', ends: '2026-11-12' },
      { key: 'briefing', label: 'Official briefing', starts: '2026-11-13', ends: '2026-11-13' },
      { key: 'build', label: 'Build window', starts: '2026-11-13', ends: '2026-11-23', note: 'Clarification check-ins on 16 and 20 November.' },
      { key: 'submit', label: 'Final submission', starts: '2026-11-20', ends: '2026-11-23', note: 'Closes 23 November at 17:00.' },
      { key: 'screen', label: 'Screening', starts: '2026-11-24', ends: '2026-11-25' },
      { key: 'score', label: 'Independent scoring', starts: '2026-11-25', ends: '2026-11-30' },
      { key: 'shortlist', label: 'Top 5 announced', starts: '2026-11-30', ends: '2026-12-01' },
      { key: 'pitch', label: 'Pitch day and prizes', starts: '2026-12-03', ends: '2026-12-03' },
    ],
    form: [
      { key: 'problem', label: 'Which problems in the brief does your portal solve best?', type: 'textarea', required: true, maxWords: 200 },
      { key: 'solution', label: 'How does it work?', type: 'textarea', required: true, maxWords: 300 },
      { key: 'demo_url', label: 'Live demo link', type: 'url', required: true },
      { key: 'repo_url', label: 'Source code link', type: 'url', required: true },
      { key: 'hosting', label: 'Where is it hosted and what does it cost?', type: 'textarea', required: true, maxWords: 150 },
      { key: 'proposal', label: 'Technical proposal', help: 'PDF, up to 10 pages.', type: 'file', required: true, accept: ['pdf'], maxMb: 10, maxPages: 10 },
    ],
    rubric: HACKATHON_RUBRIC,
    team: { min: 1, max: 5 },
    reviewersPerEntry: 3,
    shortlistSize: 5,
    prizes: [{ place: '1st', amount: 40000 }, { place: '2nd', amount: 25000 }, { place: '3rd', amount: 15000 }, { place: '4th', amount: 10000 }, { place: '5th', amount: 5000 }],
    sectors: ['Digital & technology'],
    eligibility: DEMO_RULES['ceda-portal-hackathon-2026'],
  });
  const youth = standardDefinition({ kind: 'ideas', eligibility: DEMO_RULES['youth-innovation-ideas-2026'], prizes: [{ place: 'Up to 20 ideas', amount: 300000 }] });
  const green = standardDefinition({
    stages: [
      { key: 'apply', label: 'Applications open', starts: '2026-08-01', ends: '2026-09-30' },
      { key: 'screen', label: 'Screening', starts: '2026-10-01', ends: '2026-10-07' },
      { key: 'score', label: 'Independent scoring', starts: '2026-10-08', ends: '2026-11-15' },
      { key: 'panel', label: 'Panel decision', starts: '2026-11-16', ends: '2026-11-30' },
      { key: 'award', label: 'Awards and onboarding', starts: '2026-12-01', ends: '2026-12-18' },
    ],
    sectors: ['Green energy & climate', 'Agriculture & agro-processing'],
    prizes: [{ place: 'Grants up to P250,000 each', amount: 1500000 }],
    eligibility: DEMO_RULES['green-economy-call-2026'],
  });
  const staffDef = standardDefinition({ audience: 'staff', kind: 'ideas', eligibility: {}, team: { min: 1, max: 4 }, reviewersPerEntry: 2, shortlistSize: 3, prizes: [{ place: 'Implementation budget', amount: 100000 }],
    form: [
      { key: 'problem', label: 'Which CEDA process could work better?', type: 'textarea', required: true, maxWords: 200 },
      { key: 'solution', label: 'Your idea', type: 'textarea', required: true, maxWords: 300 },
      { key: 'saving', label: 'Estimated hours or Pula saved per year', type: 'number', required: true },
    ],
    rubric: [
      { key: 'value', label: 'Value to CEDA clients', weight: 40, guide: 'Will clients notice the difference?' },
      { key: 'saving', label: 'Time or money saved', weight: 35, guide: 'Is the saving real and measurable?' },
      { key: 'ease', label: 'Ease of putting it in place', weight: 25, guide: 'Can we do it within six months?' },
    ] });
  const bdihDef = standardDefinition({ kind: 'accelerator', eligibility: DEMO_RULES['bdih-digital-leap-2026'], sectors: ['Digital & technology', 'Health & wellness', 'Green energy & climate'], prizes: [{ place: 'Accelerator places and grants', amount: 225000 }], reviewersPerEntry: 2 });
  const btcDef = standardDefinition({ kind: 'hackathon', eligibility: DEMO_RULES['btc-5g-iot-2026'], sectors: ['Digital & technology', 'Agriculture & agro-processing'], prizes: [{ place: '1st', amount: 75000 }, { place: '2nd', amount: 50000 }, { place: '3rd', amount: 25000 }], reviewersPerEntry: 2 });

  const mk = (spaceId: string, slug: string, name: string, tagline: string, description: string, def: InstanceDefinition, photo: string, extra: Partial<typeof schema.instances.$inferInsert> = {}) => ({
    spaceId, slug, name, tagline, description, definition: def, rulesHash: rulesHash(def), photo, status: 'live' as const,
    opensAt: new Date(def.stages[0].starts), closesAt: new Date(def.stages.at(-1)!.ends), createdById: admin.id, ...extra,
  });
  const inst = await db.insert(schema.instances).values([
    mk(ceda.id, 'ceda-portal-hackathon-2026', 'CEDA Innovation Management Portal Hackathon 2026', 'Build the portal that will run CEDA’s innovation funding.', 'Design, build and deploy a secure, easy innovation management portal for CEDA. Open to registered businesses owned by citizen youth (18 to 35), in teams of 1 to 5.', hackathon, '/photos/team-coding.webp', { featured: true }),
    mk(ceda.id, 'youth-innovation-ideas-2026', 'CEDA Youth Innovation Ideas 2026', 'Got an idea that could become a business? Start here.', 'A national ideas call for young citizens. Winning ideas receive seed funding, mentoring and a place in CEDA’s pipeline.', youth, '/photos/young-makers.webp'),
    mk(ceda.id, 'green-economy-call-2026', 'Green Economy Fund 2026', 'Clean energy, water and climate-smart farming.', 'Grants for citizen-owned businesses that cut emissions, save water or help farmers adapt to drought.', green, '/photos/okavango-aerial.webp'),
    mk(ceda.id, WOMEN.slug, WOMEN.name, WOMEN.tagline, WOMEN.description, WOMEN.def(), WOMEN.photo),
    mk(ceda.id, 'staff-intrapreneurship-2026', 'CEDA Staff Intrapreneurship 2026', 'CEDA staff: improve how we serve clients.', 'An internal campaign for CEDA employees. The best ideas get a budget and time to put them in place.', staffDef, '/photos/founders-meeting.webp'),
    mk(bdih.id, 'bdih-digital-leap-2026', 'BDIH Digital Leap Accelerator 2026', 'Scale-ups in AI, GovTech and climate tech.', 'Demo partner Instance: a six-month accelerator run by BDIH on the same platform, with its own colours and evaluators.', bdihDef, '/photos/lab-drone.webp'),
    mk(btc.id, 'btc-5g-iot-2026', 'BTC 5G & IoT Challenge 2026', 'Smart utilities and connected farms on 5G.', 'Demo partner Instance: build IoT solutions on BTC’s network for utilities and agriculture.', btcDef, '/photos/soldering.webp'),
    mk(ceda.id, 'tourism-creative-2027', 'Tourism & Creative Industries 2027', 'Opening in 2027.', 'Draft call being prepared by the CEDA team.', standardDefinition({ sectors: ['Tourism & creative'], eligibility: DEMO_RULES['tourism-creative-2027'] }), '/photos/mokoro.webp', { status: 'draft' }),
  ]).returning();
  const I = (slug: string) => inst.find((x) => x.slug === slug)!;
  for (const x of inst) await db.insert(schema.instanceVersions).values({ instanceId: x.id, version: 1, reason: 'First published', definition: x.definition, rulesHash: x.rulesHash, byId: admin.id, createdAt: at(-60) });
  await db.insert(schema.instanceRoles).values([
    ...inst.flatMap((x) => [{ userId: admin.id, instanceId: x.id, role: 'organiser' as const }]),
    ...inst.flatMap((x) => evaluators.map((e) => ({ userId: e.id, instanceId: x.id, role: 'evaluator' as const }))),
    ...inst.flatMap((x) => panel.map((p) => ({ userId: p.id, instanceId: x.id, role: 'panel' as const }))),
    { userId: U('partner@demo.ceda.bw').id, instanceId: I('bdih-digital-leap-2026').id, role: 'organiser' },
    { userId: U('observer@demo.ceda.bw').id, instanceId: I('ceda-portal-hackathon-2026').id, role: 'observer' },
  ]);

  // ── Entries ─────────────────────────────────────────────────────────────
  const ideas: [string, string, string][] = [
    ['SoilSense: low-cost soil moisture for smallholders', 'Agriculture & agro-processing', 'Solar sensors tell farmers by SMS when to irrigate, cutting water use by a third.'],
    ['Morula Gold cosmetics line', 'Agriculture & agro-processing', 'Cold-pressed morula oil skincare made in Serowe for export.'],
    ['TaxiPay: cashless combi fares', 'Digital & technology', 'Tap-to-pay fares for combis using Orange Money and cards.'],
    ['Kgotla Connect', 'Digital & technology', 'USSD civic participation for villages without smartphones.'],
    ['Delta Stays booking engine', 'Tourism & creative', 'Direct booking for community campsites in the Okavango.'],
    ['SunCold mobile cold rooms', 'Green energy & climate', 'Solar cold storage on trailers for vegetable farmers.'],
    ['Lesedi solar kiosks', 'Green energy & climate', 'Pay-as-you-go phone charging and lighting for cattle posts.'],
    ['Mokoro Digital Guides', 'Tourism & creative', 'Audio guides in Setswana and English for heritage sites.'],
    ['Thuso Health triage', 'Health & wellness', 'Symptom checker that books clinic slots by SMS.'],
    ['Phane protein snacks', 'Agriculture & agro-processing', 'Mopane worm protein bars for schools and gyms.'],
    ['BuildBW brick recycling', 'Manufacturing', 'Turns construction rubble into certified paving bricks.'],
    ['Kasi Tailors marketplace', 'Services & retail', 'Connects township tailors with school uniform orders.'],
    ['AquaTrack leak detection', 'Green energy & climate', 'Smart meters that find water leaks in council pipes.'],
    ['MinePro safety wearables', 'Mining services', 'Gas and fatigue alerts for underground miners.'],
    ['Beef traceability on blockchain', 'Agriculture & agro-processing', 'Tracks cattle from farm to export for EU compliance.'],
    ['Setswana voice assistant', 'Digital & technology', 'Voice-first banking and government services in Setswana.'],
    ['Craft Botswana online store', 'Tourism & creative', 'Basket weavers sell directly to international buyers.'],
    ['Drought-proof fodder', 'Agriculture & agro-processing', 'Hydroponic fodder units for dry-season cattle feed.'],
    ['EduBox offline learning', 'Digital & technology', 'Raspberry Pi servers bringing lessons to remote schools.'],
    ['GreenGrease biodiesel', 'Green energy & climate', 'Restaurant oil turned into biodiesel for farm vehicles.'],
    ['Pula Ledger for SMEs', 'Digital & technology', 'Bookkeeping by WhatsApp for informal traders.'],
    ['Sorghum craft beer', 'Manufacturing', 'Premium sorghum lager brewed in Palapye.'],
    ['RideShare Maun', 'Services & retail', 'Shared rides between Maun and the villages.'],
    ['Clinic queue SMS', 'Health & wellness', 'Patients wait at home and get an SMS when it is their turn.'],
    ['Solar water pumps leasing', 'Green energy & climate', 'Lease-to-own solar pumps for boreholes.'],
    ['Diamond-cutting training app', 'Mining services', 'VR training for diamond polishers.'],
    ['Moringa tea brand', 'Agriculture & agro-processing', 'Organic moringa tea grown in the Tuli Block.'],
    ['Kgalagadi eco-lodge', 'Tourism & creative', 'Off-grid eco-lodge run by a community trust.'],
    ['ParcelPoint lockers', 'Services & retail', 'Collection lockers at filling stations for online orders.'],
    ['FarmHire tractors', 'Agriculture & agro-processing', 'Book a tractor and driver by the hour.'],
    ['Plastic-to-poles', 'Manufacturing', 'Fencing poles from recycled plastic waste.'],
    ['CodeCamp BW', 'Digital & technology', 'Bootcamps that place graduates in remote jobs.'],
  ];
  const hackTeams = ['Team Pula Stack', 'Kgotla Coders', 'Delta Devs', 'Morula Labs', 'Sechaba Tech', 'Thuto Builders', 'Lesedi Digital', 'Phakela Systems', 'Tswelelo Apps', 'Boswa Engineers'];

  const pool: { instance: typeof inst[number]; title: string; sector: string; summary: string; status: EntryStatus; owner: typeof users[number] }[] = [];
  const statuses: EntryStatus[] = ['submitted', 'screening', 'in_review', 'in_review', 'in_review', 'returned', 'shortlisted', 'awarded', 'declined', 'in_review'];
  let n = 0;
  const kagiso = U('innovator@demo.ceda.bw');
  // Kagiso's own entries show every state an innovator meets.
  pool.push({ instance: I('green-economy-call-2026'), title: ideas[0][0], sector: ideas[0][1], summary: ideas[0][2], status: 'returned', owner: kagiso });
  pool.push({ instance: I('youth-innovation-ideas-2026'), title: 'Kagiso’s draft: Seed bank app', sector: 'Agriculture & agro-processing', summary: 'Farmers swap and track indigenous seed varieties.', status: 'draft', owner: kagiso });
  pool.push({ instance: I('green-economy-call-2026'), title: ideas[5][0], sector: ideas[5][1], summary: ideas[5][2], status: 'awarded', owner: kagiso });
  for (const [title, sector, summary] of ideas.slice(1)) {
    if (title === ideas[5][0]) continue;
    const instance = sector.startsWith('Green') ? I('green-economy-call-2026') : n % 4 === 0 ? I('bdih-digital-leap-2026') : n % 5 === 0 ? I('btc-5g-iot-2026') : I('youth-innovation-ideas-2026');
    const status = instance.slug === 'green-economy-call-2026' ? pick(['in_review', 'shortlisted', 'awarded', 'declined', 'in_review'] as EntryStatus[]) : statuses[n % statuses.length];
    pool.push({ instance, title, sector, summary, status, owner: innovators[n % innovators.length] });
    n++;
  }
  hackTeams.forEach((t, i) => pool.push({ instance: I('ceda-portal-hackathon-2026'), title: `${t}: innovation portal`, sector: 'Digital & technology', summary: `${t}’s entry to the portal hackathon.`, status: i < 7 ? 'submitted' : 'draft', owner: innovators[(i + 7) % innovators.length] }));
  ['Digital loan status tracker', 'Branch visit booking', 'One-page credit memo template'].forEach((t, i) => pool.push({ instance: I('staff-intrapreneurship-2026'), title: t, sector: 'Services & retail', summary: 'Staff idea to improve client service.', status: (['in_review', 'shortlisted', 'submitted'] as EntryStatus[])[i], owner: U('staff@demo.ceda.bw') }));

  let refNo = 101;
  for (const p of pool) {
    const def = p.instance.definition;
    const answers: Record<string, string> = {};
    for (const f of def.form) {
      if (f.type === 'file') continue;
      answers[f.key] = f.type === 'number' ? String(f.key === 'funding' ? between(5, 30) * 10000 : between(2, 40)) : f.type === 'url' ? 'https://example.org/demo' : f.key === 'problem' ? `${p.summary} Today people lose time and money because nothing local solves this well.` : f.key === 'solution' ? `${p.title.split(':')[0]} ${p.summary.charAt(0).toLowerCase()}${p.summary.slice(1)} We start in ${pick(DISTRICTS)} and grow district by district.` : `${p.summary} (detail)`;
    }
    const submitted = p.status !== 'draft';
    const submittedAt = submitted ? at(-between(5, 40)) : null;
    const seal = submitted ? sha256(canonical({ title: p.title, answers })) : null;
    const ref = `CEDA-26-${String(refNo++).padStart(4, '0')}`;
    const [e] = await db.insert(schema.entries).values({
      ref, instanceId: p.instance.id, innovatorId: p.owner.id, title: p.title, summary: p.summary, sector: p.sector, district: p.owner.district ?? pick(DISTRICTS), answers, status: p.status,
      team: [{ name: p.owner.name, email: p.owner.email, lead: true, share: 100, role: 'Founder' }],
      version: submitted ? (p.status === 'returned' ? 1 : 1) : 0, sealHash: seal, rulesHashAtSubmit: submitted ? p.instance.rulesHash : null, submittedAt,
      showcase: p.status === 'awarded', cheers: between(0, 40), createdAt: at(-between(41, 60)), updatedAt: at(-between(0, 4)),
    }).returning();
    if (submitted) {
      await db.insert(schema.entryVersions).values({ entryId: e.id, version: 1, title: p.title, answers, sealHash: seal!, createdAt: submittedAt! });
      await db.insert(schema.checks).values([
        { entryId: e.id, key: 'complete', label: 'All required answers given', status: 'pass', detail: 'Every required question answered.' },
        { entryId: e.id, key: 'eligibility', label: 'Eligibility', status: 'pass', detail: 'Citizen, age and ownership rules met.' },
        { entryId: e.id, key: 'files', label: 'Uploaded files', status: 'pass', detail: 'PDF, real file type confirmed.' },
      ]);
    }
    // Evaluations for anything past screening.
    if (['in_review', 'returned', 'shortlisted', 'awarded', 'declined'].includes(p.status)) {
      const k = def.reviewersPerEntry; const start = between(0, evaluators.length - 1);
      const quality = p.status === 'awarded' ? 8 : p.status === 'shortlisted' ? 7.4 : p.status === 'declined' ? 4.2 : 6;
      for (let j = 0; j < k; j++) {
        const ev = evaluators[(start + j) % evaluators.length];
        const harsh = ev.email === 'evaluator3@demo.ceda.bw' ? -1.6 : ev.email === 'evaluator5@demo.ceda.bw' ? 1.2 : 0;
        const done = p.status !== 'in_review' || j < k - 1 || rnd() > 0.5;
        const scores = Object.fromEntries(def.rubric.map((c) => [c.key, Math.max(0, Math.min(10, Math.round(quality + harsh + (rnd() - 0.5) * 3)))]));
        const isDemoEval = ev.email === 'evaluator@demo.ceda.bw' && p.status === 'in_review';
        await db.insert(schema.evaluations).values({
          entryId: e.id, evaluatorId: ev.id, dueAt: at(between(2, 10)), conflict: done && !isDemoEval ? false : null,
          scores: done && !isDemoEval ? scores : null, total: done && !isDemoEval ? weightedTotal(def.rubric, scores) : null,
          feedback: done && !isDemoEval ? pick(['Clear problem and a credible first market. Show more evidence that customers will pay.', 'Strong team. The budget needs milestones linked to each tranche.', 'Good social impact; the revenue model is still thin.', 'Well argued and realistic. Pilot results would strengthen it.']) : null,
          submittedAt: done && !isDemoEval ? at(-between(1, 5)) : null, createdAt: at(-between(6, 10)),
        });
      }
      const evs = await db.select().from(schema.evaluations).where(sql`entry_id = ${e.id} and total is not null`);
      if (evs.length) await db.update(schema.entries).set({ score: Math.round(evs.reduce((a, b) => a + (b.total ?? 0), 0) / evs.length * 10) / 10 }).where(sql`id = ${e.id}`);
    }
    if (p.status === 'awarded' || p.status === 'declined') {
      const amount = p.status === 'awarded' ? between(8, 25) * 10000 : null;
      for (const m of panel) await db.insert(schema.votes).values({ entryId: e.id, userId: m.id, vote: p.status === 'awarded' ? 'award' : 'decline', amount, note: null, createdAt: at(-3) });
      await db.update(schema.entries).set({ awardAmount: amount, awardCode: amount ? shortCode(`${ref}:${amount}`) : null, decidedAt: at(-2), decisionNote: p.status === 'awarded' ? 'Strong, fundable plan with clear jobs impact.' : 'Promising, but the market evidence is too thin for this round. Please apply again.' }).where(sql`id = ${e.id}`);
    }
    if (p.status === 'returned') {
      await db.insert(schema.messages).values([
        { entryId: e.id, authorId: admin.id, kind: 'revision_request', body: 'Thank you for a strong application. Before scoring continues, please (1) add the cost per sensor and (2) say how farmers will pay. Then resubmit.', createdAt: at(-3) },
        { entryId: e.id, authorId: p.owner.id, kind: 'message', body: 'Thank you. I will add the unit costs from our pilot in Lobatse.', createdAt: at(-2) },
      ]);
    } else if (submitted && rnd() > 0.5) {
      await db.insert(schema.messages).values({ entryId: e.id, authorId: admin.id, kind: 'message', body: 'Received with thanks. We will update you at each step.', createdAt: at(-between(3, 20)) });
    }
  }
  // Panel votes on shortlisted entries are partly in, so the demo panel member has something to do.
  const shortlisted = await db.select().from(schema.entries).where(sql`status = 'shortlisted'`);
  for (const e of shortlisted) for (const m of panel.slice(1)) await db.insert(schema.votes).values({ entryId: e.id, userId: m.id, vote: rnd() > 0.3 ? 'award' : 'discuss', amount: between(10, 25) * 10000 });

  // ── Content ─────────────────────────────────────────────────────────────
  const faqs: [string, string, string][] = [
    ['Applying', 'Who can apply?', 'Each call lists its own rules. Most CEDA calls are for Botswana citizens aged 18 to 35 whose company is registered with CIPA and is more than half owned by citizen youth. Use “Am I eligible?” on any call to check in 30 seconds.'],
    ['Applying', 'Does it cost anything?', 'No. Applying, tracking and alerts are free.'],
    ['Applying', 'Can I save and finish later?', 'Yes. Your answers save as you type, even if the connection drops. Nothing is sent until you press Submit.'],
    ['Applying', 'Can I apply as a team?', 'Yes, if the call allows it. Add team members on the Team step; one person is the team lead.'],
    ['Judging', 'Who scores my application?', 'Independent evaluators who have declared they have no conflict of interest. They see your idea, not your name, and score it against the criteria published on the call.'],
    ['Judging', 'Can the rules change after I apply?', 'Every call’s rules are sealed with a fingerprint. If CEDA must change them, the change, the reason and the new fingerprint are published on the call page.'],
    ['Judging', 'Will I get feedback?', 'Yes. Every evaluator writes feedback for you, and you can reply and resubmit when CEDA asks for changes.'],
    ['Tracking', 'How do I follow my application?', 'Use your reference (for example CEDA-26-0101) on the Track page. Sign up there for free email or SMS alerts; no account needed.'],
    ['Account', 'I forgot my password', 'Choose “Forgot password” on the sign-in page. We send a code to your email or phone.'],
    ['Account', 'Can I sign in with my fingerprint?', 'Yes. After signing in once, add a passkey in your profile. Next time, choose “Sign in with a passkey”.'],
    ['Privacy', 'What do you do with my data?', 'We use it only to run the calls you enter, under the Data Protection Act 2024. You can download or ask us to erase your data from your profile.'],
  ];
  await db.insert(schema.content).values([
    ...faqs.map(([category, title, body], i) => ({ kind: 'faq' as const, category, title, body, sort: i, updatedById: admin.id })),
    { kind: 'page', slug: 'about', title: 'About this portal', body: 'CEDA funds and grows citizen-owned businesses. This portal is where ideas enter CEDA’s pipeline: you apply online, independent evaluators score you fairly, and you can see where your application is at every step.\n\nPartners such as BDIH and BTC run their own challenges here too, each in its own space, on the same trusted rules.', updatedById: admin.id },
    { kind: 'notice', title: 'Beware of anyone asking for money to “guarantee” funding', body: 'CEDA never charges to apply and never asks for payment by phone or WhatsApp. Report it to us.', category: 'Safety', updatedById: admin.id },
    { kind: 'notice', title: 'Hackathon submissions close 23 November at 17:00', body: 'Upload your technical proposal and demo link before the deadline. Late submissions cannot be accepted.', category: 'Deadline', updatedById: admin.id },
    { kind: 'document', title: 'Hackathon brief (summary)', body: 'What the portal must do, and how it is scored.', category: 'Hackathon', url: '/judges', updatedById: admin.id },
    { kind: 'document', title: 'How evaluation works', body: 'Screening, blind scoring, calibration and panel decisions.', category: 'Guides', url: '/how-it-works', updatedById: admin.id },
  ]);

  // ── Community ───────────────────────────────────────────────────────────
  const threadData: [string, string, string][] = [
    ['Pitching', 'How long should my pitch deck be?', 'The calls say 10 pages max. Is it better to use all 10 or keep it short?'],
    ['Teams', 'Looking for a developer co-founder in Francistown', 'I run a logistics business and need someone who can build a booking app.'],
    ['Regulation', 'Do I need NBFIRA approval for a savings app?', 'Our app helps stokvels save together. Which regulator do we talk to first?'],
    ['Pitching', 'Tips from last year’s winners', 'Happy to share what worked for us. Ask anything.'],
    ['Funding', 'What happens after the award?', 'Is the money paid all at once or in parts?'],
  ];
  for (const [category, title, body] of threadData) {
    const [t] = await db.insert(schema.threads).values({ category, title, body, authorId: pick(innovators).id, pinned: title.startsWith('Tips'), createdAt: at(-between(2, 30)) }).returning();
    for (let r = 0; r < between(1, 4); r++) await db.insert(schema.replies).values({ threadId: t.id, authorId: rnd() > 0.7 ? U('consultant@demo.ceda.bw').id : pick(innovators).id, body: pick(['Great question. Keep it short and lead with the problem.', 'Funding is released in tranches tied to milestones.', 'Start with the Bank of Botswana sandbox, then NBFIRA.', 'Happy to help. Send me a message.', 'We used 8 pages and the panel liked that.']), createdAt: at(-between(0, 2)) });
  }

  // ── Live chat history (for analytics) ───────────────────────────────────
  const consultants = users.filter((u) => u.role === 'consultant');
  const topics = ['Eligibility', 'Documents', 'Technical problem', 'Application status', 'Funding', 'General'];
  for (let i = 0; i < 60; i++) {
    const startedAt = at(-between(1, 45), between(-5, 5));
    const offline = rnd() < 0.15;
    const c = pick(consultants);
    const [chat] = await db.insert(schema.chats).values({ userId: pick(innovators).id, topic: pick(topics), consultantId: offline ? null : c.id, status: offline ? 'offline' : 'closed', rating: offline ? null : between(3, 5), createdAt: startedAt, firstReplyAt: offline ? null : new Date(startedAt.getTime() + between(15, 240) * 1000), closedAt: offline ? null : new Date(startedAt.getTime() + between(4, 25) * 60_000) }).returning();
    await db.insert(schema.chatMessages).values([
      { chatId: chat.id, from: 'user', body: 'Hello, I have a question about my application.', createdAt: startedAt },
      offline ? { chatId: chat.id, from: 'system', body: 'Our consultants are offline. We will reply by email on the next working day.', createdAt: startedAt } : { chatId: chat.id, from: 'consultant', authorId: c.id, body: 'Dumela! Happy to help. What is your reference?', createdAt: new Date(startedAt.getTime() + 60_000) },
    ]);
  }
  const [waiting] = await db.insert(schema.chats).values({ userId: innovators[3].id, topic: 'Documents', status: 'waiting', createdAt: at(0, -0.1) }).returning();
  await db.insert(schema.chatMessages).values({ chatId: waiting.id, from: 'user', body: 'Can I upload my pitch deck as PowerPoint instead of PDF?', createdAt: at(0, -0.1) });

  // ── Support tickets ─────────────────────────────────────────────────────
  const tk: ['P1' | 'P2' | 'P3' | 'P4', string, string, 'open' | 'in_progress' | 'resolved'][] = [
    ['P2', 'Cannot upload pitch deck', 'The upload stops at 90% on my phone.', 'resolved'],
    ['P3', 'Wrong district on my profile', 'I moved to Maun; please update it.', 'resolved'],
    ['P4', 'Add Setswana to the form', 'Can the application form be in Setswana too?', 'in_progress'],
    ['P2', 'Did not receive the code', 'SMS code never arrived on my Mascom number.', 'open'],
  ];
  for (const [sev, subject, body, status] of tk) {
    const created = at(-between(1, 10));
    const t = slaTargets(sev, created);
    await db.insert(schema.tickets).values({ ref: `SUP-${between(1000, 9999)}`, name: pick(innovators).name, contact: 'reporter@example.org', severity: sev, category: 'Portal', subject, body, status, createdAt: created, ...t, firstResponseAt: status !== 'open' ? new Date(created.getTime() + 40 * 60_000) : null, resolvedAt: status === 'resolved' ? new Date(created.getTime() + 5 * 3600_000) : null, resolution: status === 'resolved' ? 'Fixed and confirmed with the user.' : null });
  }

  await db.insert(schema.settings).values([
    { key: 'theme', value: DEFAULT_THEME },
    { key: 'regulators', value: REGULATORS },
    { key: 'eligibility_v2', value: true },
  ]);

  // ── Audit trail ─────────────────────────────────────────────────────────
  await appendAudit({ actorName: 'System', action: 'platform.seeded', detail: { users: users.length, instances: inst.length, entries: pool.length } });
  for (const x of inst) await appendAudit({ actorId: admin.id, actorName: admin.name, action: 'instance.published', instanceId: x.id, detail: { name: x.name, rulesHash: x.rulesHash, version: 1 } });
  const all = await db.select().from(schema.entries).orderBy(schema.entries.submittedAt);
  for (const e of all) if (e.submittedAt) await appendAudit({ actorId: e.innovatorId, actorName: 'Innovator', action: 'entry.submitted', instanceId: e.instanceId, entryId: e.id, detail: { ref: e.ref, seal: e.sealHash } });
  for (const e of all) if (e.status === 'awarded') await appendAudit({ actorId: panel[0].id, actorName: panel[0].name, action: 'entry.awarded', instanceId: e.instanceId, entryId: e.id, detail: { ref: e.ref, amount: e.awardAmount, code: e.awardCode } });

  console.log(`Done: ${users.length} users, ${inst.length} instances, ${pool.length} entries. Password for every demo account: ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
